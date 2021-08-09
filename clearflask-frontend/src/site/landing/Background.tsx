// SPDX-FileCopyrightText: 2019-2021 Matus Faro <matus@smotana.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { createStyles, fade, Theme, WithStyles, withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { Props as BlockContentProps } from './BlockContent';

const styles = (theme: Theme) => createStyles({
  backgroundContainer: {
    position: 'relative',
    zIndex: 0,
    overflowX: 'clip',
  },
  background: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    zIndex: -1,
  },
  svg: {
    overflow: 'visible',
    width: '100%',
    height: '100%',
  },
});

export interface Props extends Omit<BlockContentProps, 'variant'> {
  /**
   * Good resource to create/modify SVG paths:
   * - https://yqnn.github.io/svg-path-editor/
   * - https://smooth.ie/blogs/news/svg-wavey-transitions-between-sections
   */
  content?: React.ReactNode;
  svg?: {
    viewBox: string;
    d: string;
    fill?: string;
    flexible?: boolean;
  },
  backgroundColor?: string;
  offsetX?: string;
  offsetY?: string;
  width?: string | number;
  height?: string | number;
}
class Background extends Component<Props & WithStyles<typeof styles, true> & RouteComponentProps> {

  render() {

    var content = this.props.content;
    if (this.props.svg) {
      content = (
        <svg
          viewBox={this.props.svg.viewBox}
          className={this.props.classes.svg}
          preserveAspectRatio={this.props.svg.flexible ? 'none' : undefined}
        >
          <path
            style={{
              fill: this.props.svg.fill || fade(this.props.theme.palette.primary.main, 0.05)
            }}
            d={this.props.svg.d}
          />
        </svg>
      );
    }

    return (
      <div className={this.props.classes.backgroundContainer} style={{
        backgroundColor: this.props.backgroundColor,
      }}>
        {content && (
          <div className={this.props.classes.background} style={{
            top: this.props.offsetY === undefined ? '50%' : `calc(50% + ${this.props.offsetY})`,
            left: this.props.offsetX === undefined ? '50%' : `calc(50% + ${this.props.offsetX})`,
            width: this.props.width || '100%',
            height: this.props.height || '100%',
          }}>
            {content}
          </div>
        )}
        {this.props.children}
      </div>
    );
  }
}

export default withRouter(withStyles(styles, { withTheme: true })(Background));
