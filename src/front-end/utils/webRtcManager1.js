import WebRtcManager from './webrtc/WebRtcManager';
import wsProtocol from '~/websocket/wsProtocol1';

export default new WebRtcManager(wsProtocol);
