/* eslint-disable no-underscore-dangle, no-console */
// https://www.webrtc-experiment.com/docs/how-to-switch-streams.html

import {
  filterCallProps,
  getPeerConnectionConfig,
  DisconnectType,
} from './utils';

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from './index';

const errorHandler = e => console.error('e :', e);

class RtcPeer {
  constructor(callId, peerMgr, options = {}) {
    const {
      ...cbs
    } = options;

    this.callId = callId;
    this.peerMgr = peerMgr;
    this.webRtcManager = this.peerMgr.webRtcManager;
    this.userUid = this.peerMgr.webRtcManager.uid;
    this.wsProtocol = this.webRtcManager.wsProtocol;
    this.nativePc = new RTCPeerConnection(getPeerConnectionConfig());

    this._applyCallbacks(cbs);

    if (this.webRtcManager.localStream) {
      this.nativePc.addStream(this.webRtcManager.localStream);
    }

    this.state = {
      state: 'idle',
      cbs: null,
    };
  }

  _getDefaultCallbacks() {
    return {
      answerCallFunc: (() => true),
      onCallStateChanged: ((prevState, nextState) => {}),
      onResponse: ((result) => {}),
      onAccepted: ((result) => {}),
      onDeclined: ((result) => {}),
      onCallError: ((e) => {}),
      onCancel: ((byRemote) => {}),
      onClose: ((disconnectType) => {}),
      nativeCbs: {
        onaddstream: ((event) => {}),
        onconnectionstatechange: ((event) => {}),
        ondatachannel: ((event) => {}),
        onicecandidate: ((event) => {}),
        oniceconnectionstatechange: ((event) => {}),
        onicegatheringstatechange: ((event) => {}),
        onidentityresult: ((event) => {}),
        onidpassertionerror: ((event) => {}),
        onidpvalidationerror: ((event) => {}),
        onnegotiationneeded: ((event) => {}),
        onpeeridentity: ((event) => {}),
        onremovestream: ((event) => {}),
        onsignalingstatechange: ((event) => {}),
        ontrack: ((event) => {}),
      },
    };
  }

  _applyCallbacks(cbs = {}) {
    const defaults = this._getDefaultCallbacks();
    Object.keys(defaults).forEach((key) => {
      this[key] = cbs[key] || defaults[key];
    });
    Object.keys(defaults.nativeCbs).forEach((cbName) => {
      const cb = (cbs.nativeCbs && cbs.nativeCbs[cbName]) || defaults.nativeCbs[cbName];
      this.nativePc[cbName] = cb;
    });
    const { answerCallFunc } = this;
    this.answerCallFunc = call => Promise.resolve(call).then(answerCallFunc);
  }

  setCallState(nextState) {
    const { state } = this;
    this.state = {
      ...this.state,
      ...nextState,
    };
    this.onCallStateChanged(state, nextState);
  }

  sendDescription = (description) => {
    console.log('got description');
    console.log('description :', description);

    return this.nativePc.setLocalDescription(description)
    .then(() => this.webRtcManager.wsProtocol.open()
      .then(() => this.webRtcManager.wsProtocol.send({
        path: '/sdp',
        body: JSON.stringify({
          sdp: this.nativePc.localDescription,
          userId: this.userUid,
          callId: this.callId,
        }),
      })));
  };

  createCall(call) {
    this.setCallState({
      state: 'calling',
      call,
      callId: this.callId,
    });
    return this.callId;
  }

  createOffer = () => this.nativePc.createOffer()
    .then(this.sendDescription)
    .catch(errorHandler);

  createAnswer = () => this.nativePc.createAnswer()
    .then(this.sendDescription)
    .catch(errorHandler);

  _handleCall(signal) {
    const { callId } = this;
    const call = filterCallProps(signal.call);
    if (signal.call.caller !== this.userUid) {
      if (signal.call.response === 'cancel') {
        this.cancel(true);
        return;
      }
      this.setCallState({
        state: 'received',
        call,
        callId,
        cbs: null,
      });
      this.answerCallFunc(call)
      .then((accept) => {
        let response = 'decline';
        if (accept) {
          this.setCallState({
            state: 'accepted',
            call,
            callId,
            cbs: null,
          });
          response = 'accept';
        } else {
          this.destroy();
        }
        return this.wsProtocol.request({
          path: `/calls/${callId}`,
          method: 'PATCH',
          body: JSON.stringify({
            response,
          }),
        });
      });
    } else if (signal.call.response) {
      if (signal.call.response !== 'accept') {
        this.onDeclined(signal.call.response);
        this.destroy();
      } else {
        this.onAccepted(signal.call.response);
        this.setCallState({
          state: 'accepted',
          callId: this.callId,
          call: filterCallProps(signal.call),
          cbs: null,
        });
      }
    }
  }

  _handleSdp(signal) {
    this.nativePc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
      // Only create answers in response to offers
      if (signal.sdp.type === 'offer') {
        this.createAnswer();
      }
    })
    .catch(errorHandler);
  }

  _handleIce(signal) {
    this.nativePc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
  }

  handleSignal(signal) {
    // Ignore messages from ourself
    if (signal.userId === this.userUid) return;
    if (signal.call) {
      this._handleCall(signal);
    } else if (signal.sdp) {
      this._handleSdp(signal);
    } else if (signal.ice) {
      this._handleIce(signal);
    }
  }

  destroy() {
    const nextState = {
      state: 'destroyed',
    };
    this.setCallState(nextState);
    this.peerMgr.removeRtcPeer(this.callId);
    this._applyCallbacks();
    return Promise.resolve();
  }

  cancel(byRemote = false) {
    return (
      byRemote ? Promise.resolve({}) : this.wsProtocol.request({
        path: `/calls/${this.callId}`,
        method: 'PATCH',
        body: JSON.stringify({
          response: 'cancel',
        }),
      })
    )
    .then(({ errorMsg }) => {
      if (errorMsg) {
        return Promise.reject(errorMsg);
      }
      return this.onCancel(byRemote);
    })
    .then(() => {
      this.destroy();
    })
    .catch((e) => {
      console.log('cancel error :', e);
      this.destroy();
    });
  }

  close(disconnectType = DisconnectType.Close) {
    return Promise.resolve({})
    .then(() => {
      this.onClose(disconnectType);
    })
    .then(() => {
      this.destroy();
    })
    .catch((e) => {
      console.log('close error :', e);
      this.destroy();
    });
  }
}

export default class RtcPeerManager {
  constructor(webRtcManager) {
    this.webRtcManager = webRtcManager;
    this.peers = {};
  }

  createRtcPeer(id, options) {
    this.peers[id] = new RtcPeer(id, this, options);
    return this.peers[id];
  }

  removeRtcPeer(id) {
    const peer = this.getPeer(id);
    if (peer) {
      peer.nativePc.close();
    }
    delete this.peers[id];
  }

  getPeer(id) {
    return this.peers[id];
  }

  map(...args) {
    return Object.keys(this.peers).map(id => this.peers[id]).map(...args);
  }

  terminateAllPeers() {
    return Promise.all(this.map(peer => peer.destroy()));
  }

  updateLocalStream(originalStream, newStream) {
    if (originalStream) {
      Object.keys(this.peers).map((id) => {
        const peer = this.peers[id].nativePc;
        return peer && peer.removeStream(originalStream);
      });
    }

    Object.keys(this.peers).map((id) => {
      const peer = this.peers[id].nativePc;
      return peer && peer.addStream(newStream);
    });
  }
}
