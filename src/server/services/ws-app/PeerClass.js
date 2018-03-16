import RicioPeer from 'ricio/RicioPeer';

export default class PeerClass extends RicioPeer {
  getUserId(){
    return this.session && this.session.user_id;
  }

  broadcast = msg =>
    Promise.all(this.userSessionManager.mapUser((_, user) =>
      user.send(msg)
    ));

  channelBroadcast = (channel, msg, options = {}) => {
    if(Array.isArray(channel)){
      return channel.map(ch => this.channelBroadcast(ch, msg, options));
    }
    let {
      includeSender = false,
      filter,
    } = options;

    const channelMetadata = this.userSessionManager.chManager.getChannelMetadata(channel);
    if(!channelMetadata){
      return Promise.reject('Channel not found');
    }

    const me = this.getUser();
    const myUserId = me && me.uid;
    if(!myUserId){
      return Promise.reject('User not found');
    }

    const userFilter = filter || (includeSender ? (u => u) : (u => u.uid !== myUserId));

    return channelMetadata.map(u => u)
      .filter(userFilter)
      .map(user => user.send(msg));
  };
}
