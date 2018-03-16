class ChannelMetadata {
  constructor() {
    this.users = new Map();
  }

  add(user){
    return this.users.set(user.uid, user);
  }

  get length(){
    return Object.keys(this.users).length;
  }

  map(callback, thisArg){
    const result = [];
    this.users.forEach((...args) => {
      result.push(callback(...args));
    }, thisArg);
    return result;
  }

  forEach(...args){
    return this.users.forEach(...args);
  }

  remove(user){
    return this.users.delete(user.uid);
  }
}

class UserMetadata {
  constructor() {
    this.channels = new Set();
  }

  get length(){
    return this.channels.size;
  }

  map(callback, thisArg){
    const result = [];
    this.channels.forEach((...args) => {
      result.push(callback(...args));
    }, thisArg);
    return result;
  }

  forEach(...args){
    return this.channels.forEach(...args);
  }

  join(channel){
    this.channels.add(channel);
  }

  leave(channel){
    return this.channels.delete(channel);
  }

  clear(){
    return this.channels.clear();
  }
}


export default class ChannelManager {
  constructor() {
    this.channelMap = {};
    this.userMap = {};
  }

  join(user, channelArray){
    if(Array.isArray(channelArray)){
      return channelArray.map(channel => this.join(user, channel));
    }
    const channel = channelArray;
    if(!this.channelMap[channel]){
      this.channelMap[channel] = new ChannelMetadata();
    }
    this.channelMap[channel].add(user);

    if(!this.userMap[user.uid]){
      this.userMap[user.uid] = new UserMetadata();
    }
    this.userMap[user.uid].join(channel);
  }

  leave(user, channelArray){
    if(Array.isArray(channelArray)){
      return channelArray.map(channel => this.join(user, channel));
    }
    const channel = channelArray;
    if(this.channelMap[channel]){
      this.channelMap[channel].remove(user);
    }

    if(this.userMap[user.uid]){
      this.userMap[user.uid].leave(channel);
    }
  }

  isInChannel(user, channel){
    let userMetadata = this.userMap[user.uid];
    if(!userMetadata){
      return false;
    }
    return userMetadata.channels.has(channel);
  }

  leaveAll(user){
    let userMetadata = this.userMap[user.uid];
    if(userMetadata){
      userMetadata.forEach(channel => {
        this.leave(user, channel);
      });
      userMetadata.clear();
    }
  }

  getUserMetadata(user){
    return this.userMap[user.uid] = this.userMap[user.uid] || new UserMetadata();
  }

  getChannelMetadata(channel){
    return this.channelMap[channel] = this.channelMap[channel] || new ChannelMetadata();
  }
}

