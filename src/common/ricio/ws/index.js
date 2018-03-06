const isNode = new Function('try {return this===global;}catch(e){return false;}');
const isBrowser = new Function('try {return this===window;}catch(e){ return false;}');

let BinaryType = ArrayBuffer;
let BufferType = Uint8Array;

let toBuffer = function (rawData) {
  if (rawData instanceof BinaryType) {
    return new BufferType(rawData);
  }
  return rawData;
};

const bufferIndexOf = function (buffer, str, start = 0) {
  if (str.length === 0) {
    return start;
  }
  for (let i = start; i < buffer.length - str.length; i++) {
    if (buffer[i] != str.charCodeAt(0)) {
      continue;
    }
    let match = true;
    for (let j = 1; j < str.length; j++) {
      if (buffer[i + j] != str.charCodeAt(j)) {
        match = false;
        break;
      }
    }
    if (match) {
      return i;
    }
  }

  return -1;
};

export function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

export function str2ab(str) {
  const buf = new ArrayBuffer(str.length); // 2 bytes for each char
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

let bufferToString = ab2str;

if (isNode()) {
  BinaryType = Buffer;
  BufferType = Buffer;

  toBuffer = function (rawData) {
    return rawData;
  };

  bufferToString = function (buffer) {
    return buffer.toString();
  };
}

const parseMethodWithPath = function (data) {
  let pos = -1;

  if (typeof data === 'string') {
    pos = data.indexOf('\r\n');
    if (pos >= 0) {
      return [data.substr(0, pos).split(' '), pos + 2];
    }
  } else {
    pos = bufferIndexOf(data, '\r\n');
    if (pos >= 0) {
      return [bufferToString(data.slice(0, pos)).split(' '), pos + 2];
    }
  }
  return null;
};

const splitHeader = function (data, start) {
  let pos = -1;

  if (typeof data === 'string') {
    pos = data.indexOf('\r\n\r\n', start - 2);
    if (pos >= 0) {
      // if(pos == start - 2){
      //   return [[], pos + 4];
      // }
      return [data.substr(start, pos - start).split('\r\n'), pos + 4];
    }
  } else {
    pos = bufferIndexOf(data, '\r\n\r\n', start - 2);
    if (pos >= 0) {
      // if(pos == start - 2){
      //   return [[], pos + 4];
      // }
      return [bufferToString(data.slice(start, pos)).split('\r\n'), pos + 4];
    }
  }
  return null;
};

const parseHeaders = function (data, start) {
  const result = splitHeader(data, start);
  if (!result) {
    return null;
  }
  const retval = {};
  result[0].map((text) => {
    const pair = text.split(':');
    if (pair.length >= 2) {
      retval[pair[0].toLowerCase()] = pair[1].trim();
    }
  });
  return [retval, result[1]];
};

const parseBody = function (data, start) {
  const pos = -1;
  const result = null;

  if (typeof data === 'string') {
    return data.substr(start, data.length - start);
  }
  return data.slice(start, data.length);

  return result;
};

// console.log('isNode() :', isNode());


export class AzWsMsgBody {
  constructor(rawData = null) {
    this.rawData = rawData;
  }

  toString() {
    return this.rawData.toString();
  }

  getText() {
    if (typeof this.rawData === 'string') {
      return this.rawData;
    }
    return bufferToString(this.rawData);
  }

  text() {
    return Promise.resolve(this.getText());
  }

  getJson() {
    return JSON.parse(this.getText());
  }

  json() {
    return this.text()
      .then((text) => {
        // console.log('text :', text);
        try {
          const result = JSON.parse(text);
          return Promise.resolve(result);
        } catch (e) {
          console.log('text :', text);
          return Promise.reject(e);
        }
      });
  }
}

export class AzWsResponse {
  constructor(sendHandler, MsgClass, config) {
    this.sendHandler = sendHandler;
    this.msg = new MsgClass(config);
  }

  status(status) {
    if (typeof status !== 'string') {
      status = status.toString();
    }
    this.msg.status = status;
    return this;
  }

  lightMsg(lightMsg) {
    this.msg.lightMsg = lightMsg;
    return this;
  }

  body(body) {
    this.msg.body = body;
    return this;
  }

  build(body) {
    if (body !== undefined) {
      this.msg.body = body;
    }
    return this.msg.build();
  }

  send(body, cb) {
    cb = cb || ((err) => { err && console.log('Failed to send :', err); });
    return this.sendHandler.send(this.build(body), cb);
  }

  sendPromise(body) {
    return this.sendHandler.sendPromise(this.build(body));
  }
}

let msgIdCounter = 0;

export class AzWsMessage {
  constructor({
    rawData = null,
    method = 'SEND',
    path = '/',
    url = '/',
    status = null,
    lightMsg = null,
    msgId = null,
    headers = {},
    body = '',
    peerInfo = { ws: null, server: null },
    local = {},
  }) {
    this.protocol = 'ws';

    this.rawData = rawData;
    this.method = method;
    this.path = path || url;
    this.msgId = msgId;
    this.status = status;
    this.lightMsg = lightMsg;
    this.headers = headers;
    this.body = body;

    this.params = {};
    this.query = {};
    this.local = local;

    this.peerInfo = peerInfo;

    this.valid = true;

    if (rawData) {
      this.parseRawData(rawData);
    }
  }

  parseRawData(rawData) {
    this.rawData = toBuffer(rawData);
    this.method = null;
    this.path = null;
    this.msgId = null;
    this.status = null;
    this.lightMsg = null;
    this.headers = {};
    this.body = null;
    this.valid = true;

    let parseResult = parseMethodWithPath(this.rawData);
    if (!parseResult) {
      console.log('parseResult :', this.rawData);
      return;
    }

    this.method = parseResult[0][0];
    this.path = parseResult[0][1];
    this.msgId = parseResult[0][2] || null;
    this.status = parseResult[0][3] || null;
    this.lightMsg = parseResult[0][4] || null;
    const headerStart = parseResult[1];

    parseResult = parseHeaders(this.rawData, headerStart);
    if (!parseResult) {
      console.log('parseResult1 :', this.rawData);
      return;
    }

    this.headers = parseResult[0];
    const bodyStart = parseResult[1];

    this.body = new AzWsMsgBody(parseBody(this.rawData, bodyStart));
    this.valid = true;
  }

  build() {
    let result = `${this.method.toUpperCase()} ${this.path} ${this.msgId || ++msgIdCounter} ${this.status || ''} ${this.lightMsg || ''}\r\n`;
    Object.keys(this.headers).map((key) => {
      result += `${key}: ${this.headers[key]}\r\n`;
    });
    result += '\r\n';
    if (this.body) {
      if (typeof this.body === 'string') {
        result += this.body;
      } else {
        try {
          result += JSON.stringify(this.body);
        } catch (e) {
        }
      }
    }
    return result;
  }

  genResponse(sendHandler) {
    return new AzWsResponse(sendHandler, AzWsMessage, {
      status: '200',
      lightMsg: 'OK',
      method: 'RESPONSE',
      path: this.path,
      msgId: this.msgId,
    });
  }
}
