/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react';
import JssProvider from 'react-jss/lib/JssProvider';
import LanguageProvider from '~/containers/LanguageProvider';
import { withStyles, MuiThemeProvider } from 'material-ui/styles';
import createContext from '../styles/createContext';

const context = createContext();

export default function withRoot(BaseComponent) {
  class WithRoot extends Component {
    constructor(props){
      super(props);
    }
    componentDidMount() {
      // Remove the server-side injected CSS.
      const jssStyles = document.querySelector('#jss-server-side');
      if (jssStyles && jssStyles.parentNode) {
        jssStyles.parentNode.removeChild(jssStyles);
      }
    }

    render() {
      return (
        <JssProvider registry={context.sheetsRegistry} jss={context.jss}>
          <MuiThemeProvider theme={context.theme} sheetsManager={context.sheetsManager}>
            <LanguageProvider messages={this.props.messages}>
              <BaseComponent {...this.props} />
            </LanguageProvider>
          </MuiThemeProvider>
        </JssProvider>
      );
    }
  }

  return WithRoot;
}
