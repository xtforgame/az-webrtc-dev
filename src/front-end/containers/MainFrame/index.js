import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import { push } from 'react-router-redux';
import { messages } from '../App/translation';
import MainAppBar from './MainAppBar';
import {
  getMailFolderList,
  getOtherMailFolderList,
} from './tileData';

import RouteList from './RouteList';
import { withStyles } from 'material-ui/styles';
import Drawer from 'material-ui/Drawer';
import Button from 'material-ui/Button';

import Divider from 'material-ui/Divider';
import Icon from 'material-ui/Icon';

const styles = {
  list: {
    width: 250,
  },
  listFull: {
    width: 'auto',
  },
  mainContent: {
    margin: 40,
    width: 1200,
  },
  appBarPlaceholder: {
    height: 48,
  },
  verticalFlexContainer: {
    flexDirection: 'column',
    display: 'flex',
    height: '100%',
  },
  flexContainer: {
    flex: 1,
    display: 'flex',
  },
  spacing: {
    flex: 1,
  },
};

class MainFrame extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      drawerOpened: false,
    };
  }

  toggleDrawer = (open) => () => {
    this.setState({
      drawerOpened: open,
    });
  };

  closeDrawer = () => {
    this.setState({
      drawerOpened: false,
    });
  };

  componentWillMount(){
    console.log('MainFrame componentWillMount');
  }

  render(){
    let { routeView, push, classes } = this.props;
    const sideList = (
      <div className={classes.list}>
        <RouteList closeDrawer={this.closeDrawer} />
        <Divider />
        {getMailFolderList(this.closeDrawer, () => push('/home'), () => push('/async-in-main'), () => push('/login'))}
        <Divider />
        {getOtherMailFolderList(this.closeDrawer)}
      </div>
    );

    return (
      <div>
        <MainAppBar
          onToggleMenu={this.toggleDrawer(true)}
        />
        <div className={classes.verticalFlexContainer}>
          <div className={classes.appBarPlaceholder} />
          <div className={classes.flexContainer}>
            <div className={classes.spacing} />
            <div className={classes.mainContent}>
              {routeView}
            </div>
            <div className={classes.spacing} />
          </div>
        </div>
        <Drawer
          open={this.state.drawerOpened}
          onClose={this.toggleDrawer(false)}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          <div
            tabIndex={0}
            role="button"
            // onClick={this.toggleDrawer(false)}
            // onKeyDown={this.toggleDrawer(false)}
          >
            {sideList}
          </div>
        </Drawer>
      </div>
    );
  }
}

export default compose(
  connect(
    state => ({}),
    { push }
  ),
  injectIntl,
  withStyles(styles),
)(MainFrame);
