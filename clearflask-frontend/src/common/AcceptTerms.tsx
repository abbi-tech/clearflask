import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import React from 'react';
import Delimited from '../app/utils/Delimited';

export interface Term {
  shortName?: string;
  link?: string;
}

const legalDefault: Array<Term> = [
  { shortName: 'Privacy', link: 'https://clearflask.com/privacy' },
  { shortName: 'Terms', link: 'https://clearflask.com/terms' },
];

const styles = (theme: Theme) => createStyles({
  legal: {
    marginTop: theme.spacing(1),
    display: 'flex',
    justifyContent: 'center',
    whiteSpace: 'pre-wrap',
    fontSize: '0.7em',
    color: theme.palette.text.hint,
  },
  legalLink: {
    color: 'unset',
    borderBottom: '1px dashed',
    textDecoration: 'none',
    '&:hover': {
      borderBottomStyle: 'solid',
    },
  },
});

interface Props {
  overrideTerms?: Array<Term>;
}

class AcceptTerms extends React.Component<Props & WithStyles<typeof styles, true>> {
  render() {
    var legalDocs: Array<Term> = this.props.overrideTerms || legalDefault;
    return (legalDocs && legalDocs.length > 0) ? (
      <div className={this.props.classes.legal}>
        {'You agree to our '}
        <Delimited delimiter={', '} delimiterLast={' and '}>
          {legalDocs.map(doc => (
            <a href={doc.link} target="_blank" rel="noopener nofollow" className={this.props.classes.legalLink}>{doc.shortName}</a>
          ))}
        </Delimited>
      </div>
    ) : null;
  }
}

export default withStyles(styles, { withTheme: true })(AcceptTerms);
