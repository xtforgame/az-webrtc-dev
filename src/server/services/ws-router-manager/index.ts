import ServiceBase from '../ServiceBase';
// ========================================

import PreprocessRouter from '~/ws-routers/PreprocessRouter';
import ChannelRouter from '~/ws-routers/ChannelRouter';

export default class WsRouterManager extends ServiceBase {
  static $name = 'wsRouterManager';

  static $type = 'service';

  static $inject = ['wsApp', 'userManager', 'botManager'];

  static $funcDeps = {
    start: ['botManager'],
  };

  routers : any;

  constructor(wsApp, userManager, botManager) {
    super();

    this.routers = [
      PreprocessRouter,
      ChannelRouter,
    ]
      .map(Router => new Router({
        gusm: userManager.gusm,
        botManager,
      }).setupRoutes(wsApp.appConfig));
  }

  onStart() {
  }
}
