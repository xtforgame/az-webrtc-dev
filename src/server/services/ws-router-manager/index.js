import ServiceBase from '../ServiceBase';
// ========================================

import PreprocessRouter from '../../ws-routers/PreprocessRouter';
import MainRouter from '../../ws-routers/MainRouter';

export default class WsRouterManager extends ServiceBase {
  static $name = 'wsRouterManager';
  static $type = 'service';
  static $inject = ['wsApp', 'userManager'];

  constructor(wsApp, userManager) {
    super();

    this.routers = [PreprocessRouter, MainRouter]
      .map(Router => new Router({
        userSessionManager: userManager.userSessionManager,
      }).setupRoutes(wsApp.appConfig));
  }

  onStart() {
  }
}
