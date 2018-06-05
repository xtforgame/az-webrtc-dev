/* eslint-disable no-underscore-dangle, no-console */
export interface ChannelUser<UserUid> {
  uid : UserUid;
  data : any;
}

export interface ChannelMetadataOption {
  autoDestroy? : boolean;
}

export class ChannelMetadata<UserUid, UserInfo extends ChannelUser<UserUid>> {
  userMap : Map<UserUid, UserInfo>;
  autoDestroy : boolean;
  _data : any;

  constructor(options : ChannelMetadataOption = {}) {
    this.userMap = new Map<UserUid, UserInfo>();
    this.autoDestroy = !!options.autoDestroy;

    // For custom data
    this._data = {};
  }

  setData(k : any, v : any) {
    this._data[k] = v;
  }

  getData(k : any) {
    if (k === undefined) {
      return this._data;
    }
    return this._data[k];
  }

  deleteData(k : any) {
    const v = this._data[k];
    delete this._data[k];
    return v;
  }

  clearData() {
    this._data = {};
  }

  add(user : UserInfo) {
    return this.userMap.set(user.uid, user);
  }

  get length() {
    return this.userMap.size;
  }

  map(
    inFn : (
      user: UserInfo,
      userUid : UserUid,
      map : Map<UserUid, UserInfo>,
    ) => any,
  ) : any[] {
    const fn = inFn || (() => {});
    const result : any[] = [];
    this.userMap.forEach((user, userUid, map) => {
      result.push(fn(user, userUid, map));
    });
    return result;
  }

  forEach(
    inFn : (
      user: UserInfo,
      userUid : UserUid,
      map : Map<UserUid, UserInfo>,
    ) => any,
  ) : any {
    return this.userMap.forEach(inFn);
  }

  remove(user: UserInfo) {
    return this.userMap.delete(user.uid);
  }
}

export class UserMetadata<UserUid, UserInfo extends ChannelUser<UserUid>, ChannelUid> {
  channelSet : Set<ChannelUid>;

  constructor() {
    this.channelSet = new Set<ChannelUid>();
  }

  get length() {
    return this.channelSet.size;
  }

  map(
    inFn : (
      channelUid: ChannelUid,
      channelUidK: ChannelUid,
      set : Set<ChannelUid>,
    ) => any,
  ) : any[] {
    const fn = inFn || (() => {});
    const result : any[] = [];
    this.channelSet.forEach((channelUid, channelUidK, set) => {
      result.push(fn(channelUid, channelUidK, set));
    });
    return result;
  }

  forEach(
    inFn : (
      channelUid: ChannelUid,
      channelUidK: ChannelUid,
      set : Set<ChannelUid>,
    ) => any,
  ) : any {
    return this.channelSet.forEach(inFn);
  }

  join(channelUid : ChannelUid) {
    this.channelSet.add(channelUid);
  }

  leave(channelUid : ChannelUid) {
    return this.channelSet.delete(channelUid);
  }

  clear() {
    return this.channelSet.clear();
  }
}

export default class ChannelManager<ChannelUid, UserUid, UserInfo extends ChannelUser<UserUid>> {
  channelMap : Map<ChannelUid, ChannelMetadata<UserUid, UserInfo>>;
  userMap : Map<UserUid, UserMetadata<UserUid, UserInfo, ChannelUid>>;

  constructor() {
    this.channelMap = new Map<ChannelUid, ChannelMetadata<UserUid, UserInfo>>();
    this.userMap = new Map<UserUid, UserMetadata<UserUid, UserInfo, ChannelUid>>();
  }

  join(user : UserInfo, channelUidArray : ChannelUid | ChannelUid[], options : ChannelMetadataOption = {}) : ChannelMetadata<UserUid, UserInfo> | ChannelMetadata<UserUid, UserInfo>[] {
    if (Array.isArray(channelUidArray)) {
      return <ChannelMetadata<UserUid, UserInfo>[]>channelUidArray.map(channelUid => this.join(user, channelUid, options));
    }
    const channelUid = channelUidArray;
    let channelMetadata = this.channelMap.get(channelUid);

    if (!channelMetadata) {
      channelMetadata = new ChannelMetadata<UserUid, UserInfo>(options);
      this.channelMap.set(channelUid, channelMetadata);
    }
    channelMetadata.add(user);

    let userMetadata = this.userMap.get(user.uid);
    if (!userMetadata) {
      userMetadata = new UserMetadata<UserUid, UserInfo, ChannelUid>();
      this.userMap.set(user.uid, userMetadata);
    }
    userMetadata.join(<ChannelUid>channelUid);

    return channelMetadata;
  }

  leave(user : UserInfo, channelUidArray : ChannelUid | ChannelUid[]) : ChannelMetadata<UserUid, UserInfo> | void | Array<ChannelMetadata<UserUid, UserInfo>[] | void> {
    if (Array.isArray(channelUidArray)) {
      return <Array<ChannelMetadata<UserUid, UserInfo>[] | void>>channelUidArray.map(channelUid => this.leave(user, channelUid));
    }
    const channelUid = channelUidArray;
    const channelMetadata = this.channelMap.get(channelUid);

    if (channelMetadata) {
      channelMetadata.remove(user);
      if (channelMetadata.autoDestroy && !channelMetadata.length) {
        this.channelMap.delete(channelUid);
      }
    }

    const userMetadata = this.userMap.get(user.uid);
    if (userMetadata) {
      userMetadata.leave(channelUid);
    }

    return channelMetadata;
  }

  isInChannel(user : UserInfo, channelUid : ChannelUid) {
    const userMetadata = this.userMap.get(user.uid);
    if (!userMetadata) {
      return false;
    }
    return userMetadata.channelSet.has(channelUid);
  }

  leaveAll(user : UserInfo) {
    const userMetadata = this.userMap.get(user.uid);
    let retval = [];
    if (userMetadata) {
      retval = userMetadata.forEach((_, channelUid) => {
        this.leave(user, channelUid);
      });
      userMetadata.clear();
    }
    return retval;
  }

  removeAll(channelUid : ChannelUid) {
    const channelMetadata = this.channelMap.get(channelUid);
    if (!channelMetadata) {
      return channelMetadata;
    }
    channelMetadata.map(user => this.leave(user, channelUid));
    return channelMetadata;
  }

  getUserMetadata(user : UserInfo) {
    let userMetadata = this.userMap.get(user.uid);
    if (userMetadata) {
      return userMetadata;
    }
    userMetadata = new UserMetadata();
    this.userMap.set(user.uid, userMetadata);
    return userMetadata;
  }

  getChannelMetadata(channelUid : ChannelUid) {
    return this.channelMap.get(channelUid);
  }

  debugPrintProfile(indent = '') {
    this.channelMap.forEach((channel) => {
      if (!channel) {
        return;
      }
      console.log('Room :', channel);
      const users : UserInfo[] = [];
      channel.map(u => users.push(u));
      console.log(' users :', users.map(u => `${u.data.name || ''}(id:${u.uid})`).join(', '));
    });
  }
}
