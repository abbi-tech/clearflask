// SPDX-FileCopyrightText: 2019-2022 Matus Faro <matus@smotana.com>
// SPDX-License-Identifier: Apache-2.0
import { Divider } from '@material-ui/core';
import CreateIcon from '@material-ui/icons/Create';
import { Provider } from 'react-redux';
import { Orientation } from '../../common/ContentScroll';
import UserFilterControls from '../../common/search/UserFilterControls';
import setTitle from "../../common/util/titleUtil";
import { Dashboard, DashboardPageContext, PostPreviewSize, UserPreviewSize } from "../Dashboard";
import DashboardSearchControls from './DashboardSearchControls';
import UserList from './UserList';

export async function renderUsers(this: Dashboard, context: DashboardPageContext) {
  setTitle('Users - Dashboard');
  if (!context.activeProject) {
    context.showCreateProjectWarning = true;
    return;
  }
  const activeProject = context.activeProject;

  context.sections.push({
    name: 'filters',
    breakAction: 'menu',
    size: { breakWidth: 200, flexGrow: 100, width: 'max-content', maxWidth: 'max-content', scroll: Orientation.Vertical },
    collapseRight: true,
    content: (
      <Provider key={activeProject.projectId} store={activeProject.server.getStore()}>
        <UserFilterControls
          key={activeProject.server.getProjectId()}
          search={this.state.usersUserFilter}
          onSearchChanged={usersUserFilter => this.setState({ usersUserFilter })}
        />
      </Provider>
    ),
  });

  context.sections.push({
    name: 'main',
    size: { breakWidth: 250, flexGrow: 20, maxWidth: 250 },
    content: (
      <>
        <DashboardSearchControls
          placeholder='Search for user'
          key={'user-search-bar' + activeProject.server.getProjectId()}
          searchText={this.state.usersUserSearch}
          onSearchChanged={searchText => this.setState({ usersUserSearch: searchText })}
        />
        <Divider />
        <Provider key={activeProject.projectId} store={activeProject.server.getStore()}>
          <UserList
            scroll
            server={activeProject.server}
            search={{
              ...this.state.usersUserFilter,
              searchText: this.state.usersUserSearch,
            }}
            selectable='highlight'
            selected={this.state.usersPreview?.type === 'user' ? this.state.usersPreview.id : undefined}
            onUserClick={userId => this.pageClicked('user', [userId])}
          />
        </Provider>
      </>
    ),
  });

  const previewUser = this.renderPreview({
    project: activeProject,
    stateKey: 'usersPreview',
    renderEmpty: 'No user selected',
    extra: {
      size: UserPreviewSize,
      breakAction: 'show',
      collapseBottom: true,
      header: {
        title: { title: 'Users' },
        action: {
          label: 'Add',
          icon: CreateIcon,
          onClick: () => this.pageClicked('user'),
        },
      },
    },
  });

  const previewContent = this.renderPreview({
    project: activeProject,
    stateKey: 'usersPreviewRight',
    extra: {
      name: 'previewContent',
      breakAlways: true,
      breakAction: 'drawer',
      size: PostPreviewSize,
    },
  });

  previewUser && context.sections.push(previewUser);
  previewContent && context.sections.push(previewContent);

  context.showProjectLink = true;
}
