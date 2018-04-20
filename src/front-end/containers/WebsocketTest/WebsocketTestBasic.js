import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import Button from 'material-ui/Button';
import axios from 'axios';

import {
  readTestApi,
  cancelReadTestApi,
} from './actions';

import modelMap from '../App/modelMap';

const {
  postWsSessions,
  cancelPostWsSessions,
} = modelMap.actions;

class WebsocketTestBasic extends React.Component {
  read = () => {
    let { readTestApi, postWsSessions } = this.props;
    let r = {
      method: 'post',
      url: '/api/sessions',
      data: {
        auth_type: 'basic',
        username: 'admin',
        password: 'admin',
      },
    };
    return axios(r)
    .then(({ data }) => {
      postWsSessions({
        token: data.token,
      });
    });
  };

  cancel = () => {
    let { cancelReadTestApi, cancelPostWsSessions } = this.props;
    return cancelPostWsSessions();
  };

  render(){
    let { testApiData , classes } = this.props;
    console.log('testApiData :', testApiData);
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

export default compose(
  connect(
    state => ({ testApiData: state.get('WebsocketTest').data }),
    {
      readTestApi,
      cancelReadTestApi,
      postWsSessions,
      cancelPostWsSessions,
    }
  ),
)(WebsocketTestBasic);
