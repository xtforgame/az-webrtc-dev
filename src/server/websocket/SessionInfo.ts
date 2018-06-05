/* eslint-disable no-param-reassign, no-console */
import {
  LoggedInSessionConfig,
  LoggedInSession,
  ILoggedInSession,
} from 'login-session-mgr';
import { WsMessageConfig } from 'ricio/ws/index';
import {
  SessionUidType,
} from './common';

export default class SessionInfo<
  SessionUid = SessionUidType
> extends LoggedInSession<
  SessionUid
> implements ILoggedInSession<
  SessionUid
> {
  data : any;
  user?: any;
  constructor({
    uid,
  } : LoggedInSessionConfig<SessionUid>) {
    super({ uid });
    this.data = {};
    this.user = null;
  }
}

export type SessionInfoType = SessionInfo<SessionUidType>;
