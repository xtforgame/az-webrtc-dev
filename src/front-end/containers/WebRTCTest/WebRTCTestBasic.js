import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import Button from 'material-ui/Button';

import wsProtocol from '~/utils/wsProtocol1';
import WebRtcManager from './webrtc/web-rtc-manager';

import { createStructuredSelector } from 'reselect';
import {
  makeUserSessionSelector,
} from '~/containers/App/selectors';

let webRtcManager = new WebRtcManager(wsProtocol);

import {
  readTestApi,
  cancelReadTestApi,
} from './actions';

import modelMap from '../App/modelMap';

const {
  createWsSession,
  createWsSessionCancel,
} = modelMap.actions;

let selectedId = null;

class WebRTCTestBasic extends React.Component {
  read = () => {
    let { readTestApi, createWsSession } = this.props;
    return createWsSession({
      token: 'xxxxxxxxxxxx',
    });
  };

  cancel = () => {
    let { cancelReadTestApi, createWsSessionCancel } = this.props;
    return createWsSessionCancel();
  };

  componentDidMount() {
    let { session } = this.props;
    console.log('session :', session);
    let callId = null;

    document.getElementById('call').addEventListener('click', () => {
      let to = document.getElementById('user-select').value;
      if(to){
        return webRtcManager.call(to)
        .then(_callId => {
          callId = _callId;
          document.getElementById('call').style.display = 'none';
          document.getElementById('cancel').style.display = '';
        });
      }
      return Promise.resolve();
    });

    document.getElementById('close').addEventListener('click', () => {
      return webRtcManager.close(callId)
      .then(() => {
        callId = null;
        document.getElementById('close').style.display = 'none';
        document.getElementById('call').style.display = '';
      });
    });

    document.getElementById('cancel').addEventListener('click', () => {
      console.log('callId :', callId);
      return webRtcManager.cancel(callId);
    });

    document.getElementById('get-user-list').addEventListener('click', () => {
      selectedId = null;
      let userSelect = document.getElementById('user-select');
      for(let i = userSelect.options.length - 1 ; i >= 0 ; i--){
        userSelect.remove(i);
      }
      return webRtcManager.getUserList()
      .then(users => {
        let userSelect = document.getElementById('user-select');
        users.map(user => {
          let option = document.createElement('option');
          option.text = `${user.name}${user.isBusy ? '(busy)' : ''}`;
          option.value = user.uid;
          option.disabled = user.isBusy;
          userSelect.add(option);
        });
      });
    });

    return webRtcManager.init(session.userid, session.username, session.username, {
      onStateChanged: () => {
        document.getElementById('state').innerHTML = JSON.stringify(webRtcManager.state, null, 4);
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
          document.getElementById('accept').style.display = '';
          document.getElementById('decline').style.display = '';
          document.getElementById('call').style.display = 'none';

          let accept = null;
          let decline = null;
          let anwser = accepted => () => {
            callId = _callId;
            resolve(accepted);
            document.getElementById('accept').removeEventListener('click', accept);
            document.getElementById('decline').removeEventListener('click', decline);
            document.getElementById('accept').style.display = 'none';
            document.getElementById('decline').style.display = 'none';
            document.getElementById('call').style.display = accepted ? 'none' : '';
          }
          accept = anwser(true);
          decline = anwser(false);
          document.getElementById('accept').addEventListener('click', accept);
          document.getElementById('decline').addEventListener('click', decline);
        });
      },
      onCallStarted: (callId) => {
        document.getElementById('close').style.display = '';
      },
      onCallEnd: (_callId) => {
        console.log('onCallEnd');
        callId = null;
        remoteVideo.srcObject = undefined;
        document.getElementById('call').style.display = '';
        document.getElementById('close').style.display = 'none';
      },
      onResponse: (callId, response) => {
        console.log('response :', response);
        document.getElementById('cancel').style.display = 'none';
        if (response === 'accept') {
          document.getElementById('call').style.display = 'none';
        } else if (response === 'decline') {
          document.getElementById('call').style.display = '';
        }
      },
      onCancel: (_callId) => {
        callId = null;
        document.getElementById('accept').style.display = 'none';
        document.getElementById('decline').style.display = 'none';
        document.getElementById('call').style.display = '';
        document.getElementById('cancel').style.display = 'none';
        document.getElementById('close').style.display = 'none';
      },
    })
      .then(() => {
        return webRtcManager.getUserList();
      })
      .then(users => {
        console.log('users :', users);
      });
  }

  render() {
    let { classes } = this.props;

    return (
      <div>
        <video id="localVideo" autoPlay muted style={{ width: '40%' }}></video>
        <video id="remoteVideo" autoPlay style={{ width: '40%' }}></video><br />
        <select id="user-select" size="9" style={{ width: 200 }}></select>
        <input type="button" id="accept" value="Accept" style={{ display: 'none' }}></input>
        <input type="button" id="decline" value="Decline" style={{ display: 'none' }}></input>
        <br />
        <input type="button" id="get-user-list" value="Get User List"></input>
        <br /><br />
        <input type="button" id="call" value="Call"></input>
        <input type="button" id="cancel" value="Cancel" style={{ display: 'none' }}></input>
        <input type="button" id="close" value="Hang up" style={{ display: 'none' }}></input>
        <div>
          <pre id="state">
          </pre>
        </div>
        <Button
          dense="true"
          variant="raised"
          color="primary"
          onClick={this.read}
        >
          Read Test Api
        </Button><br />
        <Button
          dense="true"
          variant="raised"
          color="primary"
          onClick={this.cancel}
        >
          Cancel
        </Button>
      </div>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  session: makeUserSessionSelector(),
});

export default compose(
  connect(
    mapStateToProps,
    {
      readTestApi,
      cancelReadTestApi,
      createWsSession,
      createWsSessionCancel,
    }
  ),
)(WebRTCTestBasic);
