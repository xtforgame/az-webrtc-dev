import React from 'react';
import { compose } from 'recompose';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import Divider from 'material-ui/Divider';

import { FormattedMessage } from 'react-intl';
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

import SuccessButton from '~/components/Buttons/SuccessButton';

const LinkInternal = ({text, url, classes}) => (
  <a
    className={classes.link}
    onClick={event => {
      event.stopPropagation();
      event.preventDefault();
    }}
  >{text}</a>
);

const Link = compose(
  withStyles(createFormStyle),
)(LinkInternal);

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
      agreed: false,
    };
  }

  handleSubmit = () => {
    const {
      comfirmUserAgreement = false,
      onSubmit = () => {},
    } = this.props;

    if((!comfirmUserAgreement || this.state.agreed) && this.textFieldHelper.validate()){
      onSubmit(this.state.username, this.state.password);
    }
  }

  handleEnterForTextField = (event) => {
    if (event.key === 'Enter') {
      this.handleSubmit();
      event.preventDefault();
    }
  };

  onAgreementChange = () => {
    this.setState({ agreed: !this.state.agreed });
  };

  render(){
    let {
      intl,
      comfirmUserAgreement = false,
      classes,
    } = this.props;

    let usernameText = formatMessage(intl, messages.username, {});
    let passwordText = formatMessage(intl, messages.password, {});
    let createAccountText = formatMessage(intl, messages.createAccountV, {});
    let terms = formatMessage(intl, messages.terms, {});
    let privacyPolicy = formatMessage(intl, messages.privacyPolicy, {});

    const userAgreementLable = (
      <FormattedMessage
        {...messages.userAgreement}
        values={{
          createAccountV: createAccountText,
          terms: (<Link key="terms" text={terms} />),
          privacyPolicy: (<Link key="privacyPolicy" text={privacyPolicy} />),
        }}
      >
        {(...parts) => {
          return (
            <Typography
              variant="body1"
              className={classes.textContainer}
              onClick={event => {
                event.stopPropagation();
                event.preventDefault();
              }}
              onMouseDown={event => {
                event.stopPropagation();
                event.preventDefault();
              }}
              onClick={event => {
                event.stopPropagation();
                event.preventDefault();
              }}
            >
              {parts}
            </Typography>
          );
        }}
      </FormattedMessage>
    );

    return (
      <div>
        <FormSpace variant="top" />
        <FormContent>
        <FormTextInput
            id="register-username"
            label={usernameText}
            onKeyPress={this.handleEnterForTextField}
            {...this.textFieldHelper.
              getPropsForInputField('username', formatMessage(intl, messages.usernameEmptyError, {}))}
          />
          <FormSpace variant="content1" />
          <FormPasswordInput
            id="register-password"
            label={passwordText}
            onKeyPress={this.handleEnterForTextField}
            {...this.textFieldHelper
              .getPropsForInputField('password', formatMessage(intl, messages.passwordEmptyError, {}))}
          />
          <FormSpace variant="content2" />
          {
            !!comfirmUserAgreement && (<FormCheckbox
              dense="true"
              color="primary"
              checked={this.state.agreed}
              onChange={this.onAgreementChange}
              label={userAgreementLable}
              onKeyPress={this.handleEnterForTextField}
            />)
          }
          <FormSpace variant="content2" />
          {
            !comfirmUserAgreement && (userAgreementLable)
          }
          <SuccessButton
            variant="raised"
            fullWidth={true}
            color="primary"
            disabled={comfirmUserAgreement && !this.state.agreed}
            className={classes.loginBtn}
            onClick={this.handleSubmit}
          >
            {createAccountText}
          </SuccessButton>
          <FormSpace variant="content1" />
        </FormContent>
      </div>
    );
  }
}

export default compose(
  injectIntl,
  withStyles(createFormStyle),
)(LoginForm);
