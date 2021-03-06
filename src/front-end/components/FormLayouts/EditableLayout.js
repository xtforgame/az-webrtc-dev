import React from 'react';
import useEditableLayoutFeatures from '~/hooks/useEditableLayoutFeatures';
import Button from '@material-ui/core/Button';

const EditableLayout = (props) => {
  const {
    extraContents,
    children,
    submitButtonText,
    styleNs = [],
  } = props;

  const {
    il, resetIl, classesByNs, tData: { t/* , i18n, ready */ }, host,
    Content, space, topSpace,
  } = useEditableLayoutFeatures({
    ...props,
    styleNs: [...styleNs, 'login'],
  });

  il.updateHost(host);

  return (
    <React.Fragment>
      {topSpace}
      <Content>
        {
          il.fieldLinks.map((filedLink) => {
            const defaultSpace = 'space' in filedLink.options ? filedLink.options.space : space;
            return (
              <React.Fragment key={filedLink.name}>
                {il.renderComponent(filedLink.name, { translate: t })}
                {defaultSpace}
              </React.Fragment>
            );
          })
        }
        {extraContents}
        <Button
          variant="contained"
          fullWidth
          color="primary"
          className={classesByNs.login.loginBtn}
          onClick={host.handleSubmit}
        >
          {submitButtonText}
        </Button>
      </Content>
      {children}
    </React.Fragment>
  );
};
EditableLayout.displayName = 'EditableLayout';

export default EditableLayout;
