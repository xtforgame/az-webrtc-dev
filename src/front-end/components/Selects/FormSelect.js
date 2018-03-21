import React from 'react';
import { compose } from 'recompose';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import { FormControl, FormHelperText } from 'material-ui/Form';
import Input, { InputLabel } from 'material-ui/Input';
import Select from 'material-ui/Select';

let styles = theme => ({
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
    ...rest,
  } = props;
  return (
    <FormControl {...formProps}>
      {!!label && <InputLabel htmlFor={id}>{label}</InputLabel>}
      <Select
        inputProps={{
          ...inputProps,
          name,
          id,
        }}
        {...rest}
      >
      </Select>
      {!!helperText && <FormHelperText id={`${id}-helper-text`}>{helperText}</FormHelperText>}
    </FormControl>
  );
}

FormTextSelect.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired,
};

export default compose(
  withStyles(styles),
)(FormTextSelect);
