/* eslint-disable no-console */
import Azldi from 'azldi';
import { httpPort, httpsPort } from 'config';
// ============================================
import EnvCfg from '~/services/env-cfg';
import UserManager from '~/services/user-manager';
import HttpApp from '~/services/http-app';
import RouterManager from '~/services/router-manager';
import Mailer from '~/services/mailer';
import WsApp from '~/services/ws-app';
import WsRouterManager from '~/services/ws-router-manager';
import {
  runningMode,
} from 'common/core/config';

class Server {
  constructor() {
    this.ioc = new Azldi();
    this.ioc.register([
      EnvCfg,
      UserManager,
      HttpApp,
      RouterManager,
      Mailer,
      WsApp,
      WsRouterManager,
    ]);

    this.ioc.digest();
  }

  start() {
    return this.ioc.runAsync('start');
  }

  destroy() {
    return this.ioc.runAsync('destroy')
      .then((_) => {
        this.ioc = null;
        return _;
      })
      .catch((error) => {
        this.ioc = null;
        return Promise.reject(error);
      });
  }
}

export default Server;
// =============================

const envName = process.env.NODE_ENV ? process.env.NODE_ENV : 'production';

if (envName !== 'test') {
  // start automatically
  const server = new Server();
  server.start()
    .then(() => {
      console.log(`======= Running in the ${runningMode} mode =======`);
      console.log(`Express listening on http port ${httpPort}`);
      console.log(`Express listening on https port ${httpsPort}`);
    })
    .catch((error) => {
      console.log(error);
    });
}
