/* eslint-disable no-multi-assign */
import ServiceBase from '../ServiceBase';
import InstManager from './InstManager';

export default class BotManager extends ServiceBase {
  static $name = 'botManager';

  static $type = 'service';

  static $inject = ['userManager'];

  constructor(userManager) {
    super();
    this.gusm = userManager.gusm;
  }

  startBots(userId) {
    this.mgr = new InstManager(this.gusm, userId);
    this.mgr.startUpdate();
  }

  onStart() {
    this.startBots('1');
  }

  onDestroy() {
    this.mgr.stopUpdate();
  }
}
