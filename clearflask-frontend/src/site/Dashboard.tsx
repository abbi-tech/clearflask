import { Button, Collapse, IconButton, isWidthUp, Typography, withWidth, WithWidthProps } from '@material-ui/core';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import EmptyIcon from '@material-ui/icons/BlurOn';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { Elements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure';
import React, { Component } from 'react';
import { connect, Provider } from 'react-redux';
import { Redirect, Route, RouteComponentProps } from 'react-router';
import * as AdminClient from '../api/admin';
import { Status } from '../api/server';
import ServerAdmin, { Project as AdminProject, ReduxStateAdmin } from '../api/serverAdmin';
import { SSO_TOKEN_PARAM_NAME } from '../app/App';
import IdeaExplorer from '../app/comps/IdeaExplorer';
import PostPage from '../app/comps/PostPage';
import SelectionPicker, { Label } from '../app/comps/SelectionPicker';
import UserPage from '../app/comps/UserPage';
import ErrorPage from '../app/ErrorPage';
import LoadingPage from '../app/LoadingPage';
import DividerCorner from '../app/utils/DividerCorner';
import SubscriptionStatusNotifier from '../app/utils/SubscriptionStatusNotifier';
import * as ConfigEditor from '../common/config/configEditor';
import ConfigView from '../common/config/settings/ConfigView';
import Crumbs from '../common/config/settings/Crumbs';
import Menu, { MenuItem, MenuProject } from '../common/config/settings/Menu';
import Page from '../common/config/settings/Page';
import ProjectSettings from '../common/config/settings/ProjectSettings';
import Layout from '../common/Layout';
import { notEmpty } from '../common/util/arrayUtil';
import debounce, { SearchTypeDebounceTime } from '../common/util/debounce';
import { detectEnv, Environment, isProd } from '../common/util/detectEnv';
import { initialWidth } from '../common/util/screenUtil';
import setTitle from '../common/util/titleUtil';
import windowIso from '../common/windowIso';
import ContactPage from './ContactPage';
import BillingPage, { BillingPaymentActionRedirect, BillingPaymentActionRedirectPath } from './dashboard/BillingPage';
import CommentsPage from './dashboard/CommentsPage';
import CreatedPage from './dashboard/CreatedPage';
import CreatePage from './dashboard/CreatePage';
import DashboardHome from './dashboard/DashboardHome';
import SettingsPage from './dashboard/SettingsPage';
import UserSelection from './dashboard/UserSelection';
import UsersPage from './dashboard/UsersPage';
import WelcomePage from './dashboard/WelcomePage';
import DemoApp, { getProject, Project as DemoProject } from './DemoApp';

const SELECTED_PROJECT_ID_LOCALSTORAGE_KEY = 'dashboard-selected-project-id';
const SELECTED_PROJECT_ID_PARAM_NAME = 'projectId';
type QuickViewType = 'user' | 'post';

const styles = (theme: Theme) => createStyles({
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  projectUserSelectorsHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    height: 64,
    alignItems: 'flex-end',
    marginBottom: -1,
  },
  projectUserSelectorHeader: {
    margin: theme.spacing(1, 1, 0),
  },
  projectUserSelectorMenu: {
    margin: theme.spacing(2),
  },
  projectUserSelectorInline: {
  },
  projectUserSelectorInlineInputRoot: {
    fontSize: 'inherit',
  },
  selectProjectLabel: {
    color: theme.palette.text.secondary,
  },
  previewBarText: {
    display: 'flex',
    alignItems: 'center',
  },
  previewEmptyMessage: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.text.hint,
  },
  previewEmptyIcon: {
    fontSize: '3em',
    margin: theme.spacing(3),
  },
  heading: {
    margin: theme.spacing(3, 3, 0),
  },
});
interface Props {
}
interface ConnectProps {
  accountStatus?: Status;
  account?: AdminClient.AccountAdmin;
  isSuperAdmin: boolean;
  configsStatus?: Status;
  bindByProjectId?: { [projectId: string]: AdminClient.ConfigAndBindAllResultByProjectId };
}
interface State {
  currentPagePath: ConfigEditor.Path;
  binding?: boolean;
  selectedProjectId?: string;
  titleClicked?: number
  quickView?: {
    type: QuickViewType;
    id: string;
  }
  accountSearch?: AdminClient.Account[];
  accountSearching?: string;
}
class Dashboard extends Component<Props & ConnectProps & RouteComponentProps & WithStyles<typeof styles, true> & WithWidthProps, State> {
  static stripePromise: Promise<Stripe | null> | undefined;
  unsubscribes: { [projectId: string]: () => void } = {};
  createProjectPromise: Promise<DemoProject> | undefined = undefined;
  createProject: DemoProject | undefined = undefined;
  forcePathListener: ((forcePath: string) => void) | undefined;
  readonly searchAccounts: (newValue: string) => void;

