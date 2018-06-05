import { EventEmitter } from 'events';
import { wssPort } from 'common/core/config';
import WsProtocol from '~/utils/WsProtocol';

const wsProtocol = new WsProtocol(`wss://${window.location.hostname}:${wssPort}/`, EventEmitter, {
  reconnection: true,
  reconnectionDelay: 1,
  reconnectionAttempts: 15,
});
export default wsProtocol;
