/* eslint-disable no-console */
import GenericRouter from 'common/core/GenericRouter';
import { WsApp as WsKoaStyleApp } from 'ricio/node';
import ServiceBase from '../ServiceBase';
import getRedirectApp from './getRedirectApp';
import runWsServer from './runWsServer';
import PeerClass from '~/websocket/PeerClass';
import {
  WsPeer,
  WsPeerManager,
} from '~/websocket';
import { wsPort, wssPort } from 'common/config';

export default class WsApp extends ServiceBase {
  static $name = 'wsApp';

  static $type = 'service';

  static $inject = ['envCfg', 'userManager'];

  credentials : any;
  gusm : any;
  app : any;
  router : any;
  appConfig : any;

  constructor(envCfg, userManager) {
    super();
    /* let credentials = */this.credentials = envCfg.credentials;
    this.gusm = userManager.gusm;
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
      rcPeerManager: {
        wsPeerManager: new WsPeerManager(),
        gusm: this.gusm,
      },
    };
  }

  onStart() {
    const httpRedirectApp = getRedirectApp(this.appConfig);
    return new Promise((resolve) => {
      runWsServer(httpRedirectApp, this.app, this.credentials, this.appConfig, resolve, wsPort, wssPort);
    });
  }
}
