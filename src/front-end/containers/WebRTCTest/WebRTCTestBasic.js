import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import FormSelect from '~/components/Selects/FormSelect';
import { MenuItem } from 'material-ui/Menu';
import Typography from 'material-ui/Typography';

import Video from './Video';
import wsProtocol from '~/utils/wsProtocol1';
import WebRtcManager from '~/utils/webrtc/WebRtcManager';

import { createStructuredSelector } from 'reselect';
import {
  makeUserSessionSelector,
} from '~/containers/App/selectors';

let webRtcManager = new WebRtcManager(wsProtocol);

let styles = theme => ({
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 120,
  },
});

class WebRTCTestBasic extends React.Component {
  constructor(...args){
    super(...args);
    this.state = {
      localStream: null,
      selectedRoom: '',
      userList: [],
      webrtcState: {},
      callList: [],
      connectedPeer: {},
      connectionData: {},
    };
  }

  updateUserList = () => {
    return webRtcManager.getUserList()
    .then(userList => {
      this.setState({
        userList,
      });
      return userList;
    });
  };

  call = () => {
    let to = this.state.selectedRoom;

    if(to){
      return webRtcManager.call(to);
    }
    return Promise.resolve();
  };

  cancel = callId => () => {
    return webRtcManager.cancel(callId);
  };

  close = callId => () => {
    return webRtcManager.close(callId)
    .then(() => {
      this.updateConnectionData(callId);
    });
  };

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  addCall(call){
    let { session } = this.props;
    let callList = this.state.callList.concat(call.uid);
    let connectedPeer = { ...this.state.connectedPeer };

    if(session.user_id === call.caller.id){
      connectedPeer[call.callee.id] = call;
    }else{
      connectedPeer[call.caller.id] = call;
    }

    return {
      callList,
      connectedPeer,
    };
  }

  removeCall(call){
    let { session } = this.props;
    let callList = [...this.state.callList];
    let connectedPeer = { ...this.state.connectedPeer };
    const index = this.state.callList.indexOf(call.uid);
    if(index != -1) {
      callList.splice(index, 1);
    }

    if(session.user_id === call.caller.id){
      delete connectedPeer[call.callee.id];
    }else{
      delete connectedPeer[call.caller.id];
    }

    return {
      callList,
      connectedPeer,
    };
  }

  updateConnectionData(callId, data){
    let connectionData = { ...this.state.connectionData };
    if(data === undefined){
      delete connectionData[callId];
    }else{
      connectionData[callId] = data;
    }
    return this.setState({
      connectionData,
    });
  }

  componentDidMount() {
    let { classes, session } = this.props;
    console.log('session :', session);

    this.setState({
      webrtcState: {
        ...webRtcManager.state,
      },
    });

    return webRtcManager.init(session.user_id, session.token, {
      onCallStateChanged: (callId, originalState, newState) => {
        let nextState = {
          webrtcState: {
            ...webRtcManager.state,
          },
        };

        if(!originalState && newState){
          nextState = {
            ...nextState,
            ...this.addCall(newState.call),
          };
        }else if(!newState && originalState){
          nextState = {
            ...nextState,
            ...this.removeCall(originalState.call),
          };
          console.log('nextState :', nextState);
        }
        this.setState(nextState);
      },
      onPeerConnectionCreated: (pc) => {},
      onPeerConnectionRemoved: (pc) => {},
      onGotLocalStream: localStream => this.setState({ localStream }),
      onGotRemoteStream: (pc, remoteStream) => this.updateConnectionData(pc.id, { remoteStream }),
      onReceivedCall: (callId) => {
        return new Promise((resolve, reject) => {
          let accept = null;
          let decline = null;
          let anwser = accepted => () => {
            this.updateConnectionData(callId);
            resolve(accepted);
          }
          accept = anwser(true);
          decline = anwser(false);
          this.updateConnectionData(callId, {
            receivedCallId: callId,
            accept,
            decline,
          });
        });
      },
      onCallStarted: (callId) => {
      },
      onCallEnd: (callId) => {
        console.log('onCallEnd');
        this.updateConnectionData(callId);
      },
      onResponse: (callId, response) => {
        console.log('response :', response);
      },
      onCancel: (callId) => {
        console.log('onCancel');
        this.updateConnectionData(callId);
      },
    })
      .then(() => {
        return this.updateUserList();
      })
      .then(users => {
        console.log('users :', users);
      });
  }

  render() {
    let { classes } = this.props;
    let webrtcState = this.state.webrtcState;
    let selectedRoom = this.state.selectedRoom;
    let callInfo = this.state.connectedPeer[selectedRoom];

    return (
      <div>
        <Button
          dense="true"
          variant="raised"
          color="primary"
          onClick={this.updateUserList}
        >
          Get User List
        </Button><br />
        <FormSelect
          id="web-rtc-room"
          name="selectedRoom"
          label="Room"
          value={this.state.selectedRoom}
          onChange={this.handleChange}
          helperText="Select a chat room"
          formProps={{
            className: classes.formControl,
          }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {this.state.userList.map(user => {
            return (<MenuItem key={user.uid} value={user.uid}>{user.name}</MenuItem>);
          })}
        </FormSelect>
        {selectedRoom && !callInfo && <Button
          dense="true"
          variant="raised"
          color="primary"
          onClick={this.call}
        >
          Call
        </Button>}
        <br />
        <Video id="localVideo" srcObject={this.state.localStream} autoPlay muted style={{ width: '40%' }}></Video>
        {
          this.state.callList.map(callId => {
            let callState = webrtcState[callId];
            let connectionData = this.state.connectionData[callId];
            console.log('connectionData :', connectionData);
            return (
              <div key={callId}>
                {callState.state === 'calling' && <Button
                  dense="true"
                  variant="raised"
                  color="primary"
                  onClick={this.cancel(callId)}
                >
                  Cancel
                </Button>}
                {connectionData && connectionData.accept && <Button
                  dense="true"
                  variant="raised"
                  color="primary"
                  onClick={connectionData.accept}
                >
                  Accept
                </Button>}
                {connectionData && connectionData.decline && <Button
                  dense="true"
                  variant="raised"
                  color="primary"
                  onClick={connectionData.decline}
                >
                  Decline
                </Button>}
                {callState.state === 'accepted' && <Button
                  dense="true"
                  variant="raised"
                  color="primary"
                  onClick={this.close(callId)}
                >
                  Close
                </Button>}
                <br />
                <Video srcObject={connectionData && connectionData.remoteStream} autoPlay style={{ width: '40%' }}></Video>
              </div>
            );
          })
        }
        {/* <Button
          dense="true"
          variant="raised"
          color="primary"
          onClick={() => webRtcManager.getLocalStream(false, {
            force: true,
            getConstraintsFunc: () => ({audio: true, video: false}),
          })}
        >
          Get User Media
        </Button> */}
        <br />
        <Typography
          variant="body1"
          component="pre"
        >
          {JSON.stringify(webrtcState, null, 4)}
        </Typography>
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
    {}
  ),
  withStyles(styles),
)(WebRTCTestBasic);
