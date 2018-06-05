/* eslint-disable no-param-reassign, no-console */
import {
  IRcPeerEx,
  PeerClassType,

  WsPeer,
  WsPeerManager,

  GenericUserSessionManager as GUSM,
} from '~/websocket/index';
import fakeUserManager from '../../utils/fakeUserManager';

export default class GenericUserSessionManager<PeerClass extends IRcPeerEx<WsPeer, WsPeerManager<WsPeer>> = PeerClassType>
  extends GUSM<PeerClass>
{
  constructor() {
    super();
  }

  loginWithToken(rcPeer : PeerClass, token : any) {
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

  loginWithPassword(rcPeer : PeerClass, body : any) {
    const { auth_type, password, username } = body;
    return Promise.resolve(fakeUserManager.authenticate(auth_type, username, password));
  }
}

export type GenericUserSessionManagerType = GenericUserSessionManager<PeerClassType>;
