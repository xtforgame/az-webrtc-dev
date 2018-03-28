// export let getPeerConnectionConfig = () => ({
//   iceServers: [
//     {urls: 'stun:stun.services.mozilla.com'},
//     {urls: 'stun:stun.l.google.com:19302'},
//   ]
// });

export const filterCallProps = (call) => {
  const {
    callee,
    calleeName,
    caller,
    callerName,
    uid,
  } = call;
  return {
    callee: {
      id: callee,
      name: calleeName,
    },
    caller: {
      id: caller,
      name: callerName,
    },
    uid,
  };
};

export const stopStream = stream => stream.getTracks().map(track => track.stop());

export const getPeerConnectionConfig = () => ({
  iceServers: [
    { url: 'stun:stun.l.google.com:19302' },
  ],
});

// export let getConstraints = () => ({
//   video: true,
//   audio: true,
// });

let getFacingMode = isFront => undefined;
if (navigator.product === 'ReactNative') {
  getFacingMode = isFront => (isFront ? 'user' : 'environment');
}

export const getConstraints = (isFront = true, videoSourceId) => ({
  audio: true,
  video: {
    mandatory: {
      minWidth: 640, // Provide your own width, height and frame rate here
      minHeight: 360,
      minFrameRate: 30,
    },
    facingMode: getFacingMode(isFront),
    optional: (videoSourceId ? [{ sourceId: videoSourceId }] : []),
  },
});

export const DisconnectType = {
  Close: 'Close',
  ResetByPeer: 'ResetByPeer',
};
