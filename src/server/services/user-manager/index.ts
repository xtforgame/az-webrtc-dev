import ServiceBase from '../ServiceBase';
import GenericUserSessionManager from './GenericUserSessionManager';
import {
  PeerClassType,
} from '~/websocket/index';

export default class UserManager extends ServiceBase {
  static $name = 'userManager';

  static $type = 'service';

  static $inject = [];

  gusm : GenericUserSessionManager<PeerClassType>;
  constructor() {
    super();
    this.gusm = new GenericUserSessionManager<PeerClassType>();
  }

  onStart() {
  }
}
