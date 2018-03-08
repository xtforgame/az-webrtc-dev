// @flow weak

import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import Menu, { MenuItem } from 'material-ui/Menu';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { injectIntl } from 'react-intl';
import { changeLocale } from '~/containers/LanguageProvider/actions';
import { makeSelectLocale } from '~/containers/LanguageProvider/selectors';
import { appLocales, appLocaleNames, localeIndex } from '~/i18n';
import { compose } from 'recompose';

const styles = theme => ({
});

class LocaleDropdown extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      anchorEl: null,
      open: false,
      selectedIndex: 0,
    };
  }

  handleClick = event => {
    this.setState({
      open: true,
      anchorEl: event.currentTarget,
    });
  };

  handleRequestClose = () => {
    this.setState({ open: false });
  };

  handleMenuItemClick = (event, index, locale) => {
    const { changeLocale } = this.props;

    changeLocale(locale);
    this.setState({
      selectedIndex: index,
      open: false,
    });
  };

  getMenuItmes(){
    const { locale, changeLocale } = this.props;
    return appLocales.map((_locale, i) => {
      return (
        <MenuItem
          key={_locale}
          selected={localeIndex[locale] === i}
          onClick={event => this.handleMenuItemClick(event, i, _locale)}
        >
          {appLocaleNames[i]}
        </MenuItem>
      );
    });
  }

  render(){
    const { classes, locale, dispatch, changeLocale, ...props } = this.props;
    return (
      <div>
        <Button
          color="inherit"
          aria-owns={this.state.open ? 'simple-menu' : null}
          aria-haspopup="true"
          {...props}
          onClick={this.handleClick}
        >
          {appLocaleNames[localeIndex[locale]]}
        </Button>
        <Menu
          id="simple-menu"
          anchorEl={this.state.anchorEl}
          open={this.state.open}
          onClose={this.handleRequestClose}
        >
          {this.getMenuItmes()}
        </Menu>
      </div>
    );
  }
}

const mapStateToProps = createSelector(
  makeSelectLocale(),
  (locale) => ({ locale })
);

function mapDispatchToProps(dispatch) {
  return {
    changeLocale: (locale) => dispatch(changeLocale(locale)),
    dispatch,
  };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
  withStyles(styles),
)(LocaleDropdown);
