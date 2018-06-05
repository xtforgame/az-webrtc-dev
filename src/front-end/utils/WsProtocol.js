import { WsProtocol as Base } from 'ricio/front-end';
import pathToRegexp from 'path-to-regexp';

export default class WsProtocol extends Base {
  constructor(...args){
    super(...args);
    this.channelEvents = new this.EventEmitter();
    this.events.addListener('send', this.channelMessageHandler);

    // this.channelEvents.addListener('all', e => {
    //   console.log('all :', e);
    // });
    this.channelEvents.addListener('user-joined', e => {
      console.log('user-joined :', e);
    });
    this.channelEvents.addListener('user-left', e => {
      console.log('user-left :', e);
    });
    this.channelEvents.addListener('message', e => {
      console.log('message :', e);
    });
  }

  channelMessageHandler = (event) => {
    const { wsMsg, data } = event;
    const pattern = pathToRegexp('/chs/:channelId?/:subType?');
    const testResult = pattern.exec(wsMsg.path);

    if(!testResult) { return; }
    this.channelEvents.emit('all', {
      event,
    });

    const channelId = testResult[1];
    const subType = testResult[2];
    if(!channelId) { return; }

    switch(subType){
    case 'msgs':
      {
        this.channelEvents.emit('message', {
          event,
          channel: channelId,
          sender: data.sender,
        });
        break;
      }
    case 'user-joined':
      {
        this.channelEvents.emit('user-joined', {
          event,
          channel: channelId,
          sender: data.sender,
        });
        break;
      }
    case 'user-left':
      {
        this.channelEvents.emit('user-left', {
          event,
          channel: channelId,
          sender: data.sender,
        });
        break;
      }
    }
  }

  login(token_type, token){
    let request = {
      method: 'POST',
      path: '/sessions',
      body: {
        token: token,
        token_type: token_type,
      },
    };
    return this.open()
    .then(() => this.request(request));
  }

  loginWithPassword(username, password){
    let request = {
      method: 'POST',
      path: '/sessions',
      body: {
        auth_type: 'basic',
        username,
        password,
      },
    };
    return this.open()
    .then(() => this.request(request))
    // .then(res => {
    //   console.log('res :', res);
    // })
    // .catch(e => {
    //   console.log('e :', e);
    // });
  }

  logout(){
    let request = {
      //path: '/debug/unexpectedLogout',
      path: '/logout',
    };
    // let cb = (...args) => {
    //   console.log('...args :', ...args);
    //   this.wsPeer.unlistenNative('close', cb);
    // }
    // this.wsPeer.listenNative('close', cb);
  
    return this.open()
    .then(() => this.send(request));
  }

  joinChannels(channels = []){
    let request = {
      method: 'POST',
      path: '/joined-channels',
      body: channels,
    };
    return this.open()
    .then(() => this.request(request));
  }

  leaveChannels(channels = []){
    let request = {
      method: 'DELETE',
      path: '/joined-channels',
      body: channels,
    };
    return this.open()
    .then(() => this.request(request));
  }

  sendChannelMessage(channel, { onlyToTargetUser } = {}){
    let request = {
      path: `/chs/${channel}/msgs`,
      body: {
        to: onlyToTargetUser,
      },
    };
    return this.open()
    .then(() => this.send(request));
  }
}
