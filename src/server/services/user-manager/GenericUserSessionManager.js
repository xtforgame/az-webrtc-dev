/* eslint-disable no-param-reassign, no-console */
import { LoggedInUser, UserSessionManager } from 'login-session-mgr';
import ChannelManager from './ChannelManager';
import fakeUserManager from '../../utils/fakeUserManager';

export class UserInfo extends LoggedInUser {
  constructor({
    uid,
    data = {},
    sessions = {},
  }) {
    super({ uid, data, sessions });
    this.data.channelMap = null;
  }

  get userSessionManager() {
    return this.data.userSessionManager;
  }

  mapSession(inFn) {
    const { sessions } = this;
    // console.log('sessions :', sessions);
    const fn = inFn || (() => {});
    return Object.keys(sessions).map(key => fn(key, sessions[key], sessions));
  }

  send(msg) {
    return this.mapSession((_, session, sessions) => session.data.rcPeer.send(msg));
  }

  joinChannel(channelArray) {
    return this.userSessionManager.peerJoinChannel(this, channelArray);
  }

  leaveChannel(channelArray) {
    return this.userSessionManager.peerLeaveChannel(this, channelArray);
  }

  inChannel(channel) {
    return this.userSessionManager.isPeerInChannel(this, channel);
  }
}

export default class GenericUserSessionManager {
  constructor() {
    this.userSessionCounters = {};
    this.chManager = new ChannelManager();
    this.allPeers = new Map();
    this.userSessionMgr = new UserSessionManager({
      UserInfoClass: UserInfo,
      onSessionLoggedIn: ((newSession) => {
        // console.log('=================== newSession :', newSession);
        newSession.data.rcPeer.setSession(newSession);
      }),
      onUserLoggedIn: ((newUser) => {
        newUser.data.userSessionManager = this;
        // console.log('=================== newUser :', newUser);
      }),
      onSessionLoggedOut: ((existedSession, reason) => {
      }),
      onUserLoggedOut: ((existedUser) => {
      }),
      onSessionUnexpectedLoggedOut: ((existedSession, reason) => {
      }),
      onSessionReloggedIn: ((reloggedInSession, newData) => {
      }),
      onSessionDuplicateLogin: ((existedSession, newSession, logoutExistedOne, denyLogin) => {
        denyLogin();
        logoutExistedOne();
      }),
    });

    // setInterval(() => {
    //   this.debugReportPeerInfo();
    // }, 2000);
  }

  addPeer(rcPeer) {
    const wsPeer = rcPeer.getWsPeer();
    if (wsPeer) {
      this.allPeers.set(rcPeer.getWsPeer(), rcPeer);
    }
  }

  loginWithToken(rcPeer, token) {
    // const session = fakeUserManager.authenticateFromToken(data.token);
    const session = fakeUserManager.verify(token);
    if (session) {
      console.log('session.user_id :', session.user_id);
      this.userSessionCounters[session.user_id] = this.userSessionCounters[session.user_id]
        ? this.userSessionCounters[session.user_id] + 1 : 1;

      const wsSessionNumber = this.userSessionCounters[session.user_id];
      const wsSession = fakeUserManager.authenticateFromToken(token, { wsSessionNumber });

      return this.userSessionMgr.login(wsSession.user_id, wsSession.token, {
        session,
        rcPeer,
      })
      .then(() => wsSession);
    }
    return Promise.reject();
  }

  loginWithPassword(rcPeer, body) {
    const { auth_type, password, username } = body;
    return Promise.resolve(fakeUserManager.authenticate(auth_type, username, password));
  }

  get users() {
    return this.userSessionMgr.users;
  }

  mapUser(inFn) {
    const { users } = this.userSessionMgr;
    const fn = inFn || (() => {});
    return Object.keys(users).map(key => fn(key, users[key], users));
  }

  findUser(uid) {
    return this.users[uid];
  }

  peerJoinChannel(user, channelArray) {
    const result = this.chManager.join(user, channelArray);
    user.data.channelMap = this.chManager.getUserMetadata(user);
    return result;
  }

  peerLeaveChannel(user, channelArray) {
    const result = this.chManager.leave(user, channelArray);
    user.data.channelMap = this.chManager.getUserMetadata(user);
    return result;
  }

  peerLeaveAllChannel(user) {
    const result = this.chManager.leaveAll(user);
    user.data.channelMap = this.chManager.getUserMetadata(user);
    return result;
  }

  channelRemoveAllPeers(channel) {
    return this.chManager.removeAll(channel);
  }

  isPeerInChannel(user, channel) {
    return this.chManager.isInChannel(user, channel);
  }

  getPeerChannelList(user) {
    return (this.chManager.getUserMetadata(user) || []).map(value => value);
  }

  removePeer(rcPeer) {
    const wsPeer = rcPeer.getWsPeer();
    if (wsPeer) {
      this.allPeers.delete(rcPeer.getWsPeer());
    }
  }

  logout(rcPeer) {
    this.removePeer(rcPeer);
    const sessionId = rcPeer.getSessionId();
    if (sessionId) {
      // console.log('removePeer');
      return this.userSessionMgr.logout(sessionId);
    }
    return Promise.resolve();
  }

  unexpectedLogout(rcPeer) {
    console.log('unexpectedLogout');
    this.removePeer(rcPeer);
    const sessionId = rcPeer.getSessionId();
    if (sessionId) {
      return this.userSessionMgr.unexpectedLogout(sessionId, 'ConnectionLost');
    }
    return Promise.resolve();
  }

  debugReportPeerInfo() {
    console.log('================ [debug] ReportPeerInfo ================');
    console.log('================         Users          ================');
    this.allPeers.forEach((rcPeer, key, map) => {
      rcPeer.debugPrintProfile();
    });
    console.log('================        Channels        ================');
    this.chManager.debugPrintProfile();
    console.log('================ [debug] ReportPeerInfo ================');
  }
}
