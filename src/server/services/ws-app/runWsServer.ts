import http from 'http';
import https from 'https';
import { WsServer } from 'ricio/node';

import {
  PeerClass,
  WsPeer,
  WsPeerManager,
} from '~/websocket/index';

export default (httpApp, app, credentials, appConfig, cb, httpPort = 3310, httpsPort = 3320) => {
  const httpServer = http.createServer(httpApp.callback());
  const httpsServer = https.createServer(credentials, httpApp.callback());
  httpServer.listen(httpPort, () => {
    httpsServer.listen(httpsPort, () => {
      const wsServer = new WsServer<
        WsPeer,
        WsPeerManager<WsPeer>,
        PeerClass<
          WsPeer,
          WsPeerManager<WsPeer>
        >
      >(app.callback(), appConfig, { server: httpServer });
      const wssServer = new WsServer<
        WsPeer,
        WsPeerManager<WsPeer>,
        PeerClass<
          WsPeer,
          WsPeerManager<WsPeer>
        >
      >(app.callback(), appConfig, { server: httpsServer });
      if (cb) {
        cb(wsServer, wssServer);
      }
    });
  });
};
