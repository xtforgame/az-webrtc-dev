// @flow
// This file is shared across the demos.

import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { withStyles } from 'material-ui/styles';
import ListSubheader from 'material-ui/List/ListSubheader';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';
import Collapse from 'material-ui/transitions/Collapse';
import InboxIcon from 'material-ui-icons/MoveToInbox';
import DraftsIcon from 'material-ui-icons/Drafts';
import SendIcon from 'material-ui-icons/Send';
import ExpandLess from 'material-ui-icons/ExpandLess';
import ExpandMore from 'material-ui-icons/ExpandMore';
import StarBorder from 'material-ui-icons/StarBorder';
import getListHierarchy from './getListHierarchy';

const styles = theme => ({
  root: {
    width: '100%',
    maxWidth: 360,
    background: theme.palette.background.paper,
  },
  nested0: {
  },
  nested1: {
    paddingLeft: theme.spacing.unit * 4,
  },
  nested2: {
    paddingLeft: theme.spacing.unit * 8,
  },
  nested3: {
    paddingLeft: theme.spacing.unit * 12,
  },
});

class RouteList extends React.Component {
  state = {};

  handleClick = (name) => () => {
    this.setState({ [`open-${name}`]: !this.state[`open-${name}`] });
  };

  render() {
    let listHierarchy = getListHierarchy();
    const { closeDrawer, push, classes } = this.props;
    let navigateToFunc = (path) => (e) => {
      closeDrawer && closeDrawer();
      path && push(path);
    };

    let getList = (array = listHierarchy, level = 0, parents = []) => {
      let children = []
      array.map(item => {
        if(item.children){
          children.push(
            <ListItem key={item.name} className={classes[`nested${level}`]} button onClick={this.handleClick(item.name)}>
              <ListItemIcon>
                <InboxIcon />
              </ListItemIcon>
              <ListItemText inset primary={item.title} />
              <ListItemIcon>
                {this.state[`open-${item.name}`] ? <ExpandLess /> : <ExpandMore />}
              </ListItemIcon>
            </ListItem>
          );
          children.push(
            <Collapse key={`${item.name}-collapse`} component="li" in={this.state[`open-${item.name}`]} timeout="auto" unmountOnExit>
              {getList(item.children, 1, parents.concat([item]))}
            </Collapse>
          );
        }else{
          children.push(
            <ListItem key={item.name} className={classes[`nested${level}`]} button onClick={navigateToFunc(item.path)}>
              <ListItemIcon>
                <StarBorder />
              </ListItemIcon>
              <ListItemText inset primary={item.title} />
            </ListItem>
          );
        }
      });

      if (!level) {
        return (
          <List className={classes.root} subheader={<ListSubheader>Nested List Items</ListSubheader>}>
            {children}
          </List>
        );
      }else{
        return (
          <List disablePadding>
            {children}
          </List>
        );
      }
    };

    return getList();
  }
}

export default compose(
  connect(
    state => ({}),
    { push }
  ),
  withStyles(styles),
)(RouteList);
