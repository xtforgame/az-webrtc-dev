// // [TODO] remove this line
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export default class RicioPeer {
  constructor(userSessionManager, option) {
    if(!option.protocol) {
      throw new Error('<RicioPeer>: No option.protocol provided.');
    }
    this.protocol = option.protocol;
    this.api = option.protocol.api;
    this.userSessionManager = userSessionManager;
  }

  send = msg => {
    console.log('this.protocol :', this.protocol.type);
    return this.protocol.api.send(msg)
      .catch(e => {
        console.log('e :', e);
      });
  }

  getUserId(){
    return this.session && this.session.userid;
  }

  getWsPeer(){
    return this.api.wsPeer;
  }

  getSession(){
    return this.session;
  }

  getSessionId(){
    return this.sessionId;
  }

  setSession(managedSession){
    this.managedSession = managedSession;
    this.sessionId = managedSession.uid;
    this.session = managedSession.data.session;
  }

  getUser(){
    return this.managedSession && this.managedSession.user;
  }
}
