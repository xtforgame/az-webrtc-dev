/* eslint-disable react/prop-types, react/forbid-prop-types */
import React from 'react';
import { compose } from 'recompose';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';

const styles = theme => ({
});

const FormTextSelect = (props) => {
  const {
    id,
    name,
    label,
    helperText,
    formProps,
    classes,
    inputProps,
    ...rest
  } = props;
  return (
    <FormControl {...formProps}>
      {!!label && (
        <InputLabel htmlFor={id}>
          {label}
        </InputLabel>
      )}
      <Select
        inputProps={{
          ...inputProps,
          name,
          id,
        }}
        {...rest}
      />
      {!!helperText && (
        <FormHelperText id={`${id}-helper-text`}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

FormTextSelect.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired,
};

export default compose(
  withStyles(styles),
)(FormTextSelect);
