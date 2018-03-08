import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Paper from 'material-ui/Paper';
import { FormattedMessage } from 'react-intl';
import formatMessage from '~/utils/formatMessage';
import {
  withRouter,
} from 'react-router-dom';
import {
  rememberMe,
} from '../App/actions';
import { messages } from '../App/translation';
import {
  Redirect,
} from 'react-router-dom';
import Typography from 'material-ui/Typography';
import LocaleDropdown from '~/containers/LocaleDropdown'

import IconButton from 'material-ui/IconButton';
import ArrowBack from 'material-ui-icons/ArrowBack';

import SwipeableViews from 'react-swipeable-views';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';

import {
  createFormStyle,
} from '~/components/SignInSignUp';
import { createStructuredSelector } from 'reselect';
import modelMap from '~/containers/App/modelMap';
import {
  makeUserSessionSelector,
  makeRememberUserSelector,
  makeUserSessionCreateError,
  makeUserCreateError,
} from '~/containers/App/selectors';

const {
  createSession,
  createSessionCancel,
  createUser,
  createUserCancel,
} = modelMap.actions;

const styles = theme => ({
  ...createFormStyle(theme),
  flexContainer: {
    display: 'flex',
    height: '100%',
  },
  spacing: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  paper: {
    margin: 0,
    width: '100%',
    paddingRight: 0,
    paddingLeft: 0,
    height: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 500,
      margin: 80,
    },
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  },
  toolBar: {
    // minHeight: 48,
    // height: 48,
  },
});

class Login extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      tabIndex: 0,
    };
  }

  componentWillMount(){
    let { location, session } = this.props;
    let fromPath = location.state && location.state.from.pathname;
    if(!session){
      fromPath && console.log(`Redirected page from ${fromPath} to Login`);
    }
  }

  swipeTo = (tabIndex) => {
    this.setState({ tabIndex });
  };

  render(){
    let { location, intl, createSession, createUser, session, rememberUser, loginError, createUserError, classes } = this.props;
    let fromPath = location.state && location.state.from.pathname;
    const wrongUsernameOrPassword = formatMessage(intl, messages.wrongUsernameOrPassword, {});
    const usernameIsTaken = formatMessage(intl, messages.usernameIsTaken, {});

    if(session){
      fromPath = fromPath || '/';
      return (
        <Redirect to={{
          pathname: fromPath,
        }}/>
      );
    }

    const login = (username, password, rememberUser) => {
      const { rememberMe } = this.props;
      rememberMe(rememberUser);
      // popup('/auth-popup.html');
      // return ;
      createSession({
        auth_type: 'basic',
        username,
        password,
      });
    };

    const register = (username, password) => {
      createUser({
        name: username,
        privilege: 'admin',
        accountLinks: [{
          auth_type: 'basic',
          username,
          password,
        }],
      },
      {})
    };

    return (
      <div className={classes.flexContainer}>
        <div className={classes.spacing} />
        <Paper className={classes.paper} elevation={4}>
          <AppBar position="static">
            <Toolbar className={classes.toolBar}>
              {!!this.state.tabIndex && <IconButton className={classes.menuButton} color="inherit" aria-label="Back" onClick={() => { this.swipeTo(0); }}>
                <ArrowBack/>
              </IconButton>}
              <Typography variant="title" color="inherit" className={classes.flex}>
                {
                  this.state.tabIndex ? <FormattedMessage {...messages.createAccount} />
                  : <FormattedMessage {...messages.login} />
                }
              </Typography>
              <LocaleDropdown />
            </Toolbar>
          </AppBar>
          <SwipeableViews
            index={this.state.tabIndex}
            {...{}/*onChangeIndex={this.handleChangeIndex}*/}
            disabled={true}
          >
            <LoginForm
              usernameError={!this.state.tabIndex && !!loginError}
              passwordError={!this.state.tabIndex && loginError && wrongUsernameOrPassword}
              defaultRememberMe={rememberUser}
              onSubmit={login}
              handleForgotPassword={() => this.swipeTo(1)}
              handleCreateAccount={() => this.swipeTo(1)}
            />
            <RegistrationForm
              usernameError={this.state.tabIndex && createUserError && usernameIsTaken}
              onSubmit={register}
              comfirmUserAgreement={true}
            />
          </SwipeableViews>
        </Paper>
        <div className={classes.spacing} />
      </div>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  session: makeUserSessionSelector(),
  rememberUser: makeRememberUserSelector(),
  loginError: makeUserSessionCreateError(),
  createUserError: makeUserCreateError(),
});

export default compose(
  connect(
    mapStateToProps,
    {
      createSession,
      createSessionCancel,
      createUser,
      createUserCancel,
      rememberMe,
    }
  ),
  injectIntl,
  withStyles(styles),
)(Login);
