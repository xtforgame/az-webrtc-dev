import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import Button from '@material-ui/core/Button';

import { createStructuredSelector } from 'reselect';
import modelMap from '~/containers/App/modelMap';
import {
  makeUserSessionSelector,
} from '~/containers/App/selectors';

import {
  readTestApi,
  cancelReadTestApi,
} from './actions';

const {
  postWsSessions,
  cancelPostWsSessions,
} = modelMap.actions;

class WebsocketTestBasic extends React.Component {
  read = () => {
    const { session, postWsSessions } = this.props;
    return postWsSessions({
      token: session.token,
    });
  };

  cancel = () => {
    const { cancelPostWsSessions } = this.props;
    return cancelPostWsSessions();
  };

  render() {
    return (
      <div>
        <Button
          dense="true"
          color="primary"
          onClick={this.read}
        >
          Read Test Api
        </Button>
        <Button
          dense="true"
          color="primary"
          onClick={this.cancel}
        >
          Cancel
        </Button>
      </div>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  session: makeUserSessionSelector(),
});

export default compose(
  connect(
    mapStateToProps,
    {
      readTestApi,
      cancelReadTestApi,
      postWsSessions,
      cancelPostWsSessions,
    }
  ),
)(WebsocketTestBasic);
