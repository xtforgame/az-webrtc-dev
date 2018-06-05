import { GenericUserSessionManagerType } from '~/services/user-manager/GenericUserSessionManager';

export default class RouterBase {
  gusm!: GenericUserSessionManagerType;
  botManager!: any;

  constructor(_props) {
    const props = _props || {};
    Object.keys(props).map(name => this[name] = props[name]);
  }
}
