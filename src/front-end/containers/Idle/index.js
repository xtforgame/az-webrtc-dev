import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import RestoreIcon from '@material-ui/icons/Restore';
import ScheduleIcon from '@material-ui/icons/Schedule';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import { push } from 'react-router-redux';
import { makeModule } from 'rrw-module';
import {
  withRouter,
} from 'react-router-dom';

import MobileTabsFrame from '~/containers/MobileTabsFrame';

import reducer from './reducer';

const styles = theme => ({
});

class Idle extends React.PureComponent {
  handleTabChange = (_, value) => {
    // console.log('value :', value);
    this.props.push(value);
  };

  render() {
    const {
      routeView,
      location,
      match,
    } = this.props;

    const tabs = [
      {
        name: 'stats',
        nav: {
          label: 'Stats',
          icon: <RestoreIcon />,
        },
      },
      {
        name: 'bots',
        nav: {
          label: 'Bot',
          icon: <LocationOnIcon />,
        },
      },
      {
        name: 'schedules',
        nav: {
          label: 'Schedules',
          icon: <ScheduleIcon />,
        },
      },
    ];

    return (
      <MobileTabsFrame
        routeView={routeView}
        parentUrl={match.url}
        pathname={location.pathname}
        handleTabChange={this.handleTabChange}
        tabs={tabs}
      />
    );
  }
}

export default compose(
  makeModule('idle', {
    reducer,
  }),
  connect(null, { push }),
  withRouter,
  withStyles(styles),
)(Idle);