  constructor(props) {
    super(props);

    Dashboard.getStripePromise();

    if (props.accountStatus === undefined) {
      this.state = {
        currentPagePath: [],
        binding: true,
      };
      this.bind();
    } else if (props.accountStatus === Status.FULFILLED && !props.configsStatus) {
      this.state = {
        currentPagePath: [],
      };
      ServerAdmin.get().dispatchAdmin().then(d => d.configGetAllAndUserBindAllAdmin());
    } else {
      this.state = {
        currentPagePath: [],
      };
    }
    const searchAccountsDebounced = debounce(
      (newValue: string) => ServerAdmin.get().dispatchAdmin().then(d => d.accountSearchSuperAdmin({
        accountSearchSuperAdmin: {
          searchText: newValue,
        },
      })).then(result => this.setState({
        accountSearch: result.results,
        ...(this.state.accountSearching === newValue ? { accountSearching: undefined } : {}),
      })).catch(e => {
        if (this.state.accountSearching === newValue) this.setState({ accountSearching: undefined });
      })
      , SearchTypeDebounceTime);
    this.searchAccounts = newValue => {
      this.setState({ accountSearching: newValue });
      searchAccountsDebounced(newValue);
    }
  }

  static getStripePromise(): Promise<Stripe | null> {
    if (!Dashboard.stripePromise) {
      try {
        loadStripe.setLoadParameters({ advancedFraudSignals: false });
      } catch (e) {
        // Frontend reloads in-place and causes stripe to be loaded multiple times
        if (detectEnv() !== Environment.DEVELOPMENT_FRONTEND) {
          throw e;
        }
      };
      Dashboard.stripePromise = loadStripe(isProd()
        ? 'pk_live_6HJ7aPzGuVyPwTX5ngwAw0Gh'
        : 'pk_test_M1ANiFgYLBV2UyeVB10w1Ons');
    }
    return Dashboard.stripePromise;
  }

  async bind() {
    try {
      if (detectEnv() === Environment.DEVELOPMENT_FRONTEND) {
        const mocker = await import(/* webpackChunkName: "mocker" */'../mocker')
        await mocker.mock();
      }
      const dispatcher = await ServerAdmin.get().dispatchAdmin();
      const result = await dispatcher.accountBindAdmin({});
      this.setState({ binding: false })
      if (result.account) {
        dispatcher.configGetAllAndUserBindAllAdmin();
      }
    } catch (er) {
      this.setState({ binding: false });
    }
  }

  componentWillUnmount() {
    Object.values(this.unsubscribes).forEach(unsubscribe => unsubscribe());
  }

