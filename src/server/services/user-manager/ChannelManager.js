/* eslint-disable no-underscore-dangle, no-console */
class ChannelMetadata {
  constructor(options = {}) {
    this.users = new Map();
    this.autoDestroy = options.autoDestroy;

    // For custom data
    this._data = {};
  }

  setData(k, v) {
    this._data[k] = v;
  }

  getData(k) {
    if (k === undefined) {
      return this._data;
    }
    return this._data[k];
  }

  deleteData(k) {
    const v = this._data[k];
    delete this._data[k];
    return v;
  }

  clearData(k) {
    this._data = {};
  }

  add(user) {
    return this.users.set(user.uid, user);
  }

  get length() {
    return this.users.size;
  }

  map(callback, thisArg) {
    const result = [];
    this.users.forEach((...args) => {
      result.push(callback(...args));
    }, thisArg);
    return result;
  }

  forEach(...args) {
    return this.users.forEach(...args);
  }

  remove(user) {
    return this.users.delete(user.uid);
  }
}

class UserMetadata {
  constructor() {
    this.channels = new Set();
  }

  get length() {
    return this.channels.size;
  }

  map(callback, thisArg) {
    const result = [];
    this.channels.forEach((...args) => {
      result.push(callback(...args));
    }, thisArg);
    return result;
  }

  forEach(...args) {
    return this.channels.forEach(...args);
  }

  join(channel) {
    this.channels.add(channel);
  }

  leave(channel) {
    return this.channels.delete(channel);
  }

  clear() {
    return this.channels.clear();
  }
}


export default class ChannelManager {
  constructor() {
    this.channelMap = {};
    this.userMap = {};
  }

  join(user, channelArray, options = {}) {
    if (Array.isArray(channelArray)) {
      return channelArray.map(channel => this.join(user, channel, options));
    }
    const channel = channelArray;
    const {
      autoDestroy = true,
    } = options;

    if (!this.channelMap[channel]) {
      this.channelMap[channel] = new ChannelMetadata({ autoDestroy });
    }
    this.channelMap[channel].add(user);

    if (!this.userMap[user.uid]) {
      this.userMap[user.uid] = new UserMetadata();
    }
    this.userMap[user.uid].join(channel);

    return this.channelMap[channel];
  }

  leave(user, channelArray) {
    if (Array.isArray(channelArray)) {
      return channelArray.map(channel => this.leave(user, channel));
    }
    const channel = channelArray;
    if (this.channelMap[channel]) {
      this.channelMap[channel].remove(user);
      if (this.channelMap[channel].autoDestroy && !this.channelMap[channel].length) {
        delete this.channelMap[channel];
      }
    }

    if (this.userMap[user.uid]) {
      this.userMap[user.uid].leave(channel);
    }

    return this.channelMap[channel];
  }

  isInChannel(user, channel) {
    const userMetadata = this.userMap[user.uid];
    if (!userMetadata) {
      return false;
    }
    return userMetadata.channels.has(channel);
  }

  leaveAll(user) {
    const userMetadata = this.userMap[user.uid];
    let retval = [];
    if (userMetadata) {
      retval = userMetadata.forEach((channel) => {
        this.leave(user, channel);
      });
      userMetadata.clear();
    }
    return retval;
  }

  removeAll(channel) {
    const channelMetadata = this.channelMap[channel];
    if (!channelMetadata) {
      return channelMetadata;
    }
    channelMetadata.map(user => this.leave(user, channel));
    return channelMetadata;
  }

  getUserMetadata(user) {
    return this.userMap[user.uid] = this.userMap[user.uid] || new UserMetadata();
  }

  getChannelMetadata(channel) {
    return this.channelMap[channel] = this.channelMap[channel];
  }

  debugPrintProfile(indent = '') {
    Object.keys(this.channelMap).forEach((key) => {
      const room = this.channelMap[key];
      if (!room) {
        return;
      }
      console.log('Room :', key);
      const users = [];
      room.users.forEach(u => users.push(u));
      console.log(' users :', users.map(u => `${u.data.name || ''}(id:${u.uid})`).join(', '));
    });
  }
}
