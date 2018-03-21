/* eslint-disable no-underscore-dangle */
// https://www.webrtc-experiment.com/docs/how-to-switch-streams.html

import {
  errorHandler,
  filterCallProps,
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

export const DisconnectType = {
  Close: 'Close',
  ResetByPeer: 'ResetByPeer',
};

class PeerConnection {
  constructor(id, webRtcManager, onCallStateChanged, nativeCbs = {}) {
    this.id = id;
    this.webRtcManager = webRtcManager;
    this.pcMgr = this.webRtcManager.pcMgr;
    this.nativePc = new RTCPeerConnection(getPeerConnectionConfig());
    this.onCallStateChanged = onCallStateChanged || ((prevState, nextState) => {});
    Object.keys(nativeCbs).forEach((cbName) => {
      const cb = nativeCbs[cbName];
      this.nativePc[cbName] = cb;
    });
    if (this.webRtcManager.localStream) {
      this.nativePc.addStream(this.webRtcManager.localStream);
    }

    this.state = {
      state: 'idle',
      cbs: null,
    };
  }

  setCallState(state) {
    const origin = this.state;
    this.state = {
      ...this.state,
      ...state,
    };
    this.onCallStateChanged(origin, state);
  }

  sendDescription = (description) => {
    console.log('got description');
    console.log('description :', description);

    this.nativePc.setLocalDescription(description)
    .then(() => {
      this.webRtcManager.wsProrocol.open()
      .then(() => this.webRtcManager.wsProrocol.send({
        path: '/sdp',
        body: JSON.stringify({
          sdp: this.nativePc.localDescription,
          userId: this.webRtcManager.uid,
          callId: this.id,
        }),
      }));
    });
  };

  createOffer = () => this.nativePc.createOffer()
    .then(this.sendDescription)
    .catch(errorHandler);

  createAnswer = () => this.nativePc.createAnswer()
    .then(this.sendDescription)
    .catch(errorHandler);
}

class PeerConnectionManager {
  constructor() {
    this.pcs = {};
  }

  createPc(id, webRtcManager, onCallStateChanged, nativeCbs = {}) {
    return (this.pcs[id] = new PeerConnection(id, webRtcManager, onCallStateChanged, nativeCbs));
  }

  removePc(id) {
    const pc = this.getPc(id);
    if (pc) {
      pc.nativePc.close();
    }
    delete this.pcs[id];
  }

  getPc(id) {
    return this.pcs[id];
  }

  updateLocalStream(originalStream, newStream) {
    if (originalStream) {
      Object.keys(this.pcs).map((id) => {
        const pc = this.pcs[id].nativePc;
        return pc && pc.removeStream(originalStream);
      });
    }

    Object.keys(this.pcs).map((id) => {
      const pc = this.pcs[id].nativePc;
      return pc && pc.addStream(newStream);
    });
  }
}

export default class WebRtcManager {
  constructor(wsProrocol) {
    this.wsProrocol = wsProrocol;
    this.pcMgr = new PeerConnectionManager();
    this.localStream = null;
    this.onCallStateChanged = null;
    this.onGotLocalStream = null;
    this.onGotRemoteStream = null;
    this.onCallStarted = null;
    this.onCallEnd = null;
    this.onReceivedCall = null;
    this.onResponse = null;
    this.onCancel = null;

    this.state = {};
  }

  removeCallState(callId) {
    const origin = this.state[callId];
    delete this.state[callId];
    this.onCallStateChanged(callId, origin, undefined);
  }

  setCallState(callId, state) {
    const origin = this.state[callId];
    const newState = {
      ...this.state[callId],
      ...state,
    };
    this.state = {
      ...this.state,
      [callId]: newState,
    };
    this.onCallStateChanged(callId, origin, newState);
  }

  _onMessage = (data) => {
    // console.log('message', data);
  };

  _handleDataFromServer = (message) => {
    // console.log('handleDataFromServer', message);
    const signal = message.data;
    if (signal.session) return;

    const callId = signal.callId;

    if (signal.call) {
      if (signal.call.caller !== this.uid) {
        if (signal.call.response === 'cancel') {
          this._onCancel(callId);
          return;
        }
        this.setCallState(callId, {
          state: 'received',
          call: filterCallProps(signal.call),
          callId,
          cbs: null,
        });
        Promise.resolve(this.onReceivedCall(callId))
        .then((accept) => {
          console.log('accept :', accept);
          let response = 'decline';
          if (accept) {
            this.setCallState(callId, {
              state: 'accepted',
              call: filterCallProps(signal.call),
              callId,
              cbs: null,
            });
            response = 'accept';
          } else {
            this.removeCallState(callId);
          }
          return this.wsProrocol.request({
            path: `/calls/${callId}`,
            method: 'PATCH',
            body: JSON.stringify({
              response,
              callId: this.uid,
            }),
          });
        });
      } else if (signal.call.response) {
        let cb = null;
        let state = 'idle';
        console.log('signal.call.response :', signal.call.response);
        if (signal.call.response === 'accept') {
          cb = this.state[callId] && this.state[callId].cbs.onAccepted;
          state = 'accepted';
        } else {
          cb = this.state[callId] && this.state[callId].cbs.onDeclined;
        }
        if (cb) {
          cb(signal.call.response);
        }
        if (state !== 'accepted') {
          this.removeCallState(callId);
        } else {
          this.setCallState(callId, {
            state,
            callId,
            call: filterCallProps(signal.call),
            cbs: null,
          });
        }
      }

      return;
    }

    const peerConnection = this.pcMgr.getPc(callId) || this.createPc(callId);

    // Ignore messages from ourself
    if (signal.userId === this.uid) return;

    if (signal.sdp) {
      peerConnection.nativePc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
        // Only create answers in response to offers
        if (signal.sdp.type === 'offer') {
          peerConnection.createAnswer();
        }
      })
      .catch(errorHandler);
    } else if (signal.ice) {
      peerConnection.nativePc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
  }

  login() {
    if (this.loggedIn) {
      return Promise.resolve();
    }
    return this.wsProrocol.open()
    .then(() => this.wsProrocol.request({
      path: '/sessions',
      method: 'POST',
      body: JSON.stringify({
        auth_type: 'basic',
        token: this.token,
      }),
    }))
    .then((res) => {
      this.loggedIn = true;
      console.log('res :', res);
    });
  }

  init(uid, token, {
    onCallStateChanged,
    onPeerConnectionCreated,
    onPeerConnectionRemoved,
    onGotLocalStream,
    onGotRemoteStream,
    onCallStarted,
    onCallEnd,
    onReceivedCall,
    onResponse,
    onCancel,
  }) {
    this.uid = uid || this.uid;
    this.token = token || this.token;
    this.onCallStateChanged = onCallStateChanged || ((callId, prevState, nextState) => {});
    this.onPeerConnectionCreated = onPeerConnectionCreated || ((pc) => {});
    this.onPeerConnectionRemoved = onPeerConnectionRemoved || ((pc) => {});
    this.onGotLocalStream = onGotLocalStream || ((stream) => {});
    this.onGotRemoteStream = onGotRemoteStream || ((pc, stream) => {});
    this.onCallStarted = onCallStarted || ((callId) => {});
    this.onCallEnd = onCallEnd || ((callId) => {});
    this.onReceivedCall = onReceivedCall || (() => true);
    this.onResponse = onResponse || ((callId, response) => {});
    this.onCancel = onCancel || ((callId) => {});
    this.wsProrocol.events.addListener('message', this._onMessage);
    this.wsProrocol.events.addListener('send', this._handleDataFromServer);

    return this.login()
    .then(() => this.getLocalStream().catch(errorHandler));
  }

  destroy() {
    this.wsProrocol.events.removeListener('message', this._onMessage);
    this.wsProrocol.events.removeListener('send', this._handleDataFromServer);
  }

  getLocalStream(isFront = true, {
    force = false,
    getConstraintsFunc = getConstraints,
  } = {}) {
    if (this.localStream && !force) {
      return Promise.resolve(this.localStream);
    }
    return this.getUserMedia(isFront, getConstraintsFunc)
    .then((stream) => {
      this.onGotLocalStream(stream);
      return stream;
    });
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

      this.pcMgr.updateLocalStream(this.localStream, stream);
      // if(this.localStream){
      //   this.localStream.release();
      // }

      this.localStream = stream;
      return stream;
    });
  }

  createPc(callId) {
    const peerConnection = this.pcMgr.createPc(callId, this, (() => {}), {
      onicecandidate: (event) => {
        if (event.candidate != null) {
          this.wsProrocol.open()
          .then(() => this.wsProrocol.send({
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
        if (peerConnection.nativePc.iceConnectionState === 'disconnected') {
          this._onCallEnd(callId, DisconnectType.ResetByPeer);
        }
      },
      onaddstream: (event) => {
        console.log('got remote stream');
        this.onGotRemoteStream(peerConnection, event.stream);
        this.onCallStarted(callId);
      },
    });
    this.onPeerConnectionCreated(peerConnection);
    return peerConnection;
  }

  call(to) {
    return this.wsProrocol.request({
      path: '/calls',
      method: 'POST',
      body: JSON.stringify({
        to,
      }),
    })
    .then(({ data }) => {
      const callId = data.call.uid;
      const peerConnection = this.createPc(callId);
      this.setCallState(callId, {
        state: 'calling',
        call: filterCallProps(data.call),
        callId,
        cbs: {
          onAccepted: (result) => {
            this.onResponse(callId, result);
            this.getLocalStream()
            .then(stream => peerConnection.createOffer());
          },
          onDeclined: (result) => {
            this.onResponse(callId, result);
            this.removeCallState(callId);
          },
          onError: (e) => {
          },
        },
      });
      return callId;
    });
  }

  getUserList() {
    return this.login()
    .then(() => this.wsProrocol.request({
      path: '/users',
      method: 'GET',
    }))
    .then(users => users.data.filter(user => user.uid !== this.uid))
    .catch(e => []);
  }

  removePc(callId) {
    const pc = this.pcMgr.getPc(callId);
    this.pcMgr.removePc(callId);
    this.onPeerConnectionRemoved(pc);
  }

  _onCallEnd(callId, disconnectType) {
    this.onCallEnd(callId, disconnectType);
    this.removePc(callId);
    this.removeCallState(callId);
  }

  _onCancel(callId) {
    this.removeCallState(callId);
    return Promise.resolve()
    .then(() => this.onCancel(callId));
  }

  cancel(callId) {
    return this.wsProrocol.request({
      path: `/calls/${callId}`,
      method: 'PATCH',
      body: JSON.stringify({
        response: 'cancel',
        callId: this.uid,
      }),
    })
    .then(({ errorMsg }) => {
      if (errorMsg) {
        return Promise.reject(errorMsg);
      }
      return this._onCancel(callId);
    });
  }

  close(callId) {
    return Promise.resolve(this._onCallEnd(callId, DisconnectType.Close));
  }
}
