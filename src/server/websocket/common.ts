/* eslint-disable no-param-reassign, no-console */
// import {
//   DefaultUserUid,
//   DefaultSessionUid,
// } from 'login-session-mgr';
export { WsMessageConfig } from 'ricio/ws/index';

// export type UserUidType = DefaultUserUid;
// export type SessionUidType = DefaultSessionUid;

export type UserUidType = string | number | Symbol;
export type SessionUidType = string | number | Symbol;

export type ChannelUidType = string | number | Symbol;