  render() {
    if (!this.state.binding && this.props.accountStatus !== Status.FULFILLED && !this.props.account) {
      return (<Redirect to={{
        pathname: "/login",
        state: { ADMIN_LOGIN_REDIRECT_TO: this.props.location }
      }} />);
    } else if (this.props.configsStatus !== Status.FULFILLED || !this.props.bindByProjectId || !this.props.account) {
      return (<LoadingPage />);
    }
    const activePath = this.props.match.params['path'] || '';
    if (activePath === BillingPaymentActionRedirectPath) {
      return (
        <BillingPaymentActionRedirect />
      );
    }
    const activeSubPath = ConfigEditor.parsePath(this.props.match.params['subPath'], '/');
    const projects = Object.keys(this.props.bindByProjectId)
      .map(projectId => ServerAdmin.get()
        .getOrCreateProject(this.props.bindByProjectId![projectId].config,
          this.props.bindByProjectId![projectId].user));
    projects.forEach(project => {
      if (!this.unsubscribes[project.projectId]) {
        this.unsubscribes[project.projectId] = project.subscribeToUnsavedChanges(() => {
          this.forceUpdate();
        });
      }
    });

    const explorerWidth = (this.props.width && isWidthUp('lg', this.props.width, true)) ? 650 : 500;
    const quickViewEnabled = !this.props.width || isWidthUp('md', this.props.width);

    const projectOptions: Label[] = projects.map(p => ({
      label: p.editor.getConfig().name,
      filterString: p.editor.getConfig().name,
      value: p.projectId
    }));
    var selectedLabel: Label | undefined = this.state.selectedProjectId ? projectOptions.find(o => o.value === this.state.selectedProjectId) : undefined;
    if (!selectedLabel) {
      const params = new URL(windowIso.location.href).searchParams;
      const selectedProjectIdFromParams = params.get(SELECTED_PROJECT_ID_PARAM_NAME);
      if (selectedProjectIdFromParams) {
        selectedLabel = projectOptions.find(o => o.value === selectedProjectIdFromParams);
      }
    }
    if (!selectedLabel) {
      const selectedProjectIdFromLocalStorage = localStorage.getItem(SELECTED_PROJECT_ID_LOCALSTORAGE_KEY);
      if (selectedProjectIdFromLocalStorage) {
        selectedLabel = projectOptions.find(o => o.value === selectedProjectIdFromLocalStorage);
      }
    }
    if (activePath === 'create') {
      selectedLabel = undefined;
    } else if (!selectedLabel && projects.length > 0) {
      selectedLabel = { label: projects[0].editor.getConfig().name, value: projects[0].projectId };
    }
    const activeProjectId: string | undefined = selectedLabel?.value;
    const activeProject = projects.find(p => p.projectId === activeProjectId);

    var page;
    var onboarding = false;
    var preview;
    var previewDemo: 'force' | 'ifEmpty' | undefined;
    var previewBar;
    var previewBarInfo;
    var quickViewShow: QuickViewType | undefined;
    var crumbs: { name: string, slug: string }[] | undefined;
    var allowProjectUserSelect: boolean = false;
    var showCreateProjectWarning: boolean = false;
    var hideContentMargins: boolean = false;
    var layoutWidth: React.ComponentProps<typeof Layout>['width'];
    switch (activePath) {
      case '':
        setTitle('Home - Dashboard');
        allowProjectUserSelect = true;
        if (!activeProject) {
          showCreateProjectWarning = true;
          break;
        }
        page = (
          <Provider key={activeProject.projectId} store={activeProject.server.getStore()}>
            <DashboardHome
              server={activeProject.server}
              onClickPost={postId => this.pageClicked(quickViewEnabled, 'post', [postId])}
              onUserClick={userId => this.pageClicked(quickViewEnabled, 'user', [userId])}
            />
          </Provider>
        );
        crumbs = [{ name: 'Home', slug: activePath }];
        break;
      case 'welcome':
        setTitle('Welcome - Dashboard');
        onboarding = true;
        page = (
          <WelcomePage />
        );
        crumbs = [{ name: 'Welcome', slug: activePath }];
        break;
      case 'created':
        setTitle('Success - Dashboard');
        if (!activeProject) {
          showCreateProjectWarning = true;
          break;
        }
        page = (
          <Provider key={activeProject.projectId} store={activeProject.server.getStore()}>
            <CreatedPage key={activeProject.server.getProjectId()} server={activeProject.server} />
          </Provider>
        );
        crumbs = [{ name: 'Project Created', slug: activePath }];
        break;
      case 'posts':
        setTitle('Posts - Dashboard');
        allowProjectUserSelect = true;
        hideContentMargins = true;
        layoutWidth = { target: 'content', width: explorerWidth };
        quickViewShow = 'post';
        if (!activeProject) {
          showCreateProjectWarning = true;
          break;
        }
        page = (
          <Provider key={activeProject.projectId} store={activeProject.server.getStore()}>
            <Typography component='h1' variant='h4' className={this.props.classes.heading}>Post Explorer</Typography>
            <IdeaExplorer
              server={activeProject.server}
              isDashboard
              forceDisablePostExpand
              onClickPost={postId => this.pageClicked(quickViewEnabled, 'post', [postId])}
              onUserClick={userId => this.pageClicked(quickViewEnabled, 'user', [userId])}
              explorer={{
                allowSearch: { enableSort: true, enableSearchText: true, enableSearchByCategory: true, enableSearchByStatus: true, enableSearchByTag: true },
                allowCreate: {},
                search: {},
                display: {},
              }}
            />
          </Provider>
        );
        crumbs = [{ name: 'Post', slug: activePath }];
        break;
      case 'post':
        // Page title set by PostPage
        allowProjectUserSelect = true;
        if (!activeProject) {
          showCreateProjectWarning = true;
          break;
        }
        const postId = activeSubPath && activeSubPath[0] as string || '';
        page = (
          <Provider key={activeProject.projectId} store={activeProject.server.getStore()}>
            <PostPage key={postId} server={activeProject.server} postId={postId} />
          </Provider>
        );
        crumbs = [{ name: 'Posts', slug: 'posts' }];
        break;
      case 'user':
        // Page title set by UserPage
        allowProjectUserSelect = true;
        if (!activeProject) {
          showCreateProjectWarning = true;
          break;
        }
        const userId = activeSubPath && activeSubPath[0] as string || '';
        page = (
          <Provider key={activeProject.projectId} store={activeProject.server.getStore()}>
            <UserPage key={userId} server={activeProject.server} userId={userId} />
          </Provider>
        );
        crumbs = [{ name: 'Users', slug: 'users' }];
        break;
      case 'comments':
        setTitle('Comments');
        allowProjectUserSelect = true;
        hideContentMargins = true;
        layoutWidth = { target: 'content', width: explorerWidth };
        quickViewShow = 'post';
        if (!activeProject) {
          showCreateProjectWarning = true;
          break;
        }
        page = (
          <Provider key={activeProject.projectId} store={activeProject.server.getStore()}>
            <Typography component='h1' variant='h4' className={this.props.classes.heading}>Comment Explorer</Typography>
            <CommentsPage
              server={activeProject.server}
              isDashboard
              onCommentClick={(postId, commentId) => this.pageClicked(quickViewEnabled, 'post', [postId])}
              onUserClick={userId => this.pageClicked(quickViewEnabled, 'user', [userId])}
            />
          </Provider>
        );
        crumbs = [{ name: 'Comments', slug: activePath }];
        break;
      case 'users':
        setTitle('Users - Dashboard');
        allowProjectUserSelect = true;
        hideContentMargins = true;
        layoutWidth = { target: 'content', width: explorerWidth };
        quickViewShow = 'user';
        if (!activeProject) {
          showCreateProjectWarning = true;
          break;
        }
        page = (
          <Provider key={activeProject.projectId} store={activeProject.server.getStore()}>
            <Typography component='h1' variant='h4' className={this.props.classes.heading}>User Explorer</Typography>
            <UsersPage
              server={activeProject.server}
              isDashboard
              onUserClick={userId => this.pageClicked(quickViewEnabled, 'user', [userId])}
            />
          </Provider>
        );
        crumbs = [{ name: 'Users', slug: activePath }];
        break;
      case 'billing':
        setTitle('Billing - Dashboard');
        page = (<BillingPage stripePromise={Dashboard.getStripePromise()} />);
        crumbs = [{ name: 'Billing', slug: activePath }];
        break;
      case 'account':
        setTitle('Account - Dashboard');
        page = (<SettingsPage />);
        crumbs = [{ name: 'Settings', slug: activePath }];
        break;
      case 'help':
        setTitle('Support - Dashboard');
        page = (
          <Route path={`/dashboard/help`} render={props => (
            <ContactPage {...props} />
          )} />
        );
        crumbs = [{ name: 'Settings', slug: activePath }];
        break;
      // @ts-ignore fall-through
      case 'welcome-create':
        onboarding = true;
      case 'create':
        setTitle('Create - Dashboard');
        if (!this.createProjectPromise) {
          this.createProjectPromise = getProject(undefined, undefined, { suppressSetTitle: true });
          this.createProjectPromise.then(project => {
            this.createProject = project;
            this.forceUpdate();
          })
        }
        page = this.createProject && (
          <CreatePage
            previewProject={this.createProject}
            projectCreated={(projectId) => {
              localStorage.setItem(SELECTED_PROJECT_ID_LOCALSTORAGE_KEY, projectId);
              this.setState({ selectedProjectId: projectId }, () => {
                this.pageClicked(quickViewEnabled, 'created');
              });
            }}
          />
        );
        crumbs = [{ name: 'Create', slug: activePath }];
        previewBarInfo = this.createProject && 'Preview with sample data.';
        preview = this.createProject && (
          <DemoApp
            key={this.createProject.server.getStore().getState().conf.ver || 'preview-create-project'}
            server={this.createProject.server}
            settings={{ suppressSetTitle: true }}
          />
        );
        break;
      case 'settings':
        allowProjectUserSelect = true;
        if (!activeProject) {
          setTitle('Settings - Dashboard');
          showCreateProjectWarning = true;
          break;
        }
        try {
          var currentPage = activeProject.editor.getPage(activeSubPath);
        } catch (ex) {
          setTitle('Settings - Dashboard');
          page = (
            <ErrorPage msg='Oops, page failed to load' />
          );
          break;
        }
        if (!!this.forcePathListener
          && activeSubPath.length >= 3
          && activeSubPath[0] === 'layout'
          && activeSubPath[1] === 'pages') {
          const pageIndex = activeSubPath[2];
          const forcePath = '/' + (activeProject.editor.getProperty(['layout', 'pages', pageIndex, 'slug']) as ConfigEditor.StringProperty).value;
          this.forcePathListener(forcePath);
        }
        setTitle(currentPage.getDynamicName());
        page = (
          <Page
            key={currentPage.key}
            page={currentPage}
            editor={activeProject.editor}
            pageClicked={path => this.pageClicked(quickViewEnabled, activePath, path)}
          />
        );
        if (currentPage.path.length <= 0) {
          page = (
            <React.Fragment>
              {page}
              <ProjectSettings
                server={activeProject.server}
                pageClicked={(path, subPath) => this.pageClicked(quickViewEnabled, path, subPath)}
              />
            </React.Fragment>
          );
        }
        previewBarInfo = (
          <div className={this.props.classes.previewBarText}>
            Preview changes live as&nbsp;
            {this.renderProjectUserSelect(activeProject)}
          </div>
        );
        previewDemo = 'force';
        break;
      default:
        setTitle('Page not found');
        crumbs = [];
        page = (
          <ErrorPage msg='Oops, cannot find project' />
        );
        break;
    }
    if (showCreateProjectWarning) {
      page = (
        <ErrorPage msg='Oops, you have to create a project first' />
      );
      this.props.history.replace('/dashboard/welcome');
    }

    if (quickViewEnabled && activeProject) {
      switch (this.state.quickView?.type || quickViewShow) {
        case 'post':
          const postId = this.state.quickView?.id;
          previewBarInfo = !!postId && (
            <div className={this.props.classes.previewBarText}>
              Viewing post as&nbsp;
              {this.renderProjectUserSelect(activeProject)}
            </div>
          );
          preview = postId ? (
            <Provider key={activeProject.projectId} store={activeProject.server.getStore()}>
              <PostPage key={postId} server={activeProject.server} postId={postId}
                suppressSimilar
                PostProps={{
                  onUserClick: userId => this.pageClicked(quickViewEnabled, 'user', [userId]),
                }} />
            </Provider>
          ) : (
            this.renderPreviewEmpty(activePath !== 'comments'
              ? 'No post selected'
              : 'No comment selected')
          );
          break;
        case 'user':
          const userId = this.state.quickView?.id;
          previewBarInfo = !!userId && (
            <div className={this.props.classes.previewBarText}>
              Viewing user profile as&nbsp;
              {this.renderProjectUserSelect(activeProject)}
            </div>
          );
          preview = userId ? (
            <Provider key={activeProject.projectId} store={activeProject.server.getStore()}>
              <UserPage key={userId} server={activeProject.server} userId={userId} />
            </Provider>
          ) : (
            this.renderPreviewEmpty('No user selected')
          );
          break;
      }
    }

    if (!!activeProject
      && (previewDemo === 'force'
        || (previewDemo === 'ifEmpty' && preview === undefined))) {
      preview = (
        <DemoApp
          key={activeProject.configVersion}
          server={activeProject.server}
          settings={{ suppressSetTitle: true }}
          forcePathSubscribe={listener => this.forcePathListener = listener}
        />
      );
    }

    var billingHasNotification: boolean = false;
    switch (this.props.account.subscriptionStatus) {
      case AdminClient.SubscriptionStatus.ActivePaymentRetry:
      case AdminClient.SubscriptionStatus.ActiveNoRenewal:
      case AdminClient.SubscriptionStatus.NoPaymentMethod:
      case AdminClient.SubscriptionStatus.Blocked:
      case AdminClient.SubscriptionStatus.Cancelled:
        billingHasNotification = true;
        break;
      default:
      case AdminClient.SubscriptionStatus.ActiveTrial:
      case AdminClient.SubscriptionStatus.Active:
        break;
    }

    const seenAccountEmails: Set<string> = new Set();
    const curAccountLabel: Label = Dashboard.accountToLabel(this.props.account);
    const accountOptions = [curAccountLabel];
    seenAccountEmails.add(this.props.account.email)
    this.state.accountSearch && this.state.accountSearch.forEach(account => {
      if (!seenAccountEmails.has(account.email)) {
        const label = Dashboard.accountToLabel(account);
        seenAccountEmails.add(account.email);
        accountOptions.push(label);
      }
    });

    const isSelectProjectUserInMenu = !quickViewEnabled;
    const selectProjectUser = (
      <div className={isSelectProjectUserInMenu ? undefined : this.props.classes.projectUserSelectorsHeader}>
        {!!this.props.isSuperAdmin && (
          <SelectionPicker
            disableClearable
            className={isSelectProjectUserInMenu ? this.props.classes.projectUserSelectorMenu : this.props.classes.projectUserSelectorHeader}
            value={[curAccountLabel]}
            forceDropdownIcon={false}
            options={accountOptions}
            helperText={isSelectProjectUserInMenu && 'Current account' || undefined}
            minWidth={50}
            maxWidth={150}
            inputMinWidth={0}
            showTags
            bareTags
            disableFilter
            loading={this.state.accountSearching !== undefined}
            noOptionsMessage='No accounts'
            onFocus={() => {
              if (this.state.accountSearch === undefined
                && this.state.accountSearching === undefined) {
                this.searchAccounts('');
              }
            }}
            onInputChange={(newValue, reason) => {
              if (reason === 'input') {
                this.searchAccounts(newValue);
              }
            }}
            onValueChange={labels => {
              const email = labels[0]?.value;
              if (email && this.props.account?.email !== email) {
                this.setState({
                  binding: true,
                  quickView: undefined,
                });
                ServerAdmin.get().dispatchAdmin().then(d => d.accountLoginAsSuperAdmin({
                  accountLoginAs: {
                    email,
                  },
                })
                  .then(result => {
                    this.setState({ binding: false })
                    return d.configGetAllAndUserBindAllAdmin();
                  }))
                  .catch(e => this.setState({ binding: false }));
              }
            }}
          />
        )}
        {projects.length > 1 && (
          <Collapse in={!!allowProjectUserSelect}>
            <SelectionPicker
              disableClearable
              className={isSelectProjectUserInMenu ? this.props.classes.projectUserSelectorMenu : this.props.classes.projectUserSelectorHeader}
              value={selectedLabel ? [selectedLabel] : []}
              forceDropdownIcon={false}
              options={projectOptions}
              helperText={isSelectProjectUserInMenu && 'Current project' || undefined}
              showTags
              bareTags
              disableInput
              minWidth={50}
              maxWidth={150}
              clearOnBlur
              onValueChange={labels => {
                const selectedProjectId = labels[0]?.value;
                if (selectedProjectId && this.state.selectedProjectId !== selectedProjectId) {
                  localStorage.setItem(SELECTED_PROJECT_ID_LOCALSTORAGE_KEY, selectedProjectId);
                  this.setState({
                    selectedProjectId,
                    quickView: undefined,
                  });
                }
              }}
            />
          </Collapse>
        )}
      </div>
    );

    const activeProjectConf = activeProject?.server.getStore().getState().conf.conf;
    const projectLink = (!!activeProjectConf && !!allowProjectUserSelect) ? (
      `${windowIso.location.protocol}//${activeProjectConf.domain || `${activeProjectConf.slug}.${windowIso.location.host}`}`
    ) : undefined;

    return (
      <Elements stripe={Dashboard.getStripePromise()}>
        {this.props.account && (
          <SubscriptionStatusNotifier account={this.props.account} />
        )}
        <Layout
          showToolbar={!onboarding}
          toolbarLeft={(
            <div className={this.props.classes.toolbarLeft}>
              <Typography
                style={{ width: !isSelectProjectUserInMenu ? 180 : undefined }}
                variant='h6'
                color='inherit'
                noWrap
                onClick={() => this.setState({ titleClicked: (this.state.titleClicked || 0) + 1 })}
              >
                Dashboard
              </Typography>
              {!isSelectProjectUserInMenu && selectProjectUser}
            </div>
          )}
          toolbarRight={!projectLink ? undefined : (
            <IconButton
              color='inherit'
              aria-label='Open project'
              onClick={() => !windowIso.isSsr && windowIso.open(projectLink, '_blank')}
            >
              <OpenInNewIcon />
            </IconButton>
          )}
          previewBar={previewBar}
          previewBarInfo={previewBarInfo}
          preview={preview}
          menu={!onboarding && (
            <div>
              {isSelectProjectUserInMenu && selectProjectUser}
              <Menu
                items={[
                  { type: 'item', slug: '', name: 'Home' } as MenuItem,
                  { type: 'item', slug: 'posts', name: 'Posts', offset: 1 } as MenuItem,
                  { type: 'item', slug: 'users', name: 'Users', offset: 1 } as MenuItem,
                  { type: 'item', slug: 'comments', name: 'Comments', offset: 1 } as MenuItem,
                  activeProject ? {
                    type: 'project',
                    name: 'Project Settings',
                    slug: 'settings',
                    projectId: activeProject.server.getProjectId(),
                    page: activeProject.editor.getPage([]),
                    hasUnsavedChanges: activeProject.hasUnsavedChanges()
                  } as MenuProject
                    : { type: 'item', slug: 'settings', name: 'Project Settings' } as MenuItem,
                  { type: 'item', slug: 'create', name: 'New project' } as MenuItem,
                  { type: 'item', slug: 'account', name: 'Account' } as MenuItem,
                  { type: 'item', slug: 'billing', name: 'Billing', hasNotification: billingHasNotification, offset: 1 } as MenuItem,
                  { type: 'item', slug: 'help', name: 'Help' } as MenuItem,
                  { type: 'item', name: 'Docs', offset: 1, ext: this.openFeedbackUrl('docs') } as MenuItem,
                  { type: 'item', name: 'Roadmap', offset: 1, ext: this.openFeedbackUrl('roadmap') } as MenuItem,
                  { type: 'item', name: 'Feedback', offset: 1, ext: this.openFeedbackUrl('feedback') } as MenuItem,
                ].filter(notEmpty)}
                onAnyClick={() => this.setState({ quickView: undefined })}
                activePath={activePath}
                activeSubPath={activeSubPath}
              />
            </div>
          )}
          barBottom={(activePath === 'settings' && activeProject && activeProject.hasUnsavedChanges()) ? (
            <React.Fragment>
              <Typography style={{ flexGrow: 1 }}>You have unsaved changes</Typography>
              <Button color='primary' onClick={() => {
                const currentProject = activeProject;
                ServerAdmin.get().dispatchAdmin().then(d => d.configSetAdmin({
                  projectId: currentProject.projectId,
                  versionLast: currentProject.configVersion,
                  configAdmin: currentProject.editor.getConfig(),
                })
                  .then((versionedConfigAdmin) => {
                    currentProject.resetUnsavedChanges(versionedConfigAdmin)
                  }));
              }}>Publish</Button>
            </React.Fragment>
          ) : undefined}
          hideContentMargins={hideContentMargins}
          width={layoutWidth}
        >
          <Crumbs
            crumbs={crumbs}
            activeProjectSlug='settings'
            activeProjectSlugName='Settings'
            activeProject={activeProject}
            activeSubPath={activeSubPath}
            pageClicked={(path, subPath) => this.pageClicked(quickViewEnabled, path, subPath)}
          />
          {page}
          {activeProject && (this.state.titleClicked || 0) >= 10 && (
            <DividerCorner title='Configuration dump'>
              <ConfigView editor={activeProject.editor} />
            </DividerCorner>
          )}
        </Layout>
      </Elements>
    );
  }

