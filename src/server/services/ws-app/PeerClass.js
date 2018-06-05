/* eslint-disable no-console */
import RicioPeer from 'ricio/RicioPeer';

let hashCounter = 0;

export default class PeerClass extends RicioPeer {
  constructor(...args) {
    super(...args);
    this.hash = ++hashCounter;
  }

  getUserId() {
    return this.session && this.session.user_id;
  }

  broadcast = msg => Promise.all(this.userSessionManager.mapUser((_, user) => user.send(msg)));

  channelBroadcast = (channel, msg, options = {}) => {
    if (Array.isArray(channel)) {
      return Promise.all(channel.map(ch => this.channelBroadcast(ch, msg, options)));
    }
    const {
      includeSender = false,
      filter,
    } = options;

    const channelMetadata = this.userSessionManager.chManager.getChannelMetadata(channel);
    if (!channelMetadata) {
      return Promise.reject(new Error('Channel not found'));
    }

    const me = this.getUser();
    const myUserId = me && me.uid;
    if (!myUserId) {
      return Promise.reject(new Error('User not found'));
    }

    const userFilter = filter || (includeSender ? (u => u) : (u => u.uid !== myUserId));

    return Promise.all(channelMetadata.map(u => u)
      .filter(userFilter)
      .map(user => user.send(msg)));
  };

  debugPrintProfile() {
    const user = this.getUser();
    console.log(`user: ${user ? /* user.uid */ user.data.name : '<Unauthenticated>'} (hash: ${this.hash})`);
  }
}
