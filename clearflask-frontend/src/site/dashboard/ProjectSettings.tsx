import { Button, Checkbox, Collapse, FormControlLabel, IconButton, InputAdornment, Switch, TextField, Typography } from '@material-ui/core';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/AddRounded';
import EditIcon from '@material-ui/icons/Edit';
import { Alert, AlertTitle } from '@material-ui/lab';
import classNames from 'classnames';
import React, { Component, useState } from 'react';
import { Provider, shallowEqual, useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import * as Admin from '../../api/admin';
import { ReduxState, Server, StateConf } from '../../api/server';
import { ReduxStateAdmin } from '../../api/serverAdmin';
import AppThemeProvider from '../../app/AppThemeProvider';
import { Direction } from '../../app/comps/Panel';
import PanelPost from '../../app/comps/PanelPost';
import SelectionPicker, { Label } from '../../app/comps/SelectionPicker';
import TagSelect from '../../app/comps/TagSelect';
import CustomPage, { BoardContainer, BoardPanel } from '../../app/CustomPage';
import { HeaderLogo } from '../../app/Header';
import { PostStatusConfig } from '../../app/PostStatus';
import { getPostStatusIframeSrc } from '../../app/PostStatusIframe';
import * as ConfigEditor from '../../common/config/configEditor';
import Templater, { configStateEqual, Confirmation, ConfirmationResponseId } from '../../common/config/configTemplater';
import DataSettings from '../../common/config/settings/DataSettings';
import WorkflowPreview from '../../common/config/settings/injects/WorkflowPreview';
import Property from '../../common/config/settings/Property';
import TableProp from '../../common/config/settings/TableProp';
import { RestrictedProperties } from '../../common/config/settings/UpgradeWrapper';
import { FeedbackInstance, FeedbackSubCategoryInstance } from '../../common/config/template/feedback';
import { RoadmapInstance } from '../../common/config/template/roadmap';
import { contentScrollApplyStyles, Orientation } from '../../common/ContentScroll';
import FakeBrowser from '../../common/FakeBrowser';
import MyAccordion from '../../common/MyAccordion';
import MyColorPicker from '../../common/MyColorPicker';
import TextFieldWithColorPicker from '../../common/TextFieldWithColorPicker';
import { notEmpty } from '../../common/util/arrayUtil';
import debounce from '../../common/util/debounce';
import { escapeHtml } from '../../common/util/htmlUtil';
import randomUuid from '../../common/util/uuid';
import windowIso from '../../common/windowIso';
import PostSelection from './PostSelection';

const propertyWidth = 250;

const styles = (theme: Theme) => createStyles({
  container: {
    padding: theme.spacing(4),
  },
  browserPreview: {
    marginBottom: 40,
  },
  projectLink: {
    color: theme.palette.primary.main,
    fontWeight: 'bold',
  },
  previewContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  previewTitle: {
    marginTop: 60,
  },
  previewContent: {
    flex: '1 1 300px',
    minWidth: 'min-content',
    width: 300,
  },
  previewSpacer: {
    width: theme.spacing(4),
    height: 0,
  },
  previewPreview: {
    flex: '1 1 300px',
    minWidth: 'min-content',
    width: 300,
    marginTop: 60,
  },
  statusConfigLine: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  statusPreviewContainer: {
    padding: theme.spacing(2, 4),
    display: 'flex',
    height: 80,
    boxSizing: 'content-box',
  },
  statusPreviewText: {
    flex: '1 1 content',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: theme.spacing(1),
  },
  statusPreviewStatus: {
    flex: '1 1 200px',
  },
  feedbackAccordionContainer: {
    margin: theme.spacing(4, 0),
  },
  feedbackAddWithAccordion: {
    margin: theme.spacing(0),
  },
  roadmapAddTitleButton: {
    display: 'block',
    marginTop: theme.spacing(4),
  },
  roadmapPanelAddTitleButton: {
    display: 'block',
    marginTop: theme.spacing(1),
  },
  roadmapPanelContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *:not(:first-child)': { marginLeft: theme.spacing(2) },
  },
  filterStatus: {
    padding: theme.spacing(2, 2, 0),
  },
  filterStatusInput: {
    borderColor: 'transparent',
  },
  showOrEdit: {
    display: 'flex',
    alignItems: 'center',
  },
  showOrEditButton: {
    marginLeft: theme.spacing(1),
  },
  feedbackTag: {
    marginBottom: theme.spacing(3),
  },
  tagPreviewContainer: {
    padding: theme.spacing(4, 2),
  },
  subcatPreviewExplorer: {
    width: 'max-content',
    height: 'max-content',
  },
  createFeedbackButton: {
    margin: theme.spacing(4, 2),
  },
});
const useStyles = makeStyles(styles);

export const ProjectSettingsBase = (props: {
  children?: any,
  title?: string,
  description?: string,
}) => {
  const classes = useStyles();
  return (
    <div className={classes.container}>
      {!!props.title && (
        <Typography variant='h4' component='h1'>{props.title}</Typography>
      )}
      {!!props.description && (
        <Typography variant='body1' component='p'>{props.description}</Typography>
      )}
      {props.children}
    </div>
  );
}

