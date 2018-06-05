/* eslint-disable no-console */
import { UserSessionManager } from 'login-session-mgr';
import RicioPeer, { IRcPeerManager, IRcPeer } from 'ricio/RicioPeer';
import { IWsPeer, IWsPeerManager, EmptyWsPeerManager } from 'ricio/WsPeer';

import {
  SessionUidType,
  UserUidType,
  ChannelUidType,
} from '~/websocket/common';
import SessionInfo, { SessionInfoType } from './SessionInfo';
import UserInfo, { UserInfoType } from './UserInfo';
import ChannelManager from './ChannelManager';

import WsPeer from './WsPeer';
import WsPeerManager from './WsPeerManager';

let hashCounter = 0;

export interface IRcPeerEx<WsPeer extends IWsPeer, WsPeerManager extends IWsPeerManager<WsPeer>> extends IRcPeer<WsPeer, WsPeerManager> {
  getSessionId() : SessionUidType | null;
  debugPrintProfile() : void;
}

export interface IRcPeerExClass {
  new <WsPeer extends IWsPeer, WsPeerManager extends IWsPeerManager<WsPeer>>(...args : any[]): IRcPeerEx<WsPeer, WsPeerManager>;
}

export default class PeerClass<WsPeer extends IWsPeer, WsPeerManager extends IWsPeerManager<WsPeer>>
  extends RicioPeer<WsPeer, WsPeerManager>
{
  hash : number;
  rawSession : any;
  sessionId : SessionUidType | null;
  session : SessionInfo<SessionUidType> | null;

  constructor(rcPeerManager: IRcPeerManager<WsPeer, WsPeerManager>, option: any) {
    super(rcPeerManager, option);
    this.hash = ++hashCounter;

    this.sessionId = null;
    this.session = null;
  }

  getRawSession() {
    return this.rawSession;
  }

  getSessionId() : SessionUidType | null {
    return this.sessionId;
  }

  getSession() : SessionInfoType | null {
    return this.session;
  }

  setSession(session : SessionInfo<SessionUidType>) {
    this.session = session;
    this.sessionId = session.uid;
    this.rawSession = session.data.session;
  }

  getUser() : UserInfoType | null {
    return this.session && <UserInfoType>this.session.user;
  }

  getUserId() : UserUidType {
    return this.rawSession && this.rawSession.user_id;
  }

  broadcast = (msg : any) => Promise.all(
    (<any>this.rcPeerManager).gusm.mapUser(((user : any) => user.send(msg)))
  )

  getChannelManager = () => <ChannelManager<ChannelUidType, UserUidType, UserInfo>>(<any>this.rcPeerManager).gusm.chManager;

  channelBroadcast = (channelUid : ChannelUidType, msg : any, options : any = {}) : any => {
    if (Array.isArray(channelUid)) {
      return Promise.all(channelUid.map(ch => this.channelBroadcast(ch, msg, options)));
    }
    const {
      includeSender = false,
      filter,
    } = options;

    const channelMetadata = this.getChannelManager().getChannelMetadata(channelUid);
    if (!channelMetadata) {
      return Promise.reject(new Error('Channel not found'));
    }

    const myUserId = this.getUserId();
    if (!myUserId) {
      return Promise.reject(new Error('User not found'));
    }

    const userFilter = filter || (includeSender ? ((u : any) => u) : ((u : any) => u.uid !== myUserId));

    return Promise.all(channelMetadata.map((u : any) => u)
      .filter(userFilter)
      .map((user : any) => user.send(msg)));
  };

  debugPrintProfile() {
    const user = this.getUser();
    console.log(`user: ${user ? /* user.uid */ user.data.name : '<Unauthenticated>'} (hash: ${this.hash})`);
  }
}

export type PeerClassType = PeerClass<WsPeer, WsPeerManager<WsPeer>>;