  renderProjectUserSelect(activeProject: AdminProject) {
    return (
      <Provider key={activeProject.projectId} store={activeProject.server.getStore()}>
        <UserSelection
          className={this.props.classes.projectUserSelectorInline}
          server={activeProject.server}
          allowCreate
          allowClear
          alwaysOverrideWithLoggedInUser
          placeholder='Anonymous'
          minWidth={76} // Fits placeholder
          maxWidth={150}
          suppressInitialOnChange
          SelectionPickerProps={{
            autocompleteClasses: {
              inputRoot: this.props.classes.projectUserSelectorInlineInputRoot,
            }
          }}
          onChange={userLabel => {
            if (userLabel) {
              ServerAdmin.get().dispatchAdmin().then(d => d.userLoginAdmin({
                projectId: activeProject.projectId,
                userId: userLabel.value,
              }));
            } else {
              if (this.state.quickView?.type === 'user'
                && this.state.quickView.id === activeProject.server.getStore().getState().users.loggedIn.user?.userId) {
                this.setState({ quickView: undefined });
              }
              activeProject.server.dispatch().then(d => d.userLogout({
                projectId: activeProject.projectId,
              }));
            }
          }}
        />
      </Provider>
    );
  }

  renderPreviewEmpty(msg: string) {
    return (
      <div className={this.props.classes.previewEmptyMessage}>
        <Typography component='div' variant='h5'>
          {msg}
        </Typography>
        <EmptyIcon
          fontSize='inherit'
          className={this.props.classes.previewEmptyIcon}
        />
      </div>
    );
  }

