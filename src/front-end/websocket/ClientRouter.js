/* eslint-disable no-param-reassign */
import WsKoaStyleApp from 'ricio/node/WsApp';
import GenericRouter from 'common/core/GenericRouter';
import MainRouter from './routers/MainRouter';

import wsProtocol from '~/websocket/wsProtocol1';

export default class ClientRouter {
  constructor(store) {
    this.store = store;
    this.app = new WsKoaStyleApp();
    this.router = new GenericRouter();
    this.app.use((ctx, next) => next().catch((e) => {
      console.error(`Error on (${ctx.path}) :`, e);
      ctx.rcResponse.throw(500);
    }));
    this.app
    .use(this.router.routes());

    this.routers = [
      MainRouter,
    ]
    .map(Router => new Router({
      store,
    })
    .setupRoutes({
      router: this.router,
    }));
  }

  callback() {
    return this.app.callback();
  }
}


export const setUpClientRouter = (store) => {
  const clientRouter = new ClientRouter(store);
  const cb = clientRouter.callback();
  const onSend = ({ rawData, wsMsg, data }) => {
    wsMsg.local.rawData = rawData;
    wsMsg.local.data = data;
    cb(wsMsg);
  };
  wsProtocol.events.on('send', onSend);
};
