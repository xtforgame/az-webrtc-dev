import React from 'react';
import { compose } from 'recompose';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import Divider from 'material-ui/Divider';

import { messages } from '~/containers/App/translation';
import formatMessage from '~/utils/formatMessage';
import {
  createFormStyle,
  FormSpace,
  FormContent,
  FormTextInput,
  FormPasswordInput,
  FormCheckbox,
} from '~/components/SignInSignUp';

import TextFieldHelper from './TextFieldHelper';

class LoginForm extends React.Component {
  constructor(props){
    super(props);
    this.textFieldHelper = new TextFieldHelper(this);
    this.textFieldHelper.add({
      name: 'username',
      onChangePropName: 'onUsernameChange',
      errorPropName: 'usernameError',
      validate: value => value != null && value != '',
    }, {
      name: 'password',
      type: 'password',
      onChangePropName: 'onPasswordChange',
      errorPropName: 'passwordError',
      validate: value => value != null && value != '',
    });

    this.state = {
      ...this.textFieldHelper.getInitState(),
      showPassword: false,
      rememberMe: false,
    };
  }

  handleSubmit = () => {
    const {
      onSubmit = () => {},
    } = this.props;

    if(this.textFieldHelper.validate()){
      onSubmit(this.state.username, this.state.password, this.state.rememberMe);
    }
  }

  handleEnterForTextField = (event) => {
    if (event.key === 'Enter') {
      this.handleSubmit();
      event.preventDefault();
    }
  };

  handleRememberMeChange = (event, checked) => {
    const {
      onRememberMeChange = () => {},
    } = this.props;
    onRememberMeChange(checked);
    this.setState({ rememberMe: checked });
  };

  componentWillMount(){
    const {
      defaultRememberMe = false,
    } = this.props;
    this.setState({ rememberMe: defaultRememberMe });
  }

  render(){
    const {
      intl,
      handleForgotPassword = () => {},
      handleCreateAccount = () => {},
      classes,
    } = this.props;

    const usernameText = formatMessage(intl, messages.username, {});
    const passwordText = formatMessage(intl, messages.password, {});
    const loginText = formatMessage(intl, messages.login, {});
    const rememberMeText = formatMessage(intl, messages.rememberMe, {});
    const forgotPasswordText = formatMessage(intl, messages.forgotPasswordQuestion, {});
    const createAccountText = formatMessage(intl, messages.createAccount, {});

    return (
      <div>
        <FormSpace variant="top" />
        <FormContent>
          <FormTextInput
            id="username"
            label={usernameText}
            onKeyPress={this.handleEnterForTextField}
            {...this.textFieldHelper.
              getPropsForInputField('username', formatMessage(intl, messages.usernameEmptyError, {}))}
          />
          <FormSpace variant="content1" />
          <FormPasswordInput
            id="password"
            label={passwordText}
            onKeyPress={this.handleEnterForTextField}
            {...this.textFieldHelper
              .getPropsForInputField('password', formatMessage(intl, messages.passwordEmptyError, {}))}
          />
          <FormCheckbox
            dense="true"
            color="primary"
            checked={this.state.rememberMe}
            onChange={this.handleRememberMeChange}
            label={rememberMeText}
            onKeyPress={this.handleEnterForTextField}
          />
          <FormSpace variant="content1" />
          <Button
            variant="raised"
            fullWidth={true}
            color="primary"
            className={classes.loginBtn}
            onClick={this.handleSubmit}>
            {loginText}
          </Button>
          <FormSpace variant="content1" />
          <Typography
            variant="body1"
            color="secondary"
            align="right"
            className={classes.link}
            onClick={handleForgotPassword}
          >
            {forgotPasswordText}
          </Typography>
          <FormSpace variant="content1" />
        </FormContent>
        <Divider />
        <FormContent>
          <Button fullWidth={true} className={classes.loginBtn} onClick={handleCreateAccount}>
            {createAccountText}
          </Button>
        </FormContent>
      </div>
    );
  }
}

export default compose(
  injectIntl,
  withStyles(createFormStyle),
)(LoginForm);
