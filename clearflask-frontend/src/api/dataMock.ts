import { loremIpsum } from "lorem-ipsum";
import * as Admin from "./admin";
import ServerMock from "./serverMock";

class DataMock {
  projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  static get(projectId: string): DataMock {
    return new DataMock(projectId);
  }

  demoPrioritization() {
    return Promise.all([
      this.mockLoggedIn(40),
      this.getConfig()
        .then(config =>
          this.mockUser('John Doe')
            .then(user =>
              ServerMock.get().ideaCreateAdmin({
                projectId: this.projectId,
                ideaCreateAdmin: {
                  authorUserId: user.userId,
                  title: 'Support Jira integration',
                  description: 'I would like to be able to synchronize user ideas with my Jira board',
                  categoryId: config.content.categories[0].categoryId,
                  tagIds: [],
                  ...{ // Fake data
                    funded: 12,
                    fundersCount: 5,
                    fundGoal: 60,
                    voteValue: 3,
                    votersCount: 2,
                    expressionsValue: 7,
                    expressions: {
                      '👍': 4,
                      '❤️': 1,
                    },
                  },
                },
              }))),
    ]);
  }

  mockAll(): Promise<any> {
    return this.mockAccountCreate()
      .then(() => this.mockLoggedIn())
      .then(userMe =>
        this.mockItems(userMe)
          .then(() => this.mockNotification(userMe)));
  }

  mockNotification(userMe: Admin.User): Promise<any> {
    ServerMock.get().addNotification(
      this.projectId,
      userMe,
      'Welcome to your first notification',
    );
    return Promise.resolve();
  }

  mockAccountCreate(): Promise<Admin.AccountAdmin> {
    return ServerMock.get().accountSignupAdmin({
      accountSignupAdmin: {
        planid: '7CC22CC8-16C5-49DF-8AEB-2FD98D9059A7',
        company: 'A.C.M.E. LLC',
        name: 'John Doe',
        email: 'a@a.a',
        phone: '89032789',
        password: 'pass',
        paymentToken: 'fakeToken',
      }
    });
  }

