import ServiceBase from '../ServiceBase';
import GenericUserSessionManager from './GenericUserSessionManager';

export default class UserManager extends ServiceBase {
  static $name = 'userManager';

  static $type = 'service';

  static $inject = [];

  constructor() {
    super();
    this.userSessionManager = new GenericUserSessionManager();
  }

  onStart() {
  }
}
