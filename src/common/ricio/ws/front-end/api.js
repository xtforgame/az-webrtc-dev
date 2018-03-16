import ApiBase from '../api-base';
import { AzWsMessage } from '../../ws';
import makeCancelable from '../../utils/makeCancelable';

export class WebsocketApi {
  constructor(url = '', EventEmitter) {
    this.url = url;
    this.EventEmitter = EventEmitter;
    this.socket = null;
    this.state = 'closed';
    this.nativeEvents = new EventEmitter();
    this.binaryType = 'arraybuffer';
    this.openAsyncInfo = { promise: null };
  }

  close(code, reason) {
    if(this.socket){
      this.openAsyncInfo = { promise: null };
      try {
        this.socket.close(code, reason);
      } catch (error) {
        return Promise.reject(error);
      }
      this.state = 'closed';
      this.socket = null;
    }
    return Promise.resolve();
  }

  open(url) {
    if ((!url || this.url === url) && this.state !== 'closed') {
      return this.openAsyncInfo.promise;
    }
    this.close();
    this.state = 'connecting';
    this.url = url || this.url;
    try {
      this.socket = new WebSocket(this.url);
    } catch (error) {
      this.state = 'closed';
      return Promise.reject(error);
    }
    this.socket.binaryType = this.binaryType;
    this.socket.onopen = (evt) => {
      this.state = 'connected';
      this.nativeEvents.emit('open', evt, this);
      if (!this.openAsyncInfo.isFulfilled) {
        this.openAsyncInfo.isFulfilled = true;
        const { resolve } = this.openAsyncInfo;
        resolve({ ws: this, evt });
      }
    };
    this.socket.onclose = (evt) => {
      this.state = 'closed';
      this.nativeEvents.emit('close', evt, this);
    };
    this.socket.onmessage = (evt) => {
      // let msg = new AzWsMessage(evt.data);
      if (evt.data instanceof ArrayBuffer) {
        this.nativeEvents.emit('message', evt, this);
      } else {
        // console.log('evt.data :', evt.data);
        this.nativeEvents.emit('message', evt, this);
      }
    };
    this.socket.onerror = (evt) => {
      this.state = 'closed';
      this.nativeEvents.emit('error', evt, this);
      if (!this.openAsyncInfo.isFulfilled) {
        this.openAsyncInfo.isFulfilled = true;
        const { reject } = this.openAsyncInfo;
        reject({ ws: this, evt });
      }
    };

    this.openAsyncInfo.promise = new Promise((resolve, reject) => {
      Object.assign(this.openAsyncInfo, { resolve, reject, isFulfilled: false });
    });
    return this.openAsyncInfo.promise;
  }

  send(msg) {
    if(!this.socket){
      return Promise.reject(new Error('No Connection'));
    }
    this.socket.send(msg);
    return Promise.resolve();
  }

  listenNative(events, cb) {
    if (typeof events === 'string') {
      return this.nativeEvents.addListener(events, cb);
    }
    return Object.keys(events).map(event => this.nativeEvents.addListener(event, events[event]));
  }

  unlistenNative(events, cb) {
    if (typeof events === 'string') {
      return this.nativeEvents.removeListener(events, cb);
    }
    return Object.keys(events).map(event => this.nativeEvents.removeListener(event, events[event]));
  }
}

export default class WsProtocolApi extends ApiBase {
  constructor(url = '', EventEmitter, options = {}) {
    let wsPeer = new WebsocketApi(url, EventEmitter);
    super(wsPeer, {});
    this.EventEmitter = EventEmitter;
    this.options = Object.assign({
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionAttempts: 12,
    }, options);
    this.lastReconnect = null;
    this.events = new EventEmitter();
    this.waitResPromises = {};
    this.wsMsgCounter = new Date().getTime();
    this.wsPeer.listenNative({
      message: this.wsOnMessage,
      error: () => {},
      close: () => {},
    });
  }

  get nativeEvents(){
    return this.wsPeer.nativeEvents;
  }

  stopReconnect(){
    if(this.lastReconnect){
      if(this.lastReconnect.reject){
        this.lastReconnect.reject();
      }
      this.lastReconnect = null;
    }
  }

  reconnect(url){
    if(this.lastReconnect && this.lastReconnect.promise){
      return this.lastReconnect.promise;
    }

    this.lastReconnect = this.lastReconnect || {
      time: new Date().getTime(),
      count: 0,
      reject: null,
    };

    this.lastReconnect.time = new Date().getTime();
    this.lastReconnect.count++;
    this.lastReconnect.reject = null;

    // console.log('this.lastReconnect.time :', this.lastReconnect.time);

    return this.lastReconnect.promise = (this.lastReconnect.promise || Promise.resolve())
    .then(() => {
      return this._open(url);
    })
    .then(() => {
      this.lastReconnect = null;
    })
    .catch(() => {
      return new Promise((resolve, _reject) => {
        if(!this.lastReconnect){
          const message = 'Reconnection interrupted';
          this.events.emit('disconnect', {
            reason: message,
            message,
          });
          return _reject();
        }

        if(this.lastReconnect.count > this.options.reconnectionAttempts){
          const message = 'Reconnection limit exceeded';
          this.events.emit('disconnect', {
            reason: message,
            message,
          });
          return _reject();
        }

        let timeout = null;
        let reject = () => {
          clearTimeout(timeout);
          _reject();
        }
        timeout = setTimeout(resolve, this.options.reconnectionDelay);
        this.lastReconnect.reject = reject;
      })
      .then(() => {
        this.lastReconnect && (this.lastReconnect.promise = null);
        return this.reconnect(url);
      });
    });
  }

  open(url) {
    return this.reconnect(url);
  }

  _open(url) {
    return this.wsPeer.open(url).then(() => this);
  }

  close() {
    const message = 'Normal';
    const evt = {
      reason: message,
      message,
    };
    return this.wsPeer.close()
    .then(() => {
      this.events.emit('disconnect', evt);
    })
    .catch((e) => {
      this.events.emit('disconnect', evt);
      throw e;
    });
  }

  request(msgConfig, options) {
    return this.sendAndWaitResponse(msgConfig, options);
  }

  sendAndWaitResponse(msgConfig, {timeout = 30000, cancelToken} = {}) {
    const msgId = ++this.wsMsgCounter;
    const config = Object.assign({}, msgConfig, { msgId });
    const msg = new AzWsMessage(config);
    // console.log('msg.build() :', msg.build());
    const cancelable = makeCancelable(new Promise((resolve, reject) => {
      this.waitResPromises[msgId] = { resolve, reject };
      this.wsPeer.send(msg.build());
    }), cancelToken);

    setTimeout(() => {
      cancelable.cancel(`Request Timeout after ${timeout}ms`);
    }, timeout);

    return cancelable.promise;
  }

  wsOnMessage = ({ data: rawData }, ws) => {
    const wsMsg = new AzWsMessage({ rawData });
    wsMsg.body.json().then((data) => {
      const evt = { rawData, wsMsg, data };
      this.events.emit('message', evt);
      if (wsMsg.method === 'RESPONSE' && (wsMsg.msgId in this.waitResPromises)) {
        this.events.emit('response', evt);
        if(!evt.wsMsg.status || evt.wsMsg.status < 200 || evt.wsMsg.status >= 400){
          let error = {
            response: evt,
          };
          this.waitResPromises[wsMsg.msgId].reject(error);
        }else{
          this.waitResPromises[wsMsg.msgId].resolve(evt);
        }
        delete this.waitResPromises[wsMsg.msgId];
      } else {
        this.events.emit('send', evt);
      }
    });
  };
}
