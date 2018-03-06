import { AzWsMessage } from '../ws';

export default class ApiBase {
  constructor(wsPeer, wsPeerManager) {
    this.wsPeer = wsPeer;
    this.wsPeerManager = wsPeerManager;
  }

  open(url) {
    return Promise.reject('Not implemented');
  }

  close(code, reason) {
    return Promise.reject('Not implemented');
  }

  send(msgConfig) {
    const config = Object.assign({}, msgConfig, { method: 'SEND' });
    const msg = new AzWsMessage(config);
    return Promise.resolve(this.wsPeer.send(msg.build()));
  }
}