  mockLoggedIn(bankBalance: number = 10000): Promise<Admin.UserMeWithBalance> {
    return ServerMock.get().userCreate({
      projectId: this.projectId,
      userCreate: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password',
        iosPushToken: 'fake-ios-push-token',
        // browserPushToken: 'fake-browser-push-token',
      }
    }).then(userMe => {
      ServerMock.get().transactionCreateAdmin({
        projectId: this.projectId,
        userId: userMe.userId,
        transactionCreateAdmin: {
          amount: bankBalance,
          summary: 'Mock amount given, spend it wisely',
        },
      });
      return userMe;
    });
  }

  mockItems(userMe?: Admin.UserMeWithBalance): Promise<any> {
    return ServerMock.get().configGetAdmin({ projectId: this.projectId })
      .then((versionedConfig: Admin.VersionedConfigAdmin) => {
        const promises: Promise<any>[] = [];
        versionedConfig.config.content.categories.forEach((category: Admin.Category) => {
          [undefined, ...category.workflow.statuses].forEach((status: Admin.IdeaStatus | undefined) => {
            var n = 4;
            while (n-- > 0) {
              promises.push((userMe && n === 1 ? Promise.resolve(userMe) : this.mockUser())
                .then((user: Admin.User) =>
                  this.mockIdea(versionedConfig, category, status, user)
                )
              );
            }
          });
        });
        return Promise.all(promises);
      });
  }

  mockUser(name?: string): Promise<Admin.UserAdmin> {
    return ServerMock.get().userCreateAdmin({
      projectId: this.projectId,
      userCreateAdmin: {
        name: name || loremIpsum({
          units: 'words',
          count: 2,
        }),
        email: 'example@example.com',
      },
    });
  }

  mockIdea(versionedConfig: Admin.VersionedConfigAdmin, category: Admin.Category, status: Admin.IdeaStatus | undefined, user: Admin.User): Promise<any> {
    return ServerMock.get().ideaCreateAdmin({
      projectId: this.projectId,
      ideaCreateAdmin: {
        ...this.fakeMockIdeaData(category),
        authorUserId: user.userId,
        title: loremIpsum({
          units: 'words',
          count: Math.round(Math.random() * 10 + 3),
        }),
        description: loremIpsum({
          units: 'paragraphs',
          count: Math.round(Math.random() * 3 + 1),
        }),
        response: Math.random() < 0.3 ? undefined : loremIpsum({
          units: 'words',
          count: Math.round(Math.random() * 10 + 3),
        }),
        categoryId: category.categoryId,
        tagIds: Math.random() < 0.3 ? [] : category.tagging.tags
          .filter(t => Math.random() < 0.3)
          .map(t => t.tagId),
        statusId: status ? status.statusId : undefined,
      },
    })
      .then((item: Admin.Idea) => category.support.comment && this.mockComments([user], versionedConfig, category, item))
  }

  fakeMockIdeaData(category: Admin.Category): Partial<Admin.Idea> {
    return {
      ...(Math.random() < 0.5 ? {
        funded: Math.round(Math.random() * 50000),
        fundersCount: Math.round(Math.random() * 100),
      } : {}),
      ...(Math.random() < 0.5 ? {
        fundGoal: Math.round(Math.random() * 10) * 5000,
      } : {}),
      ...(Math.random() < 0.9 ? {
        votersCount: Math.round(Math.random() * 30),
        voteValue: Math.round(Math.random() * 1000) - 300,
      } : {}),
      ...(Math.random() < 0.9 ? {
        expressionsValue: Math.random() * 10,
        expressions: this.fakeExpressions(category),
      } : {}),
    };
  }

  fakeExpressions(category: Admin.Category, count: number = 40): { [key: string]: number; } {
    const expressions: { [key: string]: number; } = {};
    const availableEmojis = (category.support.express && category.support.express.limitEmojiSet)
      ? category.support.express.limitEmojiSet.map(e => e.display)
      : ['😀', '😁', '🤣', '😉', '😍', '😝', '😕', '😱', '💩', '🙀', '❤', '👍'];
    while (count > 0) {
      const emoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
      const amount = Math.max(1, Math.floor(count * 0.6), Math.floor(Math.random() * count));
      count -= amount;
      expressions[emoji] = (expressions[emoji] || 0) + amount;
    }
    return expressions;
  }

  mockComments(userMentionPool: Admin.User[], versionedConfig: Admin.VersionedConfigAdmin, category: Admin.Category, item: Admin.Idea, numComments: number = 1, level: number = 2, parentComment: Admin.Comment | undefined = undefined): Promise<any> {
    return this.mockUser()
      .then(user => {
        userMentionPool.push(user);
        return user;
      })
      .then(user => ServerMock.get().commentCreate({
        projectId: this.projectId,
        ideaId: item.ideaId,
        commentCreate: {
          content: this.mockMention(userMentionPool) + loremIpsum({
            units: 'sentences',
            count: Math.round(Math.random() * 3 + 1),
          }),
          parentCommentId: parentComment ? parentComment.commentId : undefined,
        },
        ...{ // override author
          author: user,
        },
      }))
      .then(comment => {
        if (Math.random() < 0.1) {
          return ServerMock.get().commentDelete({
            projectId: this.projectId,
            ideaId: item.ideaId,
            commentId: comment.commentId,
          })
            .then(() => comment);
        }
        if (Math.random() < 0.2) {
          return ServerMock.get().commentUpdate({
            projectId: this.projectId,
            ideaId: item.ideaId,
            commentId: comment.commentId,
            commentUpdate: {
              content: this.mockMention(userMentionPool) + loremIpsum({
                units: 'sentences',
                count: Math.round(Math.random() * 3 + 1),
              })
            }
          });
        }
        return comment;
      })
      .then(comment => {
        if (level <= 0) return Promise.resolve();
        var remainingComments = numComments * Math.random();
        var promise: Promise<any> = Promise.resolve();
        while (remainingComments-- > 0) {
          promise = promise.then(() => this.mockComments(userMentionPool, versionedConfig, category, item, numComments, level - 1, comment));
        }
        return promise;
      });
  }

  mockMention(userPool: Admin.User[]): string {
    return Math.random() < 0 // TODO Mentions disabled for now
      ? '@' + userPool[Math.floor(Math.random() * userPool.length)].name + ' '
      : '';
  }

  async getConfig(): Promise<Admin.ConfigAdmin> {
    const versionedConfig = await ServerMock.get().configGetAdmin({ projectId: this.projectId });
    return versionedConfig.config;
  }
}

export default DataMock;
