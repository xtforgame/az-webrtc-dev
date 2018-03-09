import wsApi from './utils/websocket-api';
import WsProrocol from 'common/ws/front-end/api';
import {
  genUuid,
  errorHandler,
  getPeerConnectionConfig,
  getConstraints,
} from './webrtc/utils';

import {
  RTCPeerConnection,
  // RTCMediaStream,
  RTCIceCandidate,
  RTCSessionDescription,
  // RTCView,
  MediaStreamTrack,
  getUserMedia,
} from './webrtc';

import WebRtcManager from './webrtc/web-rtc-manager';

let wsProrocol = new WsProrocol(wsApi);
let webRtcManager = new WebRtcManager(wsProrocol);

function pageReady() {
  webRtcManager.init(stream => {
    let localVideo = document.getElementById('localVideo');
    localVideo.srcObject = stream;
  },
  stream => {
    let remoteVideo = document.getElementById('remoteVideo');
    remoteVideo.srcObject = stream;
  });
}

pageReady();

document.getElementById("start").addEventListener("click", () => {
  webRtcManager.start(true);
});
