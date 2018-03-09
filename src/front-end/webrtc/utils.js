// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
export function genUuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

export function errorHandler(error) {
  console.log("errorHandler", error);
}

// export let getPeerConnectionConfig = () => ({
//   iceServers: [
//     {urls: 'stun:stun.services.mozilla.com'},
//     {urls: 'stun:stun.l.google.com:19302'},
//   ]
// });

export let getPeerConnectionConfig = () => ({
  iceServers: [
    {url: 'stun:stun.l.google.com:19302'},
  ]
});

// export let getConstraints = () => ({
//   video: true,
//   audio: true,
// });

let getFacingMode = isFront => undefined;
if(navigator.product === 'ReactNative'){
  getFacingMode = isFront => (isFront ? "user" : "environment");
}

export let getConstraints = (isFront = true, videoSourceId) => ({
  audio: true,
  video: {
    mandatory: {
      minWidth: 640, // Provide your own width, height and frame rate here
      minHeight: 360,
      minFrameRate: 30,
    },
    facingMode: getFacingMode(isFront),
    optional: (videoSourceId ? [{sourceId: videoSourceId}] : []),
  }
});

