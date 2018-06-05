/* eslint-disable no-console */
import { WsApp as WsKoaStyleApp } from 'ricio/node';
import ServiceBase from '../ServiceBase';
import getRedirectApp from './getRedirectApp';
import runWsServer from './runWsServer';
import GenericRouter from './GenericRouter';
import PeerClass from './PeerClass';
import { wsPort, wssPort } from '../../common/core/config';

export default class WsApp extends ServiceBase {
  static $name = 'wsApp';

  static $type = 'service';

  static $inject = ['envCfg', 'userManager'];

  constructor(envCfg, userManager) {
    super();
    /* let credentials = */this.credentials = envCfg.credentials;
    this.userSessionManager = userManager.userSessionManager;
    this.app = new WsKoaStyleApp();
    this.router = new GenericRouter();
    this.app.use((ctx, next) => next().catch((e) => {
      console.log(`Error on (${ctx.path}) :`, e);
      ctx.rcResponse.throw(500);
    }));
    this.app
    .use(this.router.routes());

    this.appConfig = {
      PeerClass,
      router: this.router,
      userSessionManager: this.userSessionManager,
    };
  }

  onStart() {
    const httpRedirectApp = getRedirectApp(this.appConfig);
    return new Promise((resolve) => {
      runWsServer(httpRedirectApp, this.app, this.credentials, this.appConfig, resolve, wsPort, wssPort);
    });
  }
}
