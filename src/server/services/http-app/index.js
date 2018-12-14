/* eslint-disable no-console, import/no-extraneous-dependencies */
import { httpPort, httpsPort } from 'config';
import Koa from 'koa';
import koaStatic from 'koa-static';
import createRouterClass from 'generic-router';
import bodyParser from 'koa-bodyparser';
import { RestfulError } from 'az-restful-helpers';
import http from 'http';
import path from 'path';
import appRootPath from 'app-root-path';
import { createKoaMiddleware } from 'ricio/node';
import getWebpackService from './webpack-service';
import runServer from './runServer';
import ServiceBase from '../ServiceBase';

const appRoot = appRootPath.resolve('./');
const methods = http.METHODS.map(method => method.toLowerCase());

export default class HttpApp extends ServiceBase {
  static $name = 'httpApp';

  static $type = 'service';

  static $inject = ['envCfg', 'userManager'];

  static $funcDeps = {
    start: ['mailer'],
  };

  constructor(envCfg, userManager) {
    super();
    this.app = new Koa();
    this.app.proxy = !!process.env.KOA_PROXY_ENABLED;
    // prevent any error to be sent to user
    this.app.use((ctx, next) => next().catch((err) => {
      if (err instanceof RestfulError) {
        return err.koaThrow(ctx);
      }
      // console.log('err.restfulError :', err.restfulError);
      if (!err.status) {
        console.error(err);
        console.error(err.stack);
        ctx.throw(500);
      }
      throw err;
    }));
    this.app.use(bodyParser({
      formLimit: '10mb',
      jsonLimit: '10mb',
      textLimit: '10mb',
    }));
    /* let credentials = */this.credentials = envCfg.credentials;

    this.app.use(createKoaMiddleware(userManager));

    const KoaRouter = createRouterClass({
      methods,
    });
    this.router = new KoaRouter();
    this.app
    .use(this.router.routes())
    .use(this.router.allowedMethods());

    this.appConfig = {
      router: this.router, /* , app: this.app, azLrApp, credentials */
    };
  }

  onStart() {
    // ======================================================
    let p = Promise.resolve();
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      const { middlewarePromise, compileDonePromise } = getWebpackService();
      p = middlewarePromise
      .then((middleware) => {
        this.app.use(middleware);
        this.closeWebpack = () => Promise.resolve()
        .then(() => new Promise((resolve, reject) => {
          middleware.close(resolve);
        }));
      });
      if (process.env.NODE_ENV === 'test') {
        p = p.then(() => compileDonePromise);
      }
    } else {
      this.closeWebpack = Promise.resolve();
      this.app.use(koaStatic(path.join(appRoot, 'dist', 'front-end')));
    }
    // ========================================
    return p.then(() => new Promise((resolve) => {
      const cb = (httpServer, httpsServer) => resolve({ httpServer, httpsServer });
      runServer(this.app, this.credentials, cb, httpPort, httpsPort);
    }))
    .then(({ httpServer, httpsServer }) => {
      this.httpServer = httpServer;
      this.httpsServer = httpsServer;
    });
  }

  onDestroy() {
    let p = Promise.resolve();
    if (this.httpServer) {
      p = p.then(() => new Promise(resolve => this.httpServer.shutdown(() => {
        this.httpServer = null;
        resolve();
      })));
    }
    if (this.httpsServer) {
      p = p.then(() => new Promise(resolve => this.httpsServer.shutdown(() => {
        this.httpsServer = null;
        resolve();
      })));
    }
    p = p.then(this.closeWebpack || (() => {}));
    return p.then(() => {
      console.log('Everything is cleanly shutdown.');
    });
  }
}
