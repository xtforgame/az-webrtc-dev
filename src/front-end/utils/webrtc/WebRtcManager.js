/* eslint-disable no-underscore-dangle, no-console */
// https://www.webrtc-experiment.com/docs/how-to-switch-streams.html
import {
  filterCallProps,
  getConstraints,
  DisconnectType,
  stopStream,
} from './utils';

import {
  MediaStreamTrack,
  getUserMedia,
} from './index';

import RtcPeerManager from './RtcPeerManager';

class SessionHelper {
  constructor(wsProtocol, token) {
    this.wsProtocol = wsProtocol;
    this.token = token;
    this.state = {
      loggedIn: false,
      lastPromise: Promise.resolve(),
      lastPromiseType: 'logout',
    };
  }

  login(token) {
    this.token = token || this.token;

    const p = this.state.lastPromise;
    if (this.state.lastPromiseType === 'login') {
      return p;
    }
    this.state.lastPromise = 'login';
    this.state.lastPromise = p
    .then(() => this.wsProtocol.open())
    .then(() => this.wsProtocol.request({
      path: '/sessions',
      method: 'POST',
      body: JSON.stringify({
        auth_type: 'basic',
        token: this.token,
      }),
    }))
    .then(() => {
      this.loggedIn = true;
    })
    .catch((res) => {
      this.loggedIn = false;
      this.state.lastPromiseType = 'login failed';
    });
    return this.state.lastPromise;
  }

  logout() {
    const p = this.state.lastPromise;
    if (this.state.lastPromiseType === 'logout') {
      return p;
    }
    this.state.lastPromise = 'logout';
    this.state.lastPromise = p
    // .then(() => this.wsProtocol.open())
    // .then(() => this.wsProtocol.send({
    //   path: '/logout',
    //   body: JSON.stringify({}),
    // }))
    // .then((res) => {
    //   return new Promise(resolve => {
    //     if(this.wsProtocol.wsPeer.state === 'closed'){
    //       return resolve();
    //     }
    //     const onclose = (e) => {
    //       this.loggedIn = false;
    //       this.wsProtocol.nativeEvents.removeListener('close', onclose);
    //       resolve();
    //     }
    //     this.wsProtocol.nativeEvents.addListener('close', onclose);
    //   });
    // })
    // finally, we can just simply colse the protocol
    .then(() => this.wsProtocol.close())
    .then(() => {
      this.loggedIn = false;
    })
    .catch((res) => {
      this.loggedIn = false;
    });
    return this.state.lastPromise;
  }
}

export default class WebRtcManager {
  constructor(wsProtocol) {
    this.wsProtocol = wsProtocol;
    this.peerMgr = new RtcPeerManager(this);
    this.sessionHelper = new SessionHelper(wsProtocol);
    this._reset();
  }

  _getDefaultCallbacks() {
    return {
      answerCallFunc: (() => true),
      onCallStateChanged: ((callId, prevState, nextState) => {}),
      onRtcPeerCreated: ((peer) => {}),
      onRtcPeerRemoved: ((peer) => {}),
      onGotLocalStream: ((stream) => {}),
      onGotRemoteStream: ((peer, stream) => {}),
      onCallStarted: ((callId) => {}),
      onCallEnd: ((callId) => {}),
      onResponse: ((callId, response) => {}),
      onCancel: ((callId, byRemote) => {}),
    };
  }

  _applyCallbacks(cbs = {}) {
    const defaults = this._getDefaultCallbacks();
    Object.keys(defaults).forEach((key) => {
      this[key] = cbs[key] || defaults[key];
    });
  }

  _handleDataFromServer = (message) => {
    // console.log('handleDataFromServer', message);
    const signal = message.data;
    if (signal.session) return;

    const { callId } = signal;

    // create a new one while receiving a new call
    const rtcPeer = this.peerMgr.getPeer(callId) || this.createRtcPeer(callId);

    rtcPeer.handleSignal(signal);
  }

  login(token) {
    this.token = token || this.token;
    return this.sessionHelper.login(this.token);
  }

  logout() {
    return this.sessionHelper.logout(this.token);
  }

  _reset() {
    this.localStream = null;
    this.localStreamPromise = null;
    this._applyCallbacks();
    this.state = {};
  }

  init(uid, token, {
    ...cbs
  }) {
    return this.destroy()
    .then(() => {
      this.uid = uid || this.uid;
      this.token = token || this.token;

      this._applyCallbacks(cbs);

      // this.wsProtocol.events.addListener('message', this._onMessage);
      this.wsProtocol.events.addListener('send', this._handleDataFromServer);

      return this.login()
      .then(() => this.getLocalStream().catch(e => console.error('login error :', e)));
    });
  }

  resetConnections() {
    return this.peerMgr.terminateAllPeers()
    .then(() => this.logout());
  }

