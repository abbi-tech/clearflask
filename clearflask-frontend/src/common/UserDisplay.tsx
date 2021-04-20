import { Button, Typography } from '@material-ui/core';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import * as Client from '../api/client';
import ModStar from './ModStar';
import { preserveEmbed } from './util/historyUtil';

export const DisplayUserName = (user?: Partial<Client.User> | Client.UserMe, maxChars: number = -1) => {
  if (!user) {
    return 'Anonymous';
  }
  var displayName = user['name'];
  if (!displayName && user['email']) {
    displayName = user['email'];
  }
  if (!displayName && user['userId']) {
    displayName = 'Anon' + user['userId'].substring(0, 5);
  }
  if (!displayName) {
    displayName = 'Nameless';
  }
  if (maxChars > 0 && displayName.length > maxChars) {
    displayName = displayName.substring(0, maxChars - 1) + '…';
  }
  return displayName;
};

const styles = (theme: Theme) => createStyles({
  button: {
    padding: `3px ${theme.spacing(0.5)}px`,
    whiteSpace: 'nowrap',
    minWidth: 'unset',
    textTransform: 'unset',
  },
});
interface Props {
  variant?: 'button' | 'text';
  maxChars?: number;
  user: {
    userId: string;
    name?: string;
    isMod?: boolean;
  } | Client.User;
  onClick?: (userId: string) => void;
  disabled?: boolean;
  suppressTypography?: boolean;
}
class UserDisplay extends React.Component<Props & RouteComponentProps & WithStyles<typeof styles, true>> {
  render() {
    var user = (
      <ModStar name={DisplayUserName(this.props.user, this.props.maxChars)} isMod={this.props.user.isMod} />
    );
    if (!this.props.suppressTypography) {
      user = (
        <Typography noWrap variant='caption'>
          {user}
        </Typography>
      );
    }
    if (this.props.variant === 'text') {
      return user;
    }
    return this.props.onClick ? (
      <Button
        key={`user-${this.props.user.userId}`}
        className={this.props.classes.button}
        disabled={this.props.disabled}
        variant='text'
        onClick={e => this.props.onClick && this.props.onClick(this.props.user.userId)}
      >
        {user}
      </Button>
    ) : (
      <Button
        key={`user-${this.props.user.userId}`}
        className={this.props.classes.button}
        disabled={this.props.disabled}
        variant='text'
        component={Link}
        to={preserveEmbed(`/user/${this.props.user.userId}`, this.props.location)}
      >
        {user}
      </Button>
    );
  }
}

export default withStyles(styles, { withTheme: true })(withRouter(UserDisplay));