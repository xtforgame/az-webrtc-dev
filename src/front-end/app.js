import WsProrocol from 'common/ricio/ws/front-end/api';
import WebRtcManager from './webrtc/web-rtc-manager';

import EventEmitter from 'events';
import { wssPort } from 'common/core/config';

let wsProrocol = new WsProrocol(`wss://${window.location.hostname}:${wssPort}/`, EventEmitter);
let webRtcManager = new WebRtcManager(wsProrocol);

let _pageReady = null;
let selectedId = null;

function pageReady() {
  document.getElementById("state").innerHTML = JSON.stringify(webRtcManager.state, null, 4);
  if(_pageReady){
    return _pageReady;
  }
  return _pageReady = webRtcManager.init(
  'WebUser',
  {
    onStateChanged: () => {
      document.getElementById("state").innerHTML = JSON.stringify(webRtcManager.state, null, 4);
    },
    onGotLocalStream: stream => {
      let localVideo = document.getElementById('localVideo');
      localVideo.srcObject = stream;
    },
    onGotRemoteStream: (pc, stream) => {
      let remoteVideo = document.getElementById('remoteVideo');
      remoteVideo.srcObject = stream;
    },
    onReceivedCall: (_callId) => {
      return new Promise((resolve, reject) => {
        document.getElementById("accept").style.display = "";
        document.getElementById("decline").style.display = "";
        document.getElementById("call").style.display = "none";

        let accept = null;
        let decline = null;
        let anwser = accepted => () => {
          callId = _callId;
          resolve(accepted);
          document.getElementById("accept").removeEventListener("click", accept);
          document.getElementById("decline").removeEventListener("click", decline);
          document.getElementById("accept").style.display = "none";
          document.getElementById("decline").style.display = "none";
          document.getElementById("call").style.display = accepted ? "none" : "";
        }
        accept = anwser(true);
        decline = anwser(false);
        document.getElementById("accept").addEventListener("click", accept);
        document.getElementById("decline").addEventListener("click", decline);
      });
    },
    onCallStarted: (callId) => {
      document.getElementById("close").style.display = "";
    },
    onCallEnd: (_callId) => {
      console.log('onCallEnd');
      callId = null;
      remoteVideo.srcObject = undefined;
      document.getElementById("call").style.display = "";
      document.getElementById("close").style.display = "none";
    },
    onResponse: (callId, response) => {
      console.log('response :', response);
      document.getElementById("cancel").style.display = "none";
      if(response === 'accept'){
        document.getElementById("call").style.display = "none";
      }else if(response === 'decline'){
        document.getElementById("call").style.display = "";
      }
    },
    onCancel: (_callId) => {
      callId = null;
      document.getElementById("accept").style.display = "none";
      document.getElementById("decline").style.display = "none";
      document.getElementById("call").style.display = "";
      document.getElementById("cancel").style.display = "none";
      document.getElementById("close").style.display = "none";
    },
  })
  .then(() => {
    return webRtcManager.getUserList();
  })
  .then(users => {
    console.log('users :', users);
  });
}

pageReady();

let callId = null;

document.getElementById("call").addEventListener("click", () => {
  return pageReady()
  .then(() => {
    let to = document.getElementById("user-select").value;
    if(to){
      return webRtcManager.call(to)
      .then(_callId => {
        callId = _callId;
        document.getElementById("call").style.display = "none";
        document.getElementById("cancel").style.display = "";
      });
    }
    return Promise.resolve();
  });
});

document.getElementById("close").addEventListener("click", () => {
  return webRtcManager.close(callId)
  .then(() => {
    callId = null;
    document.getElementById("close").style.display = "none";
    document.getElementById("call").style.display = "";
  });
});

document.getElementById("cancel").addEventListener("click", () => {
  console.log('callId :', callId);
  return webRtcManager.cancel(callId);
});

document.getElementById("get-user-list").addEventListener("click", () => {
  selectedId = null;
  let userSelect = document.getElementById("user-select");
  for(let i = userSelect.options.length - 1 ; i >= 0 ; i--){
    userSelect.remove(i);
  }
  return pageReady()
  .then(() => {
    return webRtcManager.getUserList()
  })
  .then(users => {
    let userSelect = document.getElementById("user-select");
    users.map(user => {
      let option = document.createElement("option");
      option.text = `${user.name}${user.isBusy ? '(busy)' : ''}`;
      option.value = user.uid;
      option.disabled = user.isBusy;
      userSelect.add(option);
    });
  });
});
