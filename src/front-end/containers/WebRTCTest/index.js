import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import { makeModule } from 'rrw-module';
import {
  readTestApi,
  cancelReadTestApi,
} from './actions';
import reducer from './reducer';
import epic from './epic';

const styles = {
  placeholder: {
    height: 40,
  },
  cardContainer: {
    display: 'flex',
    flexWrap: 'wrap',
  },

  cardWrapper: {
    margin: 8,
  },
  icon: {
    fontSize: 24,
  },
  listFull: {
    width: 'auto',
  },
};

class WebRTCTest extends React.Component {
  render() {
    const { routeView, classes } = this.props;

    return (
      <div>
        <Typography variant="display3">
          WebRTC
        </Typography>
        <Divider />
        <div className={classes.placeholder} />
        { routeView }
      </div>
    );
  }
}

export default compose(
  makeModule('WebRTCTest', {
    reducer,
    epic,
  }),
  connect(
    state => ({ testApiData: state.get('WebRTCTest').data }),
    {
      readTestApi,
      cancelReadTestApi,
    }
  ),
  withStyles(styles),
)(WebRTCTest);
