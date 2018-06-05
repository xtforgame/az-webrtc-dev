import { EventEmitter } from 'events';
import { wssPort } from 'common/config';
import WsProtocol from '~/websocket/WsProtocol';

const wsProtocol = new WsProtocol(`wss://${window.location.hostname}:${wssPort}/`, EventEmitter, {
  reconnection: true,
  reconnectionDelay: 1,
  reconnectionAttempts: 15,
});
export default wsProtocol;
