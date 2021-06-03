import { AppBar, Button, Divider, Drawer, IconButton, Toolbar, Typography, WithWidthProps } from '@material-ui/core';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import MenuIcon from '@material-ui/icons/Menu';
import classNames from 'classnames';
import React, { Component } from 'react';
import * as ConfigEditor from './config/configEditor';
import { contentScrollApplyStyles, Orientation } from './ContentScroll';
import { withMediaQueries, WithMediaQueries } from './util/MediaQuery';

export interface Header {
  title?: string;
  action: {
    label: string;
    onClick: () => void;
  };
}
export interface LayoutSize {
  breakWidth?: number;
  width?: number | string;
  flexGrow?: number;
  maxWidth?: number | string;
  scroll?: Orientation;
}
export interface Section {
  size?: LayoutSize;
  content: React.ReactNode;
}
export interface PreviewSection extends Section {
  bar?: React.ReactNode;
}

const BOX_MARGIN = 36;
const BOX_BORDER_WIDTH = 1;
const HEADER_HEIGHT = 60;

type MediaQueries = 'enableBoxLayout' | 'overflowPreview' | 'overflowMenu';
const MENU_WIDTH = 180;
const styles = (theme: Theme) => createStyles({
  header: {
    position: 'absolute',
    top: 0,
    height: HEADER_HEIGHT,
    transform: 'translate(0, -100%)',
    display: 'flex',
    padding: theme.spacing(0, 3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLeft: {
    left: theme.spacing(1),
  },
  headerRight: {
    right: theme.spacing(1),
  },
  barBottomPaper: {
    display: 'flex',
    flexDirection: 'row' as 'row',
    [theme.breakpoints.up('sm')]: {
      left: MENU_WIDTH,
    },
    zIndex: 1, // Allow other things like Color picker to overlap this
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: MENU_WIDTH,
      flexShrink: 0,
    },
  },
  drawerPaper: {
    width: MENU_WIDTH,
  },
  menuPaper: {
    zIndex: theme.zIndex.drawer + 1,
  },
  previewPaper: {
    overflowY: 'scroll' as 'scroll',
    width: '40%',
    background: theme.palette.background.default,
  },
  previewMobilePaper: {
    overflowY: 'scroll' as 'scroll',
    width: '100%',
    background: theme.palette.background.default,
  },
  previewBar: {
    display: 'flex',
    padding: theme.spacing(0.5, 1),
    color: theme.palette.text.secondary,
    alignItems: 'center',
  },
  previewBarBorder: {
    borderBottom: '1px dashed ' + theme.palette.grey[300],
  },
  previewBarItem: {
    margin: theme.spacing(0, 1),
  },
  previewBarContent: {
    flexGrow: 1,
  },
  appBar: {
    zIndex: Math.max(theme.zIndex.modal, theme.zIndex.drawer) + 1,
    boxShadow: '0px 0px 50px 0 rgba(0,0,0,0.1)',
  },
  menuButton: {
    marginRight: 20,
  },
  toolbarSpacer: theme.mixins.toolbar,
  contentMargins: {
    padding: theme.spacing(3),
  },
  page: {
    height: '100vh',
    maxHeight: '100vh',
    width: '100vw',
    maxWidth: '100vw',
    overflow: 'hidden',
  },
  grow: {
    flexGrow: 1,
  },
  horizontal: {
    display: 'flex',
    alignItems: 'stretch',
    minHeight: 0,
  },
  boxLayoutParent: {
    position: 'relative',
    zIndex: 0,
  },
  boxLayoutWithHeaderMargin: {
    marginTop: BOX_MARGIN / 3 + HEADER_HEIGHT + 'px' + '!important',
  },
  headerMargin: {
    marginTop: HEADER_HEIGHT + 'px' + '!important',
    borderTop: '1px solid ' + theme.palette.grey[300],
  },
  boxLayout: {
    margin: BOX_MARGIN,
    border: '1px solid ' + theme.palette.grey[300],
    boxShadow: '0px 0px 50px 0 rgba(0,0,0,0.1)',
  },
  hideShadows: {
    position: 'relative',
    backgroundColor: theme.palette.background.default,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  vertical: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'stretch',
    minHeight: 0,
  },
  scroll: {
    minHeight: 0,
    flexGrow: 1,
  },
  [`scroll-${Orientation.Both}`]: {
    ...contentScrollApplyStyles({ theme, orientation: Orientation.Both }),
  },
  [`scroll-${Orientation.Horizontal}`]: {
    ...contentScrollApplyStyles({ theme, orientation: Orientation.Horizontal }),
  },
  [`scroll-${Orientation.Vertical}`]: {
    ...contentScrollApplyStyles({ theme, orientation: Orientation.Vertical }),
  },
  section: {
    minWidth: 0,
  },
  content: {
    flexGrow: (props: Props) => props.main?.size?.flexGrow || 0,
    flexBasis: (props: Props) => props.main.size?.breakWidth || 'content',
    width: (props: Props) => props.main.size?.width,
    maxWidth: (props: Props) => props.main.size?.maxWidth,
  },
  menuMergeWithContent: {
    marginRight: - (BOX_MARGIN + 1),
  },
  menu: {
    borderRight: '1px solid ' + theme.palette.grey[300],
    flexGrow: (props: Props) => props.menu?.size?.flexGrow || 0,
    flexBasis: (props: Props) => props.menu?.size?.breakWidth || 'content',
    width: (props: Props) => props.menu?.size?.width,
    maxWidth: (props: Props) => props.menu?.size?.maxWidth,
  },
  preview: {
    marginLeft: 0, // boxLayout collapse margins inside flex
    borderLeft: '1px solid ' + theme.palette.grey[300],
    flexGrow: (props: Props) => props.preview?.size?.flexGrow || 0,
    flexBasis: (props: Props) => props.preview?.size?.breakWidth || 'content',
    width: (props: Props) => props.preview?.size?.width,
    maxWidth: (props: Props) => props.preview?.size?.maxWidth,
  },
});
interface Props {
  header: Header;
  main: Section;
  toolbarShow: boolean;
  toolbarLeft: React.ReactNode;
  toolbarRight?: React.ReactNode;
  menu?: Section;
  previewShow?: boolean;
  previewForceShowClose?: boolean;
  previewShowChanged: (show: boolean) => void;
  preview?: PreviewSection;
  barTop?: React.ReactNode;
  barBottom?: React.ReactNode;
  children: React.ReactNode;
  contentMargins?: boolean;
}
interface State {
  mobileMenuOpen: boolean;
}
class Layout extends Component<Props & WithMediaQueries<MediaQueries> & WithStyles<typeof styles, true> & WithWidthProps, State> {
  readonly editor: ConfigEditor.Editor = new ConfigEditor.EditorImpl();
  readonly containerRef = React.createRef<HTMLDivElement>();

  constructor(props) {
    super(props);
    this.state = {
      mobileMenuOpen: false,
    };
  }

  render() {
    const overflowPreview = this.props.mediaQueries.overflowPreview;
    const overflowMenu = this.props.mediaQueries.overflowMenu;
    const enableBoxLayout = this.props.mediaQueries.enableBoxLayout;

    const title = !!this.props.header?.title ? (
      <div className={classNames(this.props.classes.header, this.props.classes.headerLeft)}>
        <Typography variant='h4' component='h1'>{this.props.header.title}</Typography>
      </div>
    ) : undefined;
    const action = !!this.props.header?.action ? (
      <div className={classNames(this.props.classes.header, this.props.classes.headerRight)}>
        <Button
          variant='contained'
          disableElevation
          color='primary'
          onClick={this.props.header.action.onClick}
        >{this.props.header.action.label}</Button>
      </div>
    ) : undefined;
    const showHeader = !!title || !!action;

    const previewBar = (!!this.props.preview?.bar || !!overflowPreview) && (
      <>
        <div className={classNames(
          this.props.classes.previewBar,
          !!this.props.preview?.bar && this.props.classes.previewBarBorder,
        )}>
          {(!!overflowPreview || !!this.props.previewForceShowClose) && (
            <IconButton
              color='inherit'
              aria-label=''
              onClick={this.handlePreviewToggle.bind(this)}
            >
              <CloseIcon />
            </IconButton>
          ) || (
              <InfoIcon className={this.props.classes.previewBarItem} />
            )}
          {!!this.props.preview?.bar && (
            <>
              <div className={classNames(this.props.classes.previewBarContent, this.props.classes.previewBarItem)}>
                {this.props.preview.bar}
              </div>
            </>
          )}
        </div>
      </>
    );

    const preview = this.props.preview && (
      <div className={classNames(
        enableBoxLayout && this.props.classes.boxLayout,
        this.props.classes.section,
        this.props.classes.preview,
        this.props.classes.vertical,
      )}>
        <div className={this.props.classes.hideShadows}>
          {previewBar}
          <div className={classNames(
            this.props.classes.scroll,
            this.props.classes[`scroll-${this.props.preview.size?.scroll || Orientation.Vertical}`],
          )}>
            {this.props.preview.content}
          </div>
        </div>
      </div>
    );

    const menu = !!this.props.menu && (
      <div className={classNames(
        enableBoxLayout && !overflowMenu && showHeader && this.props.classes.boxLayoutWithHeaderMargin,
        !enableBoxLayout && !overflowMenu && showHeader && this.props.classes.headerMargin,
        enableBoxLayout && this.props.classes.boxLayout,
        this.props.classes.section,
        this.props.classes.menu,
        enableBoxLayout && !overflowMenu && this.props.classes.menuMergeWithContent,
        this.props.classes.vertical,
      )}>
        <div className={this.props.classes.hideShadows}>
          {!overflowMenu && (title)}
          <div className={classNames(
            this.props.classes.scroll,
            this.props.classes[`scroll-${this.props.menu.size?.scroll || Orientation.Vertical}`],
          )}>
            {this.props.menu.content}
          </div>
        </div>
      </div>
    );

    const content = (
      <div className={classNames(
        enableBoxLayout && showHeader && this.props.classes.boxLayoutWithHeaderMargin,
        !enableBoxLayout && showHeader && this.props.classes.headerMargin,
        enableBoxLayout && this.props.classes.boxLayout,
        this.props.classes.section,
        this.props.classes.content,
        this.props.classes.vertical,
      )}>
        <div className={this.props.classes.hideShadows}>
          {(!!overflowMenu || !menu) && (title)}
          {action}
          {!!this.props.barTop && (
            <div>
              {this.props.barTop}
              <Divider />
            </div>
          )}
          <div className={classNames(
            this.props.classes.scroll,
            this.props.classes[`scroll-${this.props.main.size?.scroll || Orientation.Vertical}`],
            this.props.classes.grow,
            !!this.props.contentMargins && this.props.classes.contentMargins,
          )}>
            {this.props.main.content}
          </div>
          {!!this.props.barBottom && (
            <div>
              <Divider />
              {this.props.barBottom}
            </div>
          )}
        </div>
      </div>
    );

    return (
      <div ref={this.containerRef}>
        {!!this.props.toolbarShow && (
          <AppBar elevation={0} color='default' className={this.props.classes.appBar}>
            <Toolbar>
              {!!overflowMenu && !!menu && (
                <IconButton
                  color="inherit"
                  aria-label="Open drawer"
                  onClick={this.handleDrawerToggle.bind(this)}
                  className={this.props.classes.menuButton}
                >
                  <MenuIcon />
                </IconButton>
              )}
              {this.props.toolbarLeft}
              <div className={this.props.classes.grow} />
              {this.props.toolbarRight}
            </Toolbar>
            <Divider />
          </AppBar>
        )}
        {overflowMenu && !!menu && (
          <nav className={this.props.classes.drawer}>
            <Drawer
              variant='temporary'
              open={this.state.mobileMenuOpen}
              onClose={this.handleDrawerToggle.bind(this)}
              classes={{
                paper: classNames(this.props.classes.menuPaper, this.props.classes.drawerPaper),
              }}
              ModalProps={{
                container: () => this.containerRef.current!,
                keepMounted: true,
              }}
            >
              {!!this.props.toolbarShow && (<div className={this.props.classes.toolbarSpacer} />)}
              {menu}
            </Drawer>
          </nav>
        )}
        {overflowPreview && !!preview && (
          <Drawer
            variant='persistent'
            SlideProps={{ mountOnEnter: true }}
            anchor='right'
            open={!!this.props.previewShow}
            onClose={this.handleDrawerToggle.bind(this)}
            classes={{
              paper: this.props.classes.previewMobilePaper,
            }}
            ModalProps={{
              container: () => this.containerRef.current!
            }}
          >
            {!!this.props.toolbarShow && (<div className={this.props.classes.toolbarSpacer} />)}
            {preview}
          </Drawer>
        )}
        <div className={classNames(this.props.classes.page, this.props.classes.vertical)}>
          {!!this.props.toolbarShow && (<div className={this.props.classes.toolbarSpacer} />)}
          <div className={classNames(
            this.props.classes.grow,
            this.props.classes.horizontal,
            enableBoxLayout && this.props.classes.boxLayoutParent,
          )}>
            {!overflowMenu && !!menu && (
              menu
            )}
            {content}
            {!overflowPreview && !!preview && (
              preview
            )}
          </div>
        </div>
      </div>
    );
  }

  handleDrawerToggle() {
    this.setState({ mobileMenuOpen: !this.state.mobileMenuOpen });
  };

  handlePreviewToggle() {
    this.props.previewShowChanged(!this.props.previewShow);
  };
}

export default withMediaQueries<MediaQueries, Props>(props => {
  const sizeMenu = props.menu?.size?.breakWidth || 0;
  const sizePreview = props.preview?.size?.breakWidth || 0;
  const sizeContentBox = (BOX_MARGIN + BOX_BORDER_WIDTH) * 2;
  const sizePreviewBox = (BOX_MARGIN + BOX_BORDER_WIDTH);

  // content
  const sizeContent = props.main.size?.breakWidth || 0;
  // content box
  const sizeContentWithBox = sizeContent + sizeContentBox;
  // content menu
  const sizeContentAndMenu = sizeContent + sizeMenu;
  // content menu box
  const sizeContentAndMenuWithBox = sizeContent + sizeMenu + sizeContentBox;
  // content menu preview
  const sizeContentAndMenuAndPreview = sizeContent + sizeMenu + sizePreview;
  // content menu preview box
  const sizeContentAndMenuWithBoxAndPreviewWithBox = sizeContent + sizeMenu + sizeContentBox + sizePreview + sizePreviewBox;

  return {
    enableBoxLayout:
      `(min-width: ${sizeContentWithBox}px) and (max-width: ${sizeContentAndMenu}px),`
      + `(min-width: ${sizeContentAndMenuWithBox}px) and (max-width: ${sizeContentAndMenuAndPreview}px),`
      + `(min-width: ${sizeContentAndMenuWithBoxAndPreviewWithBox}px)`,
    overflowPreview: `(max-width: ${sizeContentAndMenuAndPreview}px)`,
    overflowMenu: `(max-width: ${sizeContentAndMenu}px)`,
  };
})(withStyles(styles, { withTheme: true })(Layout));
