import Azldi from 'azldi';
import { httpPort, httpsPort } from './core/config';
// ============================================
import EnvCfg from './services/env-cfg';
import UserManager from './services/user-manager';
import HttpApp from './services/http-app';
import RouterManager from './services/router-manager';
import WsApp from './services/ws-app';
import WsRouterManager from './services/ws-router-manager';
import {
  runningMode,
} from './common/core/config';

const ioc = new Azldi();
ioc.register([
  EnvCfg,
  UserManager,
  HttpApp,
  RouterManager,
  WsApp,
  WsRouterManager,
]);

ioc.digest();

ioc.runAsync('start')
  .then(() => {
    console.log(`======= Running in the ${runningMode} mode =======`);
    console.log(`Express listening on http port ${httpPort}`);
    console.log(`Express listening on https port ${httpsPort}`);
  })
  .catch((error) => {
    console.log(error);
  });
