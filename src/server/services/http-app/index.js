import ServiceBase from '../ServiceBase';
import { httpPort, httpsPort } from '../../core/config';
import Koa from 'koa';
import koaStatic from 'koa-static';
import createRouterClass from 'generic-router';
import bodyParser from 'koa-bodyparser';
import { runServer } from './http-server';
import { RestfulError } from 'az-restful-helpers';
import getWebpackService from './webpack-service';
import http from 'http';
import path from 'path';
import appRootPath from 'app-root-path';
import { createKoaMiddleware } from 'ricio/node'

const appRoot = appRootPath.resolve('./');

let methods = http.METHODS.map(function lowerCaseMethod (method) {
  return method.toLowerCase();
});

export default class HttpApp extends ServiceBase {
  static $name = 'httpApp';
  static $type = 'service';
  static $inject = ['envCfg', 'userManager'];

  constructor(envCfg, userManager){
    super();
    this.app = new Koa();
    // prevent any error to be sent to user
    this.app.use((ctx, next) => {
      return next().catch((err) => {
        if(err instanceof RestfulError){
          return err.koaThrow(ctx);
        }
        // console.log('err.restfulError :', err.restfulError);
        if(!err.status){
          console.error(err);
          console.error(err.stack);
          ctx.throw(500);
        }
        throw err;
      });
    });
    this.app.use(bodyParser());
    /*let credentials = */this.credentials = envCfg.credentials;

    this.app.use(createKoaMiddleware(userManager));
    // ========================================
    if (process.env.NODE_ENV === 'development') {
      const { middlewares } = getWebpackService();
      middlewares.map(middleware => this.app.use(middleware));
    } else {
      this.app.use(koaStatic(path.join(appRoot, 'dist', 'front-end')));
    }
    // ========================================

    let KoaRouter = createRouterClass({
      methods,
    });
    this.router = new KoaRouter();
    this.app
    .use(this.router.routes())
    .use(this.router.allowedMethods());

    this.appConfig = {
      router: this.router/*, app: this.app, azLrApp, credentials*/
    };
  }

  onStart(){
    this.app.use(koaStatic(path.join(appRoot, 'public')));
    //======================================================
    return new Promise(resolve => {
      runServer(this.app, this.credentials, resolve, httpPort, httpsPort);
    });
  }
}

