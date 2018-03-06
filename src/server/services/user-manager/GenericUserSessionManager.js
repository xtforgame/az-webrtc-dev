import { LoggedInUser, UserSessionManager } from 'login-session-mgr';

export class UserInfo extends LoggedInUser {
  constructor({
    uid,
    data = {},
    sessions = {},
  }) {
    super({uid, data, sessions});
    this.data.nsMap = {};
  }

  get userSessionManager(){
    return this.data.userSessionManager;
  }

  mapSession(inFn){
    let sessions = this.sessions;
    // console.log('sessions :', sessions);
    let fn = inFn || (() => {});
    return Object.keys(sessions).map(key => {
      return fn(key, sessions[key], sessions);
    });
  };

  send(msg){
    return this.mapSession((_, session, sessions) =>
      session.data.rcPeer.send(msg)
    );
  }

  joinNs(ns){
    return this.userSessionManager.peerJoinNs(this, ns);
  }

  leaveNs(ns){
    return this.userSessionManager.peerLeaveNs(this, ns);
  }

  inNs(ns){
    console.log('ns, this.data.nsMap :', ns, this.data.nsMap);
    return !!this.data.nsMap[ns];
  }
}

export default class GenericUserSessionManager {
  constructor(resrcMgr) {
    this.resrcMgr = resrcMgr;
    this.nsMap = {};
    this.allPeers = new Map();
    this.userSessionMgr = new UserSessionManager({
      UserInfoClass: UserInfo,
      onSessionLoggedIn: (newSession => {
        // console.log('=================== newSession :', newSession);
        newSession.data.rcPeer.setSession(newSession);
      }),
      onUserLoggedIn: (newUser => {
        newUser.data.userSessionManager = this;
        // console.log('=================== newUser :', newUser);
      }),
      onSessionLoggedOut: ((existedSession, reason) => {
      }),
      onUserLoggedOut: (existedUser => {
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
  }

  addPeer(rcPeer) {
    let wsPeer = rcPeer.getWsPeer();
    if(wsPeer){
      this.allPeers.set(rcPeer.getWsPeer(), rcPeer);
    }
  }

  loginSession(rcPeer, token) {
    const session = this.resrcMgr.verifyToken(token);
    if (session) {
      console.log('session.userid :', session.userid);

      return this.userSessionMgr.login(session.userid, token, {
        session,
        rcPeer,
      })
      .then(() => session);
    }
    return Promise.reject();
  }

  get users(){
    return this.userSessionMgr.users;
  }

  mapUser(inFn){
    let users = this.userSessionMgr.users;
    let fn = inFn || (() => {});
    return Object.keys(users).map(key => {
      return fn(key, users[key], users);
    });
  }

  findUser(uid){
    return this.users[uid];
  }

  peerJoinNs(user, ns){
    user.data.nsMap[ns] = true;
    this.nsMap[user.uid] = user;
    return true;
  }

  peerLeaveNs(user, ns){
    delete user.data.nsMap[ns];
    delete this.nsMap[user.uid];
    return true;
  }

  removePeer(rcPeer) {
    let wsPeer = rcPeer.getWsPeer();
    if(wsPeer){
      this.allPeers.delete(rcPeer.getWsPeer());
    }
  }

  logout(rcPeer) {
    console.log('removePeer');
    this.removePeer(rcPeer);
    let sessionId = rcPeer.getSessionId();
    if(sessionId){
      return this.userSessionMgr.logout(sessionId);
    }
    return Promise.resolve();
  }

  unexpectedLogout(rcPeer) {
    console.log('unexpectedLogout');
    this.removePeer(rcPeer);
    let sessionId = rcPeer.getSessionId();
    if(sessionId){
      return this.userSessionMgr.unexpectedLogout(sessionId, 'ConnectionLost');
    }
    return Promise.resolve();
  }
}
