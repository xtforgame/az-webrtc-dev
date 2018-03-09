export default class WebsocketApi {
  constructor(url = '', EventEmitter) {
    this.url = url;
    this.socket = null;
    this.connect_state = 0;
    this.nativeEvents = new EventEmitter();
    this.binaryType = 'arraybuffer';
    this.openAsyncInfo = { promise: null };
  }

  open(url) {
    if ((!url || this.url === url) && this.connect_state !== 0) {
      return this.openAsyncInfo.promise;
    }
    this.connect_state = 1;
    console.log('this.connect_state :', this.connect_state);
    this.url = url || this.url;
    this.socket = new WebSocket(this.url);
    this.socket.binaryType = this.binaryType;
    this.socket.onopen = (evt) => {
      this.connect_state = 2;
      this.nativeEvents.emit('open', evt, this);
      if (!this.openAsyncInfo.isFulfilled) {
        this.openAsyncInfo.isFulfilled = true;
        const { resolve } = this.openAsyncInfo;
        resolve({ ws: this, evt });
      }
    };
    this.socket.onclose = (evt) => {
      this.connect_state = 0;
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
      this.connect_state = 0;
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
    this.socket.send(msg);
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

// window.location.host
// window.location.hostname
// window.location.port
