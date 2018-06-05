/* eslint-disable no-console */
import { AzWsMessageCtx } from 'ricio/ws/server/api';
import { PeerClassType } from './PeerClass';

export type WsCtx = AzWsMessageCtx<PeerClassType>;
