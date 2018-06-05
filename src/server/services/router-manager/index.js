import ServiceBase from '../ServiceBase';
//= =======================================
import MainRouter from '~/routers/MainRouter';
import SessionRouter from '~/routers/SessionRouter';
import UserRouter from '~/routers/UserRouter';
import UserSettingRouter from '~/routers/UserSettingRouter';
import RecoveryRouter from '~/routers/RecoveryRouter';
import MemoRouter from '~/routers/MemoRouter';

export default class RouterManager extends ServiceBase {
  static $name = 'routerManager';

  static $type = 'service';

  static $inject = ['httpApp', 'mailer', 'userManager'];

  constructor(httpApp, mailer, userManager) {
    super();
    this.mailer = mailer;

    this.routers = [
      MainRouter,
      SessionRouter,
      UserRouter,
      UserSettingRouter,
      RecoveryRouter,
      MemoRouter,
    ]
    .map(Router => new Router({
      mailer: this.mailer,
      userSessionManager: userManager.userSessionManager,
    }).setupRoutes(httpApp.appConfig));
  }

  onStart() {
  }
}