  destroy() {
    return this.resetConnections()
    .then(() => this.removeLocalStream())
    .then(() => {
      // this.wsProtocol.events.removeListener('message', this._onMessage);
      this.wsProtocol.events.removeListener('send', this._handleDataFromServer);
    });
  }

  getLocalStream(isFront = true, {
    force = false,
    getConstraintsFunc = getConstraints,
  } = {}) {
    if (this.localStreamPromise && !force) {
      return this.localStreamPromise;
    }
    this.localStreamPromise = this.getUserMedia(isFront, getConstraintsFunc)
    .then((stream) => {
      this.onGotLocalStream(stream);
      return stream;
    });
    return this.localStreamPromise;
  }

  getUserMedia(isFront = true, getConstraintsFunc) {
    let videoSourceId;
    if (navigator.product === 'ReactNative') {
      const { Platform } = require('react-native'); // eslint-disable-line global-require
      // on android, you don't have to specify sourceId manually, just use facingMode
      // uncomment it if you want to specify
      if (Platform.OS === 'ios') {
        MediaStreamTrack.getSources((sourceInfos) => {
          console.log('sourceInfos: ', sourceInfos);

          for (let i = 0; i < sourceInfos.length; i++) {
            const sourceInfo = sourceInfos[i];
            if (sourceInfo.kind === 'video' && sourceInfo.facing === (isFront ? 'front' : 'back')) {
              videoSourceId = sourceInfo.id;
            }
          }
        });
      }
    }
    return getUserMedia(getConstraintsFunc(isFront, videoSourceId))
    .then((stream) => {
      console.log('getUserMedia success', stream);

      this.peerMgr.updateLocalStream(this.localStream, stream);

      this.localStream = stream;
      return stream;
    });
  }

  removeLocalStream() {
    return (this.localStreamPromise || Promise.resolve(this.localStream))
    .then((stream) => {
      if (stream) {
        stopStream(stream);
      }
      // this.peerMgr.updateLocalStream(this.localStream, stream);
      this.localStream = null;
      this.localStreamPromise = null;
      // this.onGotLocalStream(null);
      return null;
    });
  }

  _onCallStateChanged = callId => (state, nextState) => {
    const peer = this.peerMgr.getPeer(callId);
    if (nextState.state === 'destroyed') {
      delete this.state[callId];
    } else {
      this.state = {
        ...this.state,
        [callId]: peer.state,
      };
    }
    this.onCallStateChanged(callId, state, nextState);
    if (nextState.state === 'destroyed') {
      this.onRtcPeerRemoved(peer);
    }
  };

  createRtcPeer(callId) {
    const rtcPeer = this.peerMgr.createRtcPeer(callId, {
      answerCallFunc: this.answerCallFunc,
      onCallStateChanged: this._onCallStateChanged(callId),
      onResponse: (result) => {
        this.onResponse(callId, result);
      },
      onAccepted: (result) => {
        this.getLocalStream()
        .then(stream => rtcPeer.createOffer());
      },
      onDeclined: (result) => {
        rtcPeer.destroy();
      },
      onCallError: (e) => {
      },
      onCancel: (byRemote) => {
        this.onCancel(callId, byRemote);
      },
      onClose: (disconnectType) => {
        this.onCallEnd(callId, disconnectType);
      },
      nativeCbs: {
        onicecandidate: (event) => {
          if (event.candidate != null) {
            this.wsProtocol.open()
            .then(() => this.wsProtocol.send({
              path: '/ice',
              body: JSON.stringify({
                ice: event.candidate,
                userId: this.uid,
                callId,
              }),
            }));
          }
        },
        oniceconnectionstatechange: () => {
          if (rtcPeer.nativePc.iceConnectionState === 'disconnected') {
            rtcPeer.close(DisconnectType.ResetByPeer);
          }
        },
        onaddstream: (event) => {
          console.log('got remote stream');
          this.onGotRemoteStream(rtcPeer, event.stream);
          this.onCallStarted(callId);
        },
      },
    });
    this.onRtcPeerCreated(rtcPeer);
    return rtcPeer;
  }

  call(to) {
    return this.wsProtocol.request({
      path: '/calls',
      method: 'POST',
      body: JSON.stringify({
        to,
      }),
    })
    .then(({ data }) => {
      const callId = data.call.uid;
      const rtcPeer = this.createRtcPeer(callId);
      return rtcPeer.createCall(filterCallProps(data.call));
    });
  }

  getUserList() {
    return this.login()
    .then(() => this.wsProtocol.request({
      path: '/users',
      method: 'GET',
    }))
    .then(users => users.data.filter(user => user.uid !== this.uid))
    .catch(e => []);
  }

  cancel(callId) {
    const peer = this.peerMgr.getPeer(callId);
    return peer.cancel();
  }

  close(callId) {
    const peer = this.peerMgr.getPeer(callId);
    return peer.close(DisconnectType.Close);
  }
}
