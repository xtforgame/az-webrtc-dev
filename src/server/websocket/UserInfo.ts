/* eslint-disable no-param-reassign, no-console */
import {
  LoggedInUser,
  LoggedInUserConfig,
  LoggedInSession,
  ILoggedInSession,
  ILoggedInUser,
} from 'login-session-mgr';
import { WsMessageConfig } from 'ricio/ws/index';
import {
  UserUidType,
  SessionUidType,
} from './common';
import RealSessionInfo, { SessionInfoType } from './SessionInfo';

export default class UserInfo<
  UserUid = UserUidType,
  SessionUid = SessionUidType,
  SessionInfo = LoggedInSession<SessionUid>
> extends LoggedInUser<
  UserUid,
  SessionUid,
  SessionInfo
> implements ILoggedInUser<
  SessionInfo,
  UserUid,
  SessionUid
> {
  data : any;
  constructor({
    uid,
  } : LoggedInUserConfig<UserUid>) {
    super({ uid });
    this.data = {};
    this.data.channelMap = null;
  }

  get gusm() {
    return this.data.gusm;
  }

  castSession(s : SessionInfo) : RealSessionInfo {
    return <RealSessionInfo><any>s;
  }

  mapSession(
    inFn : (
      session: SessionInfo,
      sessionUid : SessionUid,
      map : Map<SessionUid, SessionInfo>,
    ) => any,
  ) : any[] {
    const fn = inFn || (() => {});
    const result : any[] = [];
    this.sessionMap.forEach((session, sessionUid, map) => {
      result.push(fn(session, sessionUid, map));
    });
    return result;
  }

  send(msg : WsMessageConfig) {
    return this.mapSession(session => this.castSession(session).data.rcPeer.send(msg));
  }

  joinChannel(channelArray : any) {
    return this.gusm.peerJoinChannel(this, channelArray);
  }

  leaveChannel(channelArray : any) {
    return this.gusm.peerLeaveChannel(this, channelArray);
  }

  inChannel(channel : any) {
    return this.gusm.isPeerInChannel(this, channel);
  }
}

export type UserInfoType = UserInfo<UserUidType, SessionUidType, SessionInfoType>;
