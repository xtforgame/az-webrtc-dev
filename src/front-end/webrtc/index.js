if(navigator.product === 'ReactNative'){
  let {
    RTCPeerConnection,
    RTCMediaStream,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    MediaStreamTrack,
    getUserMedia,
  } = require('react-native-webrtc');

  exports.RTCPeerConnection = RTCPeerConnection;
  exports.RTCMediaStream = RTCMediaStream;
  exports.RTCIceCandidate = RTCIceCandidate;
  exports.RTCSessionDescription = RTCSessionDescription;
  exports.RTCView = RTCView;
  exports.MediaStreamTrack = MediaStreamTrack;
  exports.getUserMedia = getUserMedia;
}else{
  exports.RTCPeerConnection = RTCPeerConnection;
  // exports.RTCMediaStream = RTCMediaStream;
  exports.RTCIceCandidate = RTCIceCandidate;
  exports.RTCSessionDescription = RTCSessionDescription;
  // exports.RTCView = RTCView;
  exports.MediaStreamTrack = MediaStreamTrack;
  exports.getUserMedia = navigator.mediaDevices.getUserMedia;
  if(!exports.getUserMedia) {
    exports.getUserMedia = (() => Promise.reject('Your browser does not support getUserMedia API'));
  }
}

