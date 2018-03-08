import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import Button from 'material-ui/Button';

import {
  readTestApi,
  cancelReadTestApi,
} from './actions';

class WebsocketTestBasic extends React.Component {
  read = () => {
    let { readTestApi } = this.props;
    return readTestApi();
  };

  cancel = () => {
    let { cancelReadTestApi } = this.props;
    return cancelReadTestApi();
  };

  render(){
    let { testApiData, classes } = this.props;
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
    }
  ),
)(WebsocketTestBasic);
