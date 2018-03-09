import {
  genUuid,
  errorHandler,
  getPeerConnectionConfig,
  getConstraints,
} from './utils';

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStreamTrack,
  getUserMedia,
} from './index';

export let DisconnectType = {
  Close: 'Close',
  ResetByPeer: 'ResetByPeer',
};

class PeerConnection
{
  constructor(id, localStream, callbacks = {}){
    this.id = id;
    this.nativePc = new RTCPeerConnection(getPeerConnectionConfig());
    for (let cbName in callbacks) {
      let cb = callbacks[cbName];
      this.nativePc[cbName] = cb;
    }
    if(localStream){
      this.nativePc.addStream(localStream);
    }
  }
}

class PeerConnectionManager
{
  constructor(){
    this.pcs = {};
  }

  createPc(id, localStream, callbacks = {}){
    return this.pcs[id] = new PeerConnection(id, localStream, callbacks);
  }

  removePc(id){
    let pc = this.getPc(id);
    pc && pc.nativePc.close();
    delete this.pcs[id];
  }

  getPc(id){
    return this.pcs[id];
  }

  updateLocalStream(originalStream, newStream){
    if(originalStream){
      for (let id in this.pcs) {
        let pc = this.pcs[id].nativePc;
        pc && pc.removeStream(originalStream);
      }
    }

    for (let id in this.pcs) {
      let pc = this.pcs[id].nativePc;
      pc && pc.addStream(newStream);
    }
  }
}

export default class WebRtcManager {
  constructor(wsProrocol){
    this.uid = genUuid();
    this.username = '<noname>';
    this.wsProrocol = wsProrocol;
    this.pcMgr = new PeerConnectionManager();
    this.localStream = null;
    this.onStateChanged = null;
    this.onGotLocalStream = null;
    this.onGotRemoteStream = null;
    this.onCallStarted = null;
    this.onCallEnd = null;
    this.onReceivedCall = null;
    this.onResponse = null;
    this.onCancel = null;

    this.state = {
      state: 'idle',
      cbs: null,
    };
  }

  get currentCall(){
    return this.state;
  }

  setState(state){
    let origin = this.state;
    this.state = {
      ...this.state,
      ...state,
    };
    this.onStateChanged(origin, state);
  }

  init(username, {
    onStateChanged,
    onGotLocalStream,
    onGotRemoteStream,
    onCallStarted,
    onCallEnd,
    onReceivedCall,
    onResponse,
    onCancel,
  }){
    this.username = username || this.username;
    this.onStateChanged = onStateChanged || ((prevState, nextState) => {});
    this.onGotLocalStream = onGotLocalStream || ((stream) => {});
    this.onGotRemoteStream = onGotRemoteStream || ((pc, stream) => {});
    this.onCallStarted = onCallStarted || ((callId) => {});
    this.onCallEnd = onCallEnd || ((chatId) => {});
    this.onReceivedCall = onReceivedCall || (() => true);
    this.onResponse = onResponse || ((chatId, response) => {});
    this.onCancel = onCancel || ((chatId) => {});
    this.wsProrocol.events.addListener('message', data => { 
      // console.log('message', data); 
    });

    this.wsProrocol.events.addListener('send', data => { 
      // console.log('send', data);
      return this.handleDataFromServer(data);
    });
    return this.login()
    .then(() => {
      return this.getLocalStream().then(stream => {
        this.onGotLocalStream(stream);
      }).catch(errorHandler);
    });
  }

  sendDescription = pcId => description => {
    console.log('got description');

    let peerConnection = this.pcMgr.getPc(pcId);
    peerConnection.nativePc.setLocalDescription(description)
    .then(() => {
      this.wsProrocol.open()
      .then(() => {
        return this.wsProrocol.send({
          path: '/sdp',
          body: JSON.stringify({
            sdp: peerConnection.nativePc.localDescription,
            userId: this.uid,
            callId: this.currentCall.uid,
          })
        });
      })
    })
    .catch(errorHandler);
  };

  start(isCaller, chatId) {
    let peerConnection = this.pcMgr.createPc(chatId, this.localStream, {
      onicecandidate: (event) => {
        if(event.candidate != null) {
          this.wsProrocol.open()
          .then(() => {
            return this.wsProrocol.send({
              path: '/ice',
              body: JSON.stringify({
                ice: event.candidate,
                userId: this.uid,
                callId: this.currentCall.uid,
              })
            });
          })
        }
      },
      oniceconnectionstatechange: () => {
        if(peerConnection.nativePc.iceConnectionState === 'disconnected') {
          this._onCallEnd(chatId, DisconnectType.ResetByPeer)
        }
      },
      onaddstream: (event) => {
        console.log('got remote stream');
        this.onGotRemoteStream(peerConnection, event.stream);
        this.onCallStarted(this.currentCall.uid);
      }
    });
    return this.getLocalStream()
    .then(stream => {
      if(isCaller) {
        return peerConnection.nativePc.createOffer().then(this.sendDescription(chatId)).catch(errorHandler);
      }
      return Promise.resolve();
    })
    .catch(errorHandler);
  }

