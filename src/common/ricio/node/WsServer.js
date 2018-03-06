import ws from 'ws';
import { AzWsMessage } from '../ws';
import RicioPeer from '../RicioPeer';
import WsProtocolApi from '../ws/server/api';

function createContext(server, ws, rcPeer, { peerInfo: _peerInfo = {}, rawData, ...options }) {
  const peerInfo = {
    ..._peerInfo,
    server,
    ws,
    userData: { rcPeer },
  };

  const msg = new AzWsMessage({
    path: rawData ? undefined : '/',
    rawData,
    ...options,
    peerInfo,
  });

  msg.rcPeer = rcPeer;
  msg.rcResponse = msg.rcPeer.response || msg.genResponse({
    send: (data, options = {}) => {
      return new Promise((resolve, reject) => {
        const cb = (error) => {
          if (error) {
            reject(error);
          }
          resolve(null);
        };
        ws.send(data, options, cb);
      });
    },
  });
  return msg;
}

export default class WsServer {
  constructor(callback, options = {}, ...args){
    this.callback = callback;
    this.server = new ws.Server(...args);
    this.bind(options);
  }

  on(...args){
    return this.server.on(...args);
  }

  bind({ userSessionManager, PeerClass = RicioPeer }, onError = ((ctx) => {}), onNoMatch = ((ctx) => {})) {
    this.on('connection', (wsObj) => {
      const rcPeer = new PeerClass(userSessionManager, {
        protocol: {
          type: 'ws',
          api: new WsProtocolApi(wsObj, userSessionManager.allPeers),
        },
      });
  
      wsObj.on('open', () => {
        const ctx = createContext(this, wsObj, rcPeer, {
          method: 'OPEN',
        });
        this.callback(ctx);
      });
  
      wsObj.on('message', (data, flag) => {
        let ctx = createContext(this, wsObj, rcPeer, {
          method: 'MESSAGE',
          peerInfo: { data, flag },
        });
        // this.callback(ctx);
  
        ctx = createContext(this, wsObj, rcPeer, {
          rawData: data,
          peerInfo: { data, flag },
        });
  
        this.callback(ctx);
      });
  
      wsObj.on('close', (code, reason) => {
        const ctx = createContext(this, wsObj, rcPeer, {
          method: 'CLOSE',
          peerInfo: { code, reason },
        });
        this.callback(ctx);
      });
  
      wsObj.on('error', (error) => {
        const ctx = createContext(this, wsObj, rcPeer, {
          method: 'ERROR',
          peerInfo: { error },
        });
        this.callback(ctx);
      });
  
      const ctx = createContext(this, wsObj, rcPeer, {
        method: 'CONNECT',
      });
      this.callback(ctx);
    });
  }
}
