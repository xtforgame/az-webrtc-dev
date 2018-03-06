import ApiBase from '../api-base';

class WsProtocolApi extends ApiBase {
  open() {
    return Promise.resolve(this);
  }

  close(code, reason) {
    if(this.wsPeer) {
      this.wsPeer.close(code, reason);
    }
  }
}

export default WsProtocolApi;
