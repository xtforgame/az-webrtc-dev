import http from 'http';
import https from 'https';
import { WsServer } from 'ricio/node';

export default (httpApp, app, credentials, appConfig, cb, httpPort = 3310, httpsPort = 3320) => {
  const httpServer = http.createServer(httpApp.callback());
  const httpsServer = https.createServer(credentials, httpApp.callback());
  httpServer.listen(httpPort, () => {
    httpsServer.listen(httpsPort, () => {
      const wsServer = new WsServer(app.callback(), appConfig, { server: httpServer });
      const wssServer = new WsServer(app.callback(), appConfig, { server: httpsServer });
      if (cb) {
        cb(wsServer, wssServer);
      }
    });
  });
};
