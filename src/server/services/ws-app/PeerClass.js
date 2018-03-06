import RicioPeer from '../../common/ricio/RicioPeer';

export default class PeerClass extends RicioPeer {
  broadcast = msg =>
    Promise.all(this.userSessionManager.mapUser((_, user) =>
      user.send(msg)
    ));

  nsBroadcast = (ns, msg) =>
    Promise.all(this.userSessionManager.mapUser((_, user) => user).filter(user => user.inNs(ns)).map(user =>
      user.send(msg)
    ));
}
