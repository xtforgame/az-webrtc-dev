/* eslint-disable no-console */
import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import Video from './Video';
import wsProtocol from '~/utils/wsProtocol1';
import webRtcManager from '~/utils/webRtcManager1';

import { createStructuredSelector } from 'reselect';
import {
  makeUserSessionSelector,
} from '~/containers/App/selectors';

const styles = theme => ({
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 120,
  },
});

class WebRTCTestRoom extends React.Component {
  constructor(...args) {
    super(...args);
    this.state = {
      localStream: null,
      userList: [],
      webrtcState: {},
      callList: [],
      connectedPeer: {},
      connectionData: {},
    };
  }

  componentDidMount() {
    const { session } = this.props;
    console.log('session :', session);

    wsProtocol.channelEvents.addListener('user-joined', this.onUserJoined);
    wsProtocol.channelEvents.addListener('user-left', this.onUserLeft);

    this.setState({
      webrtcState: {
        ...webRtcManager.state,
      },
    });

    return webRtcManager.init(session.user_id, session.token, {
      answerCallFunc: (call) => {
        this.updateConnectionData(call.uid);
        return true;
      },
      onCallStateChanged: (callId, originalState, peerNextState) => {
        let nextState = {
          webrtcState: {
            ...webRtcManager.state,
          },
        };

        if (peerNextState.state === 'calling' || peerNextState.state === 'received') {
          nextState = {
            ...nextState,
            ...this.addCall(peerNextState.call),
          };
        } else if (peerNextState.state === 'destroyed' && originalState.state !== 'idle') {
          nextState = {
            ...nextState,
            ...this.removeCall(originalState.call),
          };
        }
        this.setState(nextState);
      },
      onRtcPeerCreated: (peer) => {},
      onRtcPeerRemoved: (peer) => {},
      onGotLocalStream: localStream => this.setState({ localStream }),
      onGotRemoteStream: (peer, remoteStream) => this.updateConnectionData(peer.callId, { remoteStream }),
      onCallStarted: (callId) => {
      },
      onCallEnd: (callId) => {
        console.log('onCallEnd');
        this.updateConnectionData(callId);
      },
      onResponse: (callId, response) => {
        console.log('response :', response);
      },
      onCancel: (callId, byRemote) => {
        console.log('onCancel');
        this.updateConnectionData(callId);
      },
    })
      .then(() => wsProtocol.joinChannels(['lobby']))
      .then(() => this.updateUserList())
      .then((users) => {
        // console.log('users :', users);
      });
  }

  componentWillUnmount() {
    const { webrtcState } = this.state;
    wsProtocol.channelEvents.removeListener('user-joined', this.onUserJoined);
    wsProtocol.channelEvents.removeListener('user-left', this.onUserLeft);
    this.state.callList.forEach((callId) => {
      const callState = webrtcState[callId];
      // const connectionData = this.state.connectionData[callId];
      // console.log('connectionData :', connectionData);
      if (callState.state === 'accepted') {
        webRtcManager.close(callId);
      }
    });
    wsProtocol.leaveChannels(['lobby']);
    webRtcManager.destroy();
  }

  onUserJoined = e => webRtcManager.call(e.sender.id);

  onUserLeft = (e) => {
    console.log('user-left :', e);
  };

  updateUserList = () => webRtcManager.getUserList()
  .then((userList) => {
    this.setState({
      userList,
    });
    return userList;
  });

  cancel = callId => () => webRtcManager.cancel(callId);

  close = callId => () => webRtcManager.close(callId)
    .then(() => {
      this.updateConnectionData(callId);
    });

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  addCall(call) {
    const { session } = this.props;
    const callList = this.state.callList.concat(call.uid);
    const connectedPeer = { ...this.state.connectedPeer };

    if (session.user_id === call.caller.id) {
      connectedPeer[call.callee.id] = call;
    } else {
      connectedPeer[call.caller.id] = call;
    }

    return {
      callList,
      connectedPeer,
    };
  }

  removeCall(call) {
    const { session } = this.props;
    const callList = [...this.state.callList];
    const connectedPeer = { ...this.state.connectedPeer };
    const index = this.state.callList.indexOf(call.uid);
    if (index !== -1) {
      callList.splice(index, 1);
    }

    if (session.user_id === call.caller.id) {
      delete connectedPeer[call.callee.id];
    } else {
      delete connectedPeer[call.caller.id];
    }

    return {
      callList,
      connectedPeer,
    };
  }

  updateConnectionData(callId, data) {
    const connectionData = { ...this.state.connectionData };
    if (data === undefined) {
      delete connectionData[callId];
    } else {
      connectionData[callId] = data;
    }
    return this.setState({
      connectionData,
    });
  }

  render() {
    const { webrtcState } = this.state;

    return (
      <div>
        <Button
          dense="true"
          variant="raised"
          color="primary"
          onClick={this.updateUserList}
        >
          Get User List
        </Button>
        <br />
        <br />
        <Video id="localVideo" srcObject={this.state.localStream} autoPlay muted style={{ width: '40%' }} />
        {
          this.state.callList.map((callId) => {
            const callState = webrtcState[callId];
            const connectionData = this.state.connectionData[callId];
            // console.log('connectionData :', connectionData);
            return (
              <div key={callId}>
                {callState.state === 'calling' && (
                  <Button
                    dense="true"
                    variant="raised"
                    color="primary"
                    onClick={this.cancel(callId)}
                  >
                  Cancel
                  </Button>
                )}
                {connectionData && connectionData.accept && (
                  <Button
                    dense="true"
                    variant="raised"
                    color="primary"
                    onClick={connectionData.accept}
                  >
                  Accept
                  </Button>
                )}
                {connectionData && connectionData.decline && (
                  <Button
                    dense="true"
                    variant="raised"
                    color="primary"
                    onClick={connectionData.decline}
                  >
                  Decline
                  </Button>
                )}
                {callState.state === 'accepted' && (
                  <Button
                    dense="true"
                    variant="raised"
                    color="primary"
                    onClick={this.close(callId)}
                  >
                  Close
                  </Button>
                )}
                <br />
                <Video srcObject={connectionData && connectionData.remoteStream} autoPlay style={{ width: '40%' }} />
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
)(WebRTCTestRoom);
