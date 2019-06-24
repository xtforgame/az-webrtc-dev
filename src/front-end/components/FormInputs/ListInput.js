/* eslint-disable react/no-multi-comp */

import React from 'react';
import uuidv4 from 'uuid/v4';
import { withStyles } from '@material-ui/core/styles';
import Divider from '@material-ui/core/Divider';
import RemoveCircleOutlinedIcon from '@material-ui/icons/RemoveCircleOutlined';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListSubheader from '@material-ui/core/ListSubheader';
import AddCircleOutlinedIcon from '@material-ui/icons/AddCircleOutlined';
import IconButton from '@material-ui/core/IconButton';

const styles = theme => ({
  inputListItem: {
    paddingRight: theme.spacing(1) + 48,
  },
  insetDivider: {
    marginLeft: 16,
    marginRight: 16,
  },
});

class ListInput extends React.Component {
  render() {
    const {
      classes,
      subheader,
      newRowTitle,
      renderInput = () => null,
      value: valueArray = [],
      options = {},
      onChange = () => null,
      getId = (value, index) => index,
      newId = index => uuidv4(),
      renderListItemProps = () => ({}),
      newItemProps,
    } = this.props;

    const removeItem = index => () => {
      const newValue = [...valueArray];
      const id = getId(newValue[index], index);
      const removed = newValue.splice(index, 1);
      onChange({
        type: 'remove',
        id,
        index,
        value: newValue,
        removed,
      });
    };

    const newItem = () => {
      const newValue = [...valueArray];
      const index = newValue.length;
      const id = newId(index);
      onChange({
        type: 'add',
        id,
        index,
        value: newValue,
      });
    };

    return (
      <List
        subheader={<ListSubheader disableSticky component="div">{subheader}</ListSubheader>}
      >
        {valueArray && valueArray.map((value, index) => {
          const id = getId(value, index);
          const onValueChange = (v) => {
            const newValue = [...valueArray];
            newValue.splice(index, 1, v);
            onChange({
              type: 'modify',
              index,
              id,
              value: newValue,
            });
          };
          return (
            <React.Fragment key={getId(value, index)}>
              <ListItem
                // divider
                className={classes.inputListItem}
                {...renderListItemProps({
                  value, id, index, onChange: onValueChange, options,
                })}
              >
                {renderInput({
                  value, id, index, onChange: onValueChange, options,
                })}
                <ListItemSecondaryAction>
                  <IconButton
                    aria-label="Remove"
                    onClick={removeItem(index)}
                  >
                    <RemoveCircleOutlinedIcon color="secondary" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" className={classes.insetDivider} />
            </React.Fragment>
          );
        })}
        <ListItem
          // divider
          button
          className={classes.inputListItem}
          onClick={newItem}
          {...newItemProps}
        >
          <ListItemText
            primary={newRowTitle}
          />
          <ListItemSecondaryAction>
            <IconButton
              aria-label="Add"
              onClick={newItem}
            >
              <AddCircleOutlinedIcon color="primary" />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    );
  }
}

export default withStyles(styles)(ListInput);