  call(to){
    return this.wsProrocol.request({
      path: '/calls',
      method: 'POST',
      body: JSON.stringify({
        to,
      })
    })
    .then(({data}) => {
      this.setState({
        state: 'calling',
        uid: data.call.uid,
        cbs: {
          onAccepted: result => {
            this.onResponse(data.call.uid, result);
            this.start(true, data.call.uid);
          },
          onDeclined: result => {
            this.onResponse(data.call.uid, result);
            this.setState({
              state: 'idle',
              uid: null,
              cbs: null,
            });
          },
          onError: e => {
          },
        },
      });
      return data.call.uid;
    });
  }

  handleDataFromServer = message => {
    let signal = message.data;
    if(signal.session) return;

    let callId = signal.callId;

    if(signal.call){
      if(signal.call.caller !== this.uid){
        if(signal.call.response === 'cancel'){
          return this._onCancel(callId);
        }
        Promise.resolve(this.onReceivedCall(callId))
        .then(accept => {
          console.log('accept :', accept);
          let response = 'decline';
          if(accept){
            this.setState({
              state: 'accepted',
              uid: callId,
              cbs: null,
            });
            response = 'accept';
          }
          return this.wsProrocol.request({
            path: `/calls/${callId}`,
            method: 'PATCH',
            body: JSON.stringify({
              response,
              uid: this.uid,
            })
          });
        });
      }else{
        if(signal.call.response){
          let cb = null;
          let uid = null;
          let state = 'idle';
          console.log('signal.call.response :', signal.call.response);
          if(signal.call.response === 'accept'){
            cb = this.currentCall && this.currentCall.cbs.onAccepted;
            state = 'accepted';
            uid = this.currentCall.uid;
          }else{
            cb = this.currentCall && this.currentCall.cbs.onDeclined;
          }
          cb && cb(signal.call.response);
          this.setState({
            state,
            uid,
            cbs: null,
          });
        }
      }

      return ;
    }

    let peerConnection = this.pcMgr.getPc(callId);
    if(!peerConnection) this.start(false, callId);
    peerConnection = this.pcMgr.getPc(callId);

    // Ignore messages from ourself
    if(signal.userId == this.uid) return;

    if(signal.sdp) {
      peerConnection.nativePc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
        // Only create answers in response to offers
        if(signal.sdp.type === 'offer') {
          peerConnection.nativePc.createAnswer().then(this.sendDescription(callId)).catch(errorHandler);
        }
      })
      .catch(errorHandler);
    } else if(signal.ice) {
      peerConnection.nativePc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
  }

  login(){
    if(this.loggedIn){
      return Promise.resolve();
    }
    return this.wsProrocol.open()
    .then(() => {
      return this.wsProrocol.request({
        path: '/sessions',
        method: 'POST',
        body: JSON.stringify({
          token: this.uid,
          name: this.username,
        })
      });
    })
    .then(res => {
      this.loggedIn = true;
      console.log('res :', res);
    });
  }

  getUserList(){
    return this.login()
    .then(() => {
      return this.wsProrocol.request({
        path: '/users',
        method: 'GET',
      });
    })
    .then(users => {
      return users.data.filter(user => user.uid != this.uid);
    })
    .catch(e => []);
  }

  getLocalStream(isFront = true){
    if(this.localStream){
      return Promise.resolve(this.localStream);
    }
    return this.getUserMedia(isFront);
  }

  getUserMedia(isFront = true){
    let videoSourceId;
    if(navigator.product === 'ReactNative'){
      let {Platform} = require('react-native');
      // on android, you don't have to specify sourceId manually, just use facingMode
      // uncomment it if you want to specify
      if (Platform.OS === 'ios') {
        MediaStreamTrack.getSources(sourceInfos => {
          console.log("sourceInfos: ", sourceInfos);

          for (let i = 0; i < sourceInfos.length; i++) {
            const sourceInfo = sourceInfos[i];
            if(sourceInfo.kind == "video" && sourceInfo.facing == (isFront ? "front" : "back")) {
              videoSourceId = sourceInfo.id;
            }
          }
        });
      }
    }
    return getUserMedia(getConstraints(isFront, videoSourceId))
    .then(stream => {
      console.log('getUserMedia success', stream);

      this.pcMgr.updateLocalStream(this.localStream, stream);
      if(this.localStream){
        this.localStream.release();
      }

      this.localStream = stream;
      return stream;
    });
  }

  _onCallEnd(chatId, disconnectType){
    let pc = this.pcMgr.getPc(chatId);
    this.pcMgr.removePc(chatId);
    this.onCallEnd(chatId, disconnectType);
    this.setState({
      state: 'idle',
      uid: null,
      cbs: null,
    });
  }

  _onCancel(callId){
    this.setState({
      state: 'idle',
      uid: null,
      cbs: null,
    });
    return Promise.resolve()
    .then(() => {
      return this.onCancel(callId);
    });
  }

  cancel(callId){
    return this.wsProrocol.request({
      path: `/calls/${callId}`,
      method: 'PATCH',
      body: JSON.stringify({
        response: 'cancel',
        uid: this.uid,
      })
    })
    .then(({errorMsg}) => {
      if(errorMsg){
        return Promise.reject(errorMsg);
      }
      return this._onCancel(callId);
    });
  }

  close(chatId){
    return Promise.resolve(this._onCallEnd(chatId, DisconnectType.Close));
  }
}