  openFeedbackUrl(page?: string) {
    var url = `${windowIso.location.protocol}//feedback.${windowIso.location.host}/${page || ''}`;
    if (this.props.account) {
      url += `?${SSO_TOKEN_PARAM_NAME}=${this.props.account.cfJwt}`;
    }
    return url;
  }

  pageClicked(quickViewEnabled: boolean, path: string, subPath: ConfigEditor.Path = []): void {
    if (quickViewEnabled && (path === 'post' || path === 'user') && subPath[0]) {
      this.setState({
        quickView: {
          type: path,
          id: subPath[0] + '',
        }
      });
    } else {
      if (this.state.quickView) {
        this.setState({ quickView: undefined });
      }
      this.props.history.push(`/dashboard/${[path, ...subPath].join('/')}`);
    }
  }

  static accountToLabel(account: AdminClient.Account): Label {
    return {
      label: account.name,
      filterString: `${account.name} ${account.email}`,
      value: account.email
    };
  }
}

export default connect<ConnectProps, {}, Props, ReduxStateAdmin>((state, ownProps) => {
  const connectProps: ConnectProps = {
    accountStatus: state.account.account.status,
    account: state.account.account.account,
    isSuperAdmin: state.account.isSuperAdmin,
    configsStatus: state.configs.configs.status,
    bindByProjectId: state.configs.configs.byProjectId,
  };
  return connectProps;
}, null, null, { forwardRef: true })(withStyles(styles, { withTheme: true })(withWidth({ initialWidth })(Dashboard)));