export const ProjectSettingsInstall = (props: {
  server: Server;
  editor: ConfigEditor.Editor;
}) => {
  const classes = useStyles();
  const [widgetPath, setWidgetPath] = useState<string | undefined>();
  const [popup, setPopup] = useState<boolean>(false);
  const [statusPostLabel, setStatusPostLabel] = useState<Label | undefined>();
  const [statusConfig, setStatusConfig] = useState<Required<PostStatusConfig>>({
    fontSize: '14px',
    fontFamily: '',
    color: '',
    backgroundColor: 'transparent',
    fontWeight: 'normal',
    alignItems: 'center',
    justifyContent: 'flex-start',
    textTransform: '',
  });
  return (
    <ProjectSettingsBase title='Install'>
      <Section
        title='Portal'
        preview={(
          <Provider key={props.server.getProjectId()} store={props.server.getStore()}>
            <ProjectSettingsInstallPortalPreview server={props.server} />
          </Provider>
        )}
        content={(
          <>
            <p><Typography>The recommended way is to direct your users to the full portal by linking your website with the portal's website.</Typography></p>
          </>
        )}
      />
      <Section
        title='Widget'
        preview={(
          <Provider key={props.server.getProjectId()} store={props.server.getStore()}>
            <ProjectSettingsInstallWidgetPreview server={props.server} widgetPath={widgetPath} popup={popup} />
          </Provider>
        )}
        content={(
          <>
            <p><Typography>The widget is a simple IFrame tag that can be put anywhere on your site.</Typography></p>
            <p><Typography>You can even put it inside a popup:</Typography></p>
            <ProjectSettingsInstallWidgetPopupSwitch popup={popup} setPopup={setPopup} />
            <p><Typography>Embed the whole portal or an individual page without the navigation menu:</Typography></p>
            <Provider key={props.server.getProjectId()} store={props.server.getStore()}>
              <ProjectSettingsInstallWidgetPath server={props.server} widgetPath={widgetPath} setWidgetPath={setWidgetPath} />
            </Provider>
          </>
        )}
      />
      <Section
        title='Status'
        preview={(
          <Provider key={props.server.getProjectId()} store={props.server.getStore()}>
            <ProjectSettingsInstallStatusPreview server={props.server} postId={statusPostLabel?.value} config={statusConfig} />
          </Provider>
        )}
        content={(
          <>
            <p><Typography>You can also embed the Status of an idea, or a roadmap item. This is useful if you want to show an upcoming feature or build your own Roadmap.</Typography></p>
            <Provider key={props.server.getProjectId()} store={props.server.getStore()}>
              <PostSelection
                server={props.server}
                label='Search for a post'
                size='small'
                variant='outlined'
                onChange={setStatusPostLabel}
                errorMsg='Search for a post to preview'
                searchIfEmpty
              />
            </Provider>
            <p><Typography>Optionally format the status to fit your website:</Typography></p>
            <ProjectSettingsInstallStatusConfig config={statusConfig} setConfig={setStatusConfig} />
          </>
        )}
      />
    </ProjectSettingsBase>
  );
}
export const ProjectSettingsInstallPortalPreview = (props: {
  server: Server;
}) => {
  const theme = useTheme();
  const domain = useSelector<ReduxState, string | undefined>(state => state.conf.conf?.domain, shallowEqual);
  const slug = useSelector<ReduxState, string | undefined>(state => state.conf.conf?.slug, shallowEqual);
  const projectLink = `${windowIso.location.protocol}//${escapeHtml(domain) || `${escapeHtml(slug)}.${windowIso.location.host}`}`;
  const html = `<a href="${projectLink}" target="_blank">`
    + `\n  Click me to open in a new window`
    + `\n</a>`;
  return (
    <BrowserPreview
      server={props.server}
      addresBar='website'
      code={html}
      suppressStoreProvider
    >
      <div style={{ padding: theme.spacing(4), height: '100%' }}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </BrowserPreview>
  );
}
export const ProjectSettingsInstallWidgetPreview = (props: {
  server: Server;
  widgetPath?: string;
  popup: boolean;
}) => {
  const theme = useTheme();
  const domain = useSelector<ReduxState, string | undefined>(state => state.conf.conf?.domain, shallowEqual);
  const slug = useSelector<ReduxState, string | undefined>(state => state.conf.conf?.slug, shallowEqual);
  const projectLink = `${windowIso.location.protocol}//${escapeHtml(domain) || `${escapeHtml(slug)}.${windowIso.location.host}`}${props.widgetPath || ''}`;
  var html;
  var content;
  if (props.popup) {
    html = `<a href="${projectLink}" target="_blank" style="position: relative;" onclick="
  event.preventDefault();
  var el = document.getElementById('cf-widget-content');
  var isShown = el.style.display != 'none'
  el.style.display = isShown ? 'none' : 'block';
">
  Click me to open in a popup
  <iframe src='${projectLink}' id="cf-widget-content" class="cf-widget-content" style="
    display: none;
    height: 600px;
    width: 450px;
    border: 1px solid lightgrey;
    border-radius: 15px;
    box-shadow: -7px 4px 42px 8px rgba(0,0,0,.1);
    position: absolute;
    z-index: 1;
    top: 125%;
    left: 50%;
    transform: translateX(-50%);
  " />
</a>`;
    content = (
      <div style={{ padding: theme.spacing(4) }}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  } else {
    html = `<iframe src='${projectLink}'  style="
  width: 100%;
  height: 300px;
  border: 1px solid lightgrey;
" />`;
    content = (
      <div style={{ padding: theme.spacing(1) }}>
        <div style={{ padding: theme.spacing(3) }}>
          Directly on your site:
      </div>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  }
  return (
    <BrowserPreview
      server={props.server}
      addresBar='website'
      code={html}
      suppressStoreProvider
    >
      {content}
    </BrowserPreview>
  );
}
export const ProjectSettingsInstallWidgetPath = (props: {
  server: Server;
  widgetPath?: string;
  setWidgetPath: (widgetPath: string | undefined) => void;
}) => {
  const pages = useSelector<ReduxState, Admin.Page[] | undefined>(state => state.conf.conf?.layout.pages, shallowEqual) || [];
  const selectedValue: Label[] = [];
  const options: Label[] = [];

  const homeLabel: Label = {
    label: 'Whole portal',
    value: '',
  };
  options.push(homeLabel);
  if (!props.widgetPath) {
    selectedValue.push(homeLabel);
  }

  pages.forEach(page => {
    const pageLabel: Label = {
      label: page.name,
      value: `/embed/${page.slug}`,
    };
    options.push(pageLabel);
    if (pageLabel.value === props.widgetPath) {
      selectedValue.push(pageLabel);
    }
  });

  return (
    <SelectionPicker
      value={selectedValue}
      options={options}
      forceDropdownIcon={true}
      disableInput
      showTags
      noOptionsMessage='No pages'
      width='max-content'
      bareTags
      disableClearable
      onValueChange={labels => labels[0] && props.setWidgetPath(labels[0]?.value || undefined)}
      TextFieldProps={{
        variant: 'outlined',
        size: 'small',
      }}
    />
  );
}
export const ProjectSettingsInstallWidgetPopupSwitch = (props: {
  popup: boolean;
  setPopup: (bare: boolean) => void;
}) => {
  return (
    <FormControlLabel
      label={props.popup ? 'Show as popup' : 'Show inline'}
      control={(
        <Switch
          checked={!!props.popup}
          onChange={(e, checked) => props.setPopup(!props.popup)}
          color='default'
        />
      )}
    />
  );
}
export const ProjectSettingsInstallStatusPreview = (props: {
  server: Server;
  postId?: string;
  config: Required<PostStatusConfig>;
}) => {
  const classes = useStyles();
  const projectId = useSelector<ReduxState, string | undefined>(state => state.conf.conf?.projectId, shallowEqual);
  if (!projectId || !props.postId) {
    return null;
  }
  const src = getPostStatusIframeSrc(props.postId, projectId, props.config);
  const html = `<iframe
  src='${src}'
  frameBorder=0
  scrolling="no"
  allowTransparency="true"
  width="100%"
  height="80px"
/>`;
  return (
    <BrowserPreview
      server={props.server}
      addresBar='website'
      code={html}
      suppressStoreProvider
    >
      <div className={classes.statusPreviewContainer}>
        <div className={classes.statusPreviewText}>My status:&nbsp;</div>
        <div className={classes.statusPreviewStatus} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </BrowserPreview>
  );
}
export const ProjectSettingsInstallStatusConfig = (props: {
  config: Required<PostStatusConfig>;
  setConfig: (config: Required<PostStatusConfig>) => void;
}) => {
  const classes = useStyles();
  const onChange = (key: string, value: string) => props.setConfig({
    ...props.config,
    [key]: value,
  });

  const fontSize = (
    <ProjectSettingsInstallStatusConfigSelect
      label='Text size'
      selectedValue={props.config.fontSize + ''}
      onChange={value => onChange('fontSize', value)}
      options={[
        { label: '8px', value: '8px' },
        { label: '9px', value: '9px' },
        { label: '10px', value: '10px' },
        { label: '11px', value: '11px' },
        { label: '12px', value: '12px' },
        { label: '13px', value: '13px' },
        { label: '14px', value: '14px' },
        { label: '15px', value: '15px' },
        { label: '16px', value: '16px' },
        { label: '17px', value: '17px' },
        { label: '18px', value: '18px' },
        { label: '19px', value: '19px' },
        { label: '20px', value: '20px' },
      ]}
    />
  );
  const fontFamily = (
    <ProjectSettingsInstallStatusConfigSelect
      label='Font'
      selectedValue={props.config.fontFamily}
      onChange={value => onChange('fontFamily', value)}
      options={[
        { label: 'Default', value: '' },
        { label: 'Times', value: 'courier' },
        { label: 'Courier', value: 'times' },
        { label: 'Arial', value: 'arial' },
      ]}
    />
  );
  const color = (
    <ProjectSettingsInstallStatusConfigSelectColor
      label='Text color'
      selectedValue={props.config.color || ''}
      onChange={value => onChange('color', value || '')}
    />
  );
  const backgroundColor = (
    <ProjectSettingsInstallStatusConfigSelectColor
      label='Background color'
      selectedValue={(props.config.backgroundColor === 'transparent' || !props.config.backgroundColor) ? '' : props.config.backgroundColor}
      onChange={value => onChange('backgroundColor', value || 'transparent')}
    />
  );
  const fontWeight = (
    <ProjectSettingsInstallStatusConfigSelect
      label='Boldness'
      selectedValue={props.config.fontWeight + ''}
      onChange={value => onChange('fontWeight', value)}
      options={[
        { label: 'Normal', value: 'normal' },
        { label: 'Bold', value: 'bold' },
      ]}
    />
  );
  const alignItems = (
    <ProjectSettingsInstallStatusConfigSelect
      label='Vertical'
      selectedValue={props.config.alignItems}
      onChange={value => onChange('alignItems', value)}
      options={[
        { label: 'Top', value: 'flex-start' },
        { label: 'Center', value: 'center' },
        { label: 'Bottom', value: 'flex-end' },
      ]}
    />
  );
  const justifyContent = (
    <ProjectSettingsInstallStatusConfigSelect
      label='Horizontal'
      selectedValue={props.config.justifyContent}
      onChange={value => onChange('justifyContent', value)}
      options={[
        { label: 'Left', value: 'flex-start' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'flex-end' },
      ]}
    />
  );
  const textTransform = (
    <ProjectSettingsInstallStatusConfigSelect
      label='Case'
      selectedValue={props.config.textTransform + ''}
      onChange={value => onChange('textTransform', value)}
      options={[
        { label: 'Default', value: '' },
        { label: 'Capitalized', value: 'capitalize' },
        { label: 'Uppercase', value: 'uppercase' },
        { label: 'Lowercase', value: 'lowercase' },
      ]}
    />
  );
  return (
    <>
      <p className={classes.statusConfigLine}> {color}{backgroundColor}</p>
      <p className={classes.statusConfigLine}> {fontSize}{fontWeight}</p>
      <p className={classes.statusConfigLine}> {fontFamily}{textTransform}</p>
      <p className={classes.statusConfigLine}>{justifyContent}{alignItems}</p>
    </>
  );
}
export const ProjectSettingsInstallStatusConfigSelect = (props: {
  label?: string;
  selectedValue: string;
  onChange: (selectedValue: string) => void;
  options: Array<Label>;
}) => {
  const theme = useTheme();
  const selectedValue = props.options.filter(l => l.value === props.selectedValue);
  return (
    <SelectionPicker
      style={{ display: 'inline-block', margin: theme.spacing(1, 1) }}
      value={selectedValue}
      options={props.options}
      disableInput
      label={props.label}
      width={100}
      showTags
      bareTags
      disableClearable
      onValueChange={labels => labels[0] && props.onChange(labels[0].value)}
      TextFieldProps={{
        variant: 'outlined',
        size: 'small',
      }}
    />
  );
}
export const ProjectSettingsInstallStatusConfigSelectColor = (props: {
  label?: string;
  selectedValue: string;
  onChange: (selectedValue: string) => void;
}) => {
  const theme = useTheme();
  return (
    <MyColorPicker
      style={{ margin: theme.spacing(1, 1) }}
      clearable
      preview
      placeholder='#FFF'
      label={props.label}
      value={props.selectedValue}
      onChange={color => props.onChange(color)}
      TextFieldProps={{
        variant: 'outlined',
        size: 'small',
        InputProps: {
          style: {
            width: 216,
          },
        },
      }}
    />
  );
}

export const ProjectSettingsBranding = (props: {
  server: Server;
  editor: ConfigEditor.Editor;
}) => {
  const classes = useStyles();
  return (
    <ProjectSettingsBase title='Branding'>
      <Section
        title='Logo'
        preview={(
          <BrowserPreview server={props.server}>
            <ProjectSettingsBrandingPreview />
          </BrowserPreview>
        )}
        content={(
          <>
            <PropertyByPath editor={props.editor} path={['name']} />
            <PropertyByPath editor={props.editor} path={['logoUrl']} />
            <PropertyByPath editor={props.editor} path={['website']} />
          </>
        )}
      />
      <Section
        title='Palette'
        preview={(
          <BrowserPreview server={props.server}>
            <PanelPost
              direction={Direction.Horizontal}
              panel={{
                display: {
                  titleTruncateLines: 1,
                  descriptionTruncateLines: 2,
                  responseTruncateLines: 0,
                  showCommentCount: true,
                  showCreated: true,
                  showAuthor: true,
                  showStatus: true,
                  showTags: true,
                  showVoting: true,
                  showFunding: true,
                  showExpression: true,
                  showEdit: true,
                  showCategoryName: true,
                },
                search: { limit: 1 },
                hideIfEmpty: false,
              }}
              server={props.server}
              disableOnClick
            />
          </BrowserPreview>
        )}
        content={(
          <>
            <PropertyByPath editor={props.editor} path={['style', 'palette', 'darkMode']} />
            <PropertyByPath editor={props.editor} path={['style', 'palette', 'primary']} />
          </>
        )}
      />
    </ProjectSettingsBase>
  );
}
export const ProjectSettingsBrandingPreview = (props: {}) => {
  const configState = useSelector<ReduxState, StateConf>(state => state.conf, configStateEqual);
  return (
    <div style={{ padding: 20 }}>
      <HeaderLogo config={configState.conf} targetBlank suppressLogoLink />
    </div>
  );
}
export const ProjectSettingsDomain = (props: {
  server: Server;
  editor: ConfigEditor.Editor;
}) => {
  return (
    <ProjectSettingsBase title='Custom Domain'>
      <Section
        preview={(
          <Provider key={props.server.getProjectId()} store={props.server.getStore()}>
            <ProjectSettingsDomainPreview server={props.server} />
          </Provider>
        )}
        content={(
          <>
            <PropertyByPath editor={props.editor} path={['slug']} />
            <PropertyByPath editor={props.editor} path={['domain']} />
          </>
        )}
      />
    </ProjectSettingsBase>
  );
}
export const ProjectSettingsDomainPreview = (props: {
  server: Server;
}) => {
  const classes = useStyles();
  const domain = useSelector<ReduxState, string | undefined>(state => state.conf.conf?.domain, shallowEqual);
  const slug = useSelector<ReduxState, string | undefined>(state => state.conf.conf?.slug, shallowEqual);
  const projectLink = `${windowIso.location.protocol}//${domain || `${slug}.${windowIso.location.host}`}`;
  return (
    <BrowserPreview server={props.server} suppressStoreProvider FakeBrowserProps={{
      addresBarContent: (
        <span className={classes.projectLink}>
          { projectLink}
        </span>),
    }}>
    </BrowserPreview>
  );
}

export const ProjectSettingsUsers = (props: {
  server: Server;
  editor: ConfigEditor.Editor;
}) => {
  return (
    <ProjectSettingsBase title='Users'>
      <p>TODO Copy over onboarding from CreatePage</p>
    </ProjectSettingsBase>
  );
}

export const ProjectSettingsLanding = (props: {
  server: Server;
  editor: ConfigEditor.Editor;
}) => {
  return (
    <ProjectSettingsBase title='Landing'>
      <p>TODO choose: home page, or another page as main; if home page chosen:</p>
      <p>TODO Add contact link (email or url)</p>
    </ProjectSettingsBase>
  );
}

export const ProjectSettingsFeedback = (props: {
  server: Server;
  editor: ConfigEditor.Editor;
}) => {
  const classes = useStyles();
  const [tagGroupExpanded, setTagGroupExpanded] = useState<number | undefined>();
  const [subcatExpanded, setSubcatExpanded] = useState<number | undefined>();
  const [statusExpanded, setStatusExpanded] = useState<number | undefined>();
  const [tagIds, setTagIds] = useState<Array<string> | undefined>();
  return (
    <ProjectSettingsBase title='Feedback'>
      <TemplateWrapper<FeedbackInstance | undefined>
        editor={props.editor}
        mapper={templater => templater.feedbackGet()}
        render={(templater, feedback) => {
          const previewSubcat = subcatExpanded === undefined ? undefined : feedback?.subcategories[subcatExpanded];
          return !feedback ? (
            <Button
              className={classes.createFeedbackButton}
              variant='contained'
              color='primary'
              disableElevation
              onClick={() => templater.feedbackOn()}
            >
              Create feedback
            </Button>
          ) : (
            <>
              <Section
                title='Workflow'
                description='Define statuses to apply to your feedback to keep track of your progress.'
                preview={!!feedback.categoryAndIndex.category.workflow.statuses.length && (
                  <WorkflowPreview
                    editor={props.editor}
                    categoryIndex={feedback.categoryAndIndex.index}
                    hideCorner
                    // static
                    isVertical
                    width={350}
                    height={500}
                    border
                  // scroll
                  />
                )}
                content={(
                  <>
                    <div className={classes.feedbackAccordionContainer}>
                      {feedback.categoryAndIndex.category.workflow.statuses.map((status, statusIndex) => (
                        <ProjectSettingsFeedbackStatus
                          server={props.server}
                          editor={props.editor}
                          feedback={feedback}
                          status={status}
                          statusIndex={statusIndex}
                          expanded={statusIndex === statusExpanded}
                          onExpandedChange={() => setStatusExpanded(statusIndex === statusExpanded ? undefined : statusIndex)}
                        />
                      ))}
                    </div>
                    <ProjectSettingsAddWithName
                      label='New status'
                      withAccordion
                      onAdd={name => {
                        props.editor.getPageGroup(['content', 'categories', feedback.categoryAndIndex.index, 'workflow', 'statuses'])
                          .insert()
                          .setRaw(Admin.IdeaStatusToJSON({
                            statusId: randomUuid(),
                            name: name,
                            disableFunding: false,
                            disableVoting: false,
                            disableExpressions: false,
                            disableIdeaEdits: false,
                            disableComments: false,
                          }));
                      }}
                    />
                  </>
                )}
              />
              <Section
                title='Tagging'
                preview={(
                  <TagSelect
                    className={classes.tagPreviewContainer}
                    wrapper={c => (
                      <BrowserPreview server={props.server}>{c}</BrowserPreview>
                    )}
                    variant='outlined'
                    size='small'
                    label='Try selecting tags'
                    category={feedback.categoryAndIndex.category}
                    tagIds={tagIds}
                    isModOrAdminLoggedIn={false}
                    onChange={(tagIds, errorStr) => setTagIds(tagIds)}
                    SelectionPickerProps={{
                      width: undefined,
                    }}
                  />
                )}
                content={(
                  <>
                    <div className={classes.feedbackAccordionContainer}>
                      {feedback.categoryAndIndex.category.tagging.tagGroups.map((tagGroup, tagGroupIndex) => (
                        <ProjectSettingsFeedbackTagGroup
                          server={props.server}
                          editor={props.editor}
                          feedback={feedback}
                          tagGroup={tagGroup}
                          tagGroupIndex={tagGroupIndex}
                          expanded={tagGroupIndex === tagGroupExpanded}
                          onExpandedChange={() => setTagGroupExpanded(tagGroupIndex === tagGroupExpanded ? undefined : tagGroupIndex)}
                        />
                      ))}
                    </div>
                    <ProjectSettingsAddWithName
                      label='New tag group'
                      withAccordion
                      onAdd={newTagGroup => {
                        setTagGroupExpanded(feedback.categoryAndIndex.category.tagging.tagGroups.length);
                        props.editor.getPageGroup(['content', 'categories', feedback.categoryAndIndex.index, 'tagging', 'tagGroups'])
                          .insert()
                          .setRaw(Admin.TagGroupToJSON({
                            name: newTagGroup,
                            tagGroupId: randomUuid(),
                            userSettable: true,
                            tagIds: [],
                          }));
                      }}
                    />
                  </>
                )}
              />
              <Section
                title='Subcategories'
                preview={(
                  <>
                    {!!previewSubcat?.pageAndIndex && (
                      <BrowserPreview server={props.server} scroll={Orientation.Both} FakeBrowserProps={{
                        fixedWidth: 350,
                        fixedHeight: 500,
                      }}>
                        <div className={classes.subcatPreviewExplorer}>
                          <CustomPage
                            key={`${props.server.getProjectId()}-${previewSubcat.tagId || 'uncat'}`}
                            server={props.server}
                            pageSlug={previewSubcat.pageAndIndex.page.slug}
                          />
                        </div>
                      </BrowserPreview>
                    )}
                  </>
                )}
                content={(
                  <>
                    <div className={classes.feedbackAccordionContainer}>
                      {feedback.subcategories.map((subcat, subcatIndex) => (
                        <ProjectSettingsFeedbackSubcategory
                          server={props.server}
                          editor={props.editor}
                          templater={templater}
                          feedback={feedback}
                          subcat={subcat}
                          expanded={subcatIndex === subcatExpanded}
                          onExpandedChange={() => setSubcatExpanded(subcatIndex === subcatExpanded ? undefined : subcatIndex)}
                        />
                      ))}
                    </div>
                    <ProjectSettingsAddWithName
                      label='New subcategory'
                      withAccordion
                      onAdd={newSubcat => {
                        setSubcatExpanded(feedback.subcategories.length);
                        templater.feedbackSubcategoryAdd(newSubcat);
                      }}
                    />
                  </>
                )}
              />
            </>
          );
        }}
      />
    </ProjectSettingsBase>
  );
}
export const ProjectSettingsFeedbackStatus = (props: {
  server: Server;
  editor: ConfigEditor.Editor;
  feedback: FeedbackInstance;
  status: Admin.IdeaStatus;
  statusIndex: number;
  expanded: boolean;
  onExpandedChange: () => void;
}) => {
  const initialStatusIdProp = (props.editor.getProperty(['content', 'categories', props.feedback.categoryAndIndex.index, 'workflow', 'entryStatus']) as ConfigEditor.StringProperty);
  const nameProp = (props.editor.getProperty(['content', 'categories', props.feedback.categoryAndIndex.index, 'workflow', 'statuses', props.statusIndex, 'name']) as ConfigEditor.StringProperty);
  const colorProp = (props.editor.getProperty(['content', 'categories', props.feedback.categoryAndIndex.index, 'workflow', 'statuses', props.statusIndex, 'color']) as ConfigEditor.StringProperty);
  return (
    <MyAccordion
      key={props.status.statusId}
      expanded={props.expanded}
      onChange={() => props.onExpandedChange()}
      name={(
        <PropertyShowOrEdit
          allowEdit={props.expanded}
          show={(
            <span style={{ color: props.status.color }}>
              {props.status.name}
            </span>
          )}
          edit={(
            <TextFieldWithColorPicker
              label='Status Name'
              variant='outlined'
              size='small'
              textValue={nameProp.value}
              onTextChange={text => nameProp.set(text)}
              colorValue={colorProp.value}
              onColorChange={color => colorProp.set(color)}
              InputProps={{
                style: {
                  minWidth: Property.inputMinWidth,
                  width: propertyWidth,
                },
              }}
            />
          )}
        />
      )}
    >
      <FormControlLabel label='Default status' control={(
        <Checkbox size='small' color='primary'
          checked={initialStatusIdProp.value === props.status.statusId}
          disabled={initialStatusIdProp.value === props.status.statusId}
          onChange={e => initialStatusIdProp.set(props.status.statusId)}
        />
      )} />
      <PropertyByPath
        marginTop={16}
        overrideName='Next statuses'
        overrideDescription=''
        editor={props.editor}
        path={['content', 'categories', props.feedback.categoryAndIndex.index, 'workflow', 'statuses', props.statusIndex, 'nextStatusIds']}
      />
    </MyAccordion>
  );
}
export const ProjectSettingsFeedbackSubcategory = (props: {
  server: Server;
  editor: ConfigEditor.Editor;
  templater: Templater;
  feedback: FeedbackInstance;
  subcat: FeedbackSubCategoryInstance;
  expanded: boolean;
  onExpandedChange: () => void;
}) => {
  const classes = useStyles();
  const tag = props.subcat.tagId ? props.feedback.categoryAndIndex.category.tagging.tags.find(t => t.tagId === props.subcat.tagId) : undefined;
  const page = props.subcat.pageAndIndex?.page;
  const name = tag?.name || page?.name || 'Unnamed';
  return (
    <MyAccordion
      key={tag?.tagId || 'uncat'}
      expanded={props.expanded}
      onChange={() => props.onExpandedChange()}
      name={(
        <PropertyShowOrEdit
          allowEdit={props.expanded}
          show={name}
          edit={(
            <TextField
              label='Subcategory name'
              size='small'
              variant='outlined'
              value={name}
              onChange={e => props.templater.feedbackSubcategoryRename(props.feedback, props.subcat, e.target.value)}
              InputProps={{
                style: {
                  minWidth: Property.inputMinWidth,
                  width: propertyWidth,
                },
              }}
            />
          )}
        />
      )}
    >
      <FormControlLabel
        label={!!props.subcat.pageAndIndex ? 'Shown' : 'Hidden'}
        control={(
          <Switch
            checked={!!props.subcat.pageAndIndex}
            onChange={(e, checked) => !!props.subcat.pageAndIndex
              ? props.templater.feedbackOff(props.feedback, props.subcat)
              : props.templater.feedbackOn(props.subcat)}
            color='primary'
          />
        )}
      />
      {!!props.subcat.pageAndIndex && (
        <>
          <PropertyByPath editor={props.editor} path={['layout', 'pages', props.subcat.pageAndIndex.index, 'title']} />
          <PropertyByPath editor={props.editor} path={['layout', 'pages', props.subcat.pageAndIndex.index, 'description']} />
          {!!props.subcat.pageAndIndex.page.explorer?.allowCreate && (
            <>
              <PropertyByPath editor={props.editor} path={['layout', 'pages', props.subcat.pageAndIndex.index, 'explorer', 'allowCreate', 'actionTitle']} />
              <PropertyByPath editor={props.editor} path={['layout', 'pages', props.subcat.pageAndIndex.index, 'explorer', 'allowCreate', 'actionTitleLong']} />
            </>
          )}
        </>
      )}
    </MyAccordion>
  );
}
export const ProjectSettingsFeedbackTagGroup = (props: {
  server: Server;
  editor: ConfigEditor.Editor;
  feedback: FeedbackInstance;
  tagGroup: Admin.TagGroup;
  tagGroupIndex: number;
  expanded: boolean;
  onExpandedChange: () => void;
}) => {
  const tagsWithIndexes = props.feedback.categoryAndIndex.category.tagging.tags
    .map((tag, index) => ({ tag, index }));
  return (
    <MyAccordion
      key={props.tagGroup.tagGroupId}
      expanded={props.expanded}
      onChange={() => props.onExpandedChange()}
      name={(
        <PropertyShowOrEdit
          allowEdit={props.expanded}
          show={props.tagGroup.name}
          edit={(
            <PropertyByPath
              marginTop={0}
              overrideName='Tag Group Name'
              overrideDescription=''
              editor={props.editor}
              path={['content', 'categories', props.feedback.categoryAndIndex.index, 'tagging', 'tagGroups', props.tagGroupIndex, 'name']}
            />
          )}
        />
      )}
    >
      {props.tagGroup.tagIds
        .map(tagId => tagsWithIndexes.find(t => t.tag.tagId === tagId))
        .filter(notEmpty)
        .map(tagWithIndex => (
          <ProjectSettingsFeedbackTag
            server={props.server}
            editor={props.editor}
            categoryIndex={props.feedback.categoryAndIndex.index}
            tag={tagWithIndex.tag}
            tagIndex={tagWithIndex.index}
          />
        ))}
      <ProjectSettingsAddWithName
        key='New tag'
        label='New tag'
        onAdd={newTag => {
          const tagId = randomUuid();
          ((props.editor.getProperty(['content', 'categories', props.feedback.categoryAndIndex.index, 'tagging', 'tags']) as ConfigEditor.ArrayProperty)
            .insert() as ConfigEditor.ObjectProperty)
            .setRaw(Admin.TagToJSON({
              tagId,
              name: newTag,
            }));
          (props.editor.getProperty(['content', 'categories', props.feedback.categoryAndIndex.index, 'tagging', 'tagGroups', props.tagGroupIndex, 'tagIds']) as ConfigEditor.LinkMultiProperty)
            .insert(tagId);
        }}
      />
    </MyAccordion>
  );
}
export const ProjectSettingsFeedbackTag = (props: {
  server: Server;
  editor: ConfigEditor.Editor;
  categoryIndex: number;
  tag: Admin.Tag;
  tagIndex: number;
}) => {
  const classes = useStyles();
  const nameProp = (props.editor.getProperty(['content', 'categories', props.categoryIndex, 'tagging', 'tags', props.tagIndex, 'name']) as ConfigEditor.StringProperty);
  const colorProp = (props.editor.getProperty(['content', 'categories', props.categoryIndex, 'tagging', 'tags', props.tagIndex, 'color']) as ConfigEditor.StringProperty);
  return (
    <TextFieldWithColorPicker
      className={classes.feedbackTag}
      label='Tag Name'
      variant='outlined'
      size='small'
      textValue={nameProp.value}
      onTextChange={text => nameProp.set(text)}
      colorValue={props.tag.color}
      onColorChange={color => colorProp.set(color)}
      InputProps={{
        style: {
          minWidth: Property.inputMinWidth,
          width: propertyWidth,
        },
      }}
    />
  );
}

export const ProjectSettingsAddWithName = (props: {
  label: string;
  onAdd: (value: string) => void;
  withAccordion?: boolean;
}) => {
  const classes = useStyles();
  const [value, setValue] = useState<string | undefined>();
  return (
    <TextField
      label={props.label}
      className={classNames(props.withAccordion && classes.feedbackAddWithAccordion)}
      size='small'
      variant='outlined'
      value={value || ''}
      onChange={e => setValue(e.target.value)}
      InputProps={{
        style: {
          minWidth: Property.inputMinWidth,
          width: propertyWidth,
        },
        endAdornment: (
          <InputAdornment position='end'>
            <IconButton
              disabled={!value}
              onClick={() => {
                if (!value) return;
                props.onAdd(value);
                setValue(undefined);
              }}
            >
              <AddIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}

export const ProjectSettingsRoadmap = (props: {
  server: Server;
  editor: ConfigEditor.Editor;
}) => {
  const classes = useStyles();
  var planId = useSelector<ReduxStateAdmin, string | undefined>(state => state.account.account.account?.basePlanId, shallowEqual);
  return (
    <ProjectSettingsBase title='Roadmap'>
      <TemplateWrapper<RoadmapInstance | undefined>
        editor={props.editor}
        mapper={templater => templater.roadmapGet()}
        render={(templater, roadmap) => (
          <>
            <FormControlLabel
              label={!!roadmap ? 'Enabled' : 'Disabled'}
              control={(
                <Switch
                  checked={!!roadmap}
                  onChange={(e, checked) => !!roadmap
                    ? templater.roadmapOff(roadmap)
                    : templater.roadmapOn()}
                  color='primary'
                />
              )}
            />
            {roadmap && (
              <>
                <Provider key={props.server.getProjectId()} store={props.server.getStore()}>
                  {!roadmap.page.board.title && (
                    <Button
                      className={classes.roadmapAddTitleButton}
                      onClick={() => (props.editor.getProperty(['layout', 'pages', roadmap.pageIndex, 'board', 'title']) as ConfigEditor.StringProperty)
                        .set('Roadmap')}
                    >
                      Add title
                    </Button>
                  )}
                  <BoardContainer
                    overrideTitle={(
                      <PropertyShowOrEdit
                        allowEdit={true}
                        show={(roadmap.page.board.title)}
                        edit={(
                          <PropertyByPathReduxless
                            marginTop={0}
                            planId={planId}
                            width={200}
                            overrideName='Title'
                            editor={props.editor}
                            path={['layout', 'pages', roadmap.pageIndex, 'board', 'title']}
                          />
                        )}
                      />
                    )}
                    server={props.server}
                    board={roadmap.page.board}
                    panels={roadmap?.page.board.panels.map((panel, panelIndex) => (
                      <BoardPanel
                        server={props.server}
                        panel={panel}
                        PanelPostProps={{
                          disableOnClick: true,
                          overrideTitle: !panel.title ? undefined : (
                            <PropertyShowOrEdit
                              allowEdit={true}
                              show={(panel.title)}
                              edit={(
                                <PropertyByPathReduxless
                                  marginTop={0}
                                  planId={planId}
                                  width='auto'
                                  overrideDescription=''
                                  overrideName='Title'
                                  editor={props.editor}
                                  path={['layout', 'pages', roadmap.pageIndex, 'board', 'panels', panelIndex, 'title']}
                                />
                              )}
                            />
                          ),
                          preContent: (
                            <>
                              {!panel.title && (
                                <Button
                                  className={classes.roadmapPanelAddTitleButton}
                                  onClick={() => (props.editor.getProperty(['layout', 'pages', roadmap.pageIndex, 'board', 'panels', panelIndex, 'title']) as ConfigEditor.StringProperty)
                                    .set(roadmap.categoryAndIndex.category.workflow.statuses.find(s => s.statusId === panel.search.filterStatusIds?.[0])?.name || 'Title')}
                                >
                                  Add title
                                </Button>
                              )}
                              <PropertyByPathReduxless
                                marginTop={0}
                                planId={planId}
                                width='auto'
                                editor={props.editor}
                                path={['layout', 'pages', roadmap.pageIndex, 'board', 'panels', panelIndex, 'search', 'filterStatusIds']}
                                bare
                                TextFieldProps={{
                                  placeholder: 'Filter',
                                  classes: { root: classes.filterStatus },
                                  InputProps: {
                                    classes: { notchedOutline: classes.filterStatusInput },
                                  },
                                }}
                              />
                            </>
                          ),
                        }}
                      />
                    ))}
                  />
                </Provider>
              </>
            )}
          </>
        )
        }
      />
    </ProjectSettingsBase>
  );
}
export const ProjectSettingsChangelog = (props: {
  server: Server;
  editor: ConfigEditor.Editor;
}) => {
  return (
    <ProjectSettingsBase title='Changelog'>
      <p>TODO enable</p>
      <p>TODO tags</p>
    </ProjectSettingsBase>
  );
}

export const ProjectSettingsData = (props: {
  server: Server;
}) => {
  return (
    <ProjectSettingsBase title='Data'>
      <DataSettings
        server={props.server}
      />
    </ProjectSettingsBase>
  );
}

const Section = (props: {
  title?: string;
  description?: string;
  content: any;
  preview?: any;
}) => {
  const classes = useStyles();
  return (
    <div className={classes.previewContainer}>
      <div className={classes.previewContent}>
        {!!props.title && (
          <Typography variant='h5' component='h2' className={classes.previewTitle}>{props.title}</Typography>
        )}
        {!!props.description && (
          <Typography variant='body1' component='div'>{props.description}</Typography>
        )}
        {props.content}
      </div>
      <div className={classes.previewSpacer} />
      {props.preview && (
        <div className={classes.previewPreview}>
          {props.preview}
        </div>
      )}
    </div>
  );
}
const BrowserPreview = (props: {
  server: Server;
  children?: any;
  FakeBrowserProps?: React.ComponentProps<typeof FakeBrowser>;
  suppressStoreProvider?: boolean;
  suppressThemeProvider?: boolean;
  code?: string;
  addresBar?: 'website';
  scroll?: Orientation;
}) => {
  const theme = useTheme();
  const classes = useStyles();
  var preview = props.children;
  if (!props.suppressThemeProvider) {
    preview = (
      <AppThemeProvider
        appRootId={props.server.getProjectId()}
        seed={props.server.getProjectId()}
        isInsideContainer={true}
        supressCssBaseline={true}
        containerStyle={!props.scroll ? undefined : {
          ...contentScrollApplyStyles({
            theme,
            orientation: props.scroll,
          }),
        }}
      >
        {preview}
      </AppThemeProvider>
    );
  }
  preview = (
    <BrowserPreviewInternal
      FakeBrowserProps={props.FakeBrowserProps}
      addresBar={props.addresBar}
      code={props.code}
    >
      {preview}
    </BrowserPreviewInternal>
  );
  if (!props.suppressStoreProvider) {
    preview = (
      <Provider key={props.server.getProjectId()} store={props.server.getStore()}>
        {preview}
      </Provider>
    );
  }
  return preview;
}
const BrowserPreviewInternal = (props: {
  children?: any;
  code?: string;
  addresBar?: 'website';
  FakeBrowserProps?: React.ComponentProps<typeof FakeBrowser>;
}) => {
  const theme = useTheme();
  const classes = useStyles();
  const darkMode = useSelector<ReduxState, boolean>(state => !!state?.conf?.conf?.style.palette.darkMode, shallowEqual);
  const website = useSelector<ReduxState, string | undefined>(state => state?.conf?.conf?.website, shallowEqual);
  const addresBar = props.addresBar === 'website'
    ? (website || 'yoursite.com')
    : undefined;
  return (
    <FakeBrowser
      fixedWidth={350}
      codeMaxHeight={150}
      className={classes.browserPreview}
      darkMode={darkMode}
      addresBarContent={addresBar}
      codeContent={props.code}
      {...props.FakeBrowserProps}
    >
      {props.children}
    </FakeBrowser>
  );
}



class TemplateWrapper<T> extends Component<{
  editor: ConfigEditor.Editor;
  mapper: (templater: Templater) => Promise<T>;
  render: (templater: Templater, response: T) => any;
}, {
  confirmation?: Confirmation;
  confirm?: (response: ConfirmationResponseId) => void;
  mappedValue?: { val: T };
}> {
  unsubscribe?: () => void;
  templater: Templater;

  constructor(props) {
    super(props);

    this.state = {};

    this.templater = Templater.get(
      props.editor,
      (confirmation) => new Promise<ConfirmationResponseId>(resolve => this.setState({
        confirmation,
        confirm: resolve,
      })));

  }

  componentDidMount() {
    const refreshMappedValue = () => {
      this.props.mapper(this.templater)
        .then(mappedValue => this.setState({ mappedValue: { val: mappedValue } }));
    }

    const remapDebounced = debounce(() => {
      refreshMappedValue();
    }, 10);
    this.unsubscribe = this.props.editor.subscribe(() => remapDebounced());

    refreshMappedValue();
  }

  componentWillUnmount() {
    this.unsubscribe && this.unsubscribe();
  }

  render() {
    return (
      <>
        <Collapse in={!!this.state.confirm}>
          <Alert
            style={{ maxWidth: 500 }}
            severity='warning'
          >
            <AlertTitle>{this.state.confirmation?.title}</AlertTitle>
            {this.state.confirmation?.description}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}>
              {this.state.confirmation?.responses.map(response => (
                <Button
                  size='small'
                  color='inherit'
                  style={{
                    textTransform: 'none',
                    color: response.type === 'cancel' ? 'darkred' : undefined,
                  }}
                  onClick={() => {
                    this.state.confirm?.(response.id);
                    this.setState({ confirm: undefined });
                  }}
                >
                  {response.title}
                </Button>
              ))}
            </div>
          </Alert>
        </Collapse>
        <Collapse in={!this.state.confirm}>
          {this.state.mappedValue && this.props.render(this.templater, this.state.mappedValue.val)}
        </Collapse>
      </>
    );
  }
}
const PropertyByPath = (props: Omit<React.ComponentProps<typeof PropertyByPathReduxless>, 'planId'>) => {
  var planId = useSelector<ReduxStateAdmin, string | undefined>(state => state.account.account.account?.basePlanId, shallowEqual);
  return (<PropertyByPathReduxless planId={planId} {...props} />);
}

const PropertyByPathReduxless = (props: {
  planId: string | undefined;
  editor: ConfigEditor.Editor;
  path: ConfigEditor.Path;
  overrideName?: string;
  overrideDescription?: string;
  marginTop?: number;
  width?: string | number;
  inputMinWidth?: string | number;
  TextFieldProps?: Partial<React.ComponentProps<typeof TextField>>;
  TablePropProps?: Partial<React.ComponentProps<typeof TableProp>>;
  bare?: boolean;
}) => {
  const history = useHistory();

  var propertyRequiresUpgrade: ((propertyPath: ConfigEditor.Path) => boolean) | undefined;
  const restrictedProperties = props.planId && RestrictedProperties[props.planId];
  if (restrictedProperties) {
    propertyRequiresUpgrade = (path) => restrictedProperties.some(restrictedPath =>
      ConfigEditor.pathEquals(restrictedPath, path));
  }

  return (
    <Property
      key={ConfigEditor.pathToString(props.path)}
      prop={props.editor.get(props.path)}
      pageClicked={path => history.push(`/dashboard/settings/project/advanced/${path.join('/')}`)}
      requiresUpgrade={propertyRequiresUpgrade}
      marginTop={props.marginTop}
      width={props.width || propertyWidth}
      inputMinWidth={props.inputMinWidth}
      overrideName={props.overrideName}
      overrideDescription={props.overrideDescription}
      TextFieldProps={props.TextFieldProps}
      TablePropProps={props.TablePropProps}
      bare={props.bare}
    />
  );
}


const PropertyShowOrEdit = (props: {
  allowEdit: boolean;
  show: React.ReactNode;
  edit: React.ReactNode;
}) => {
  const classes = useStyles();
  const [editing, setEditing] = useState<boolean>(false);
  if (!props.allowEdit && editing) setEditing(false);
  return (
    <>
      <Collapse in={!editing}>
        <div className={classes.showOrEdit}>
          {props.show}
          {props.allowEdit && (
            <IconButton
              className={classes.showOrEditButton}
              size='small'
              onClick={e => {
                setEditing(true);
                e.stopPropagation();
              }}
              onFocus={e => e.stopPropagation()}
            >
              <EditIcon />
            </IconButton>
          )}
        </div>
      </Collapse>
      <Collapse in={editing}>
        <div
          onClick={e => e.stopPropagation()}
          onFocus={e => e.stopPropagation()}
        >
          {props.edit}
        </div>
      </Collapse>
    </>
  );
};
