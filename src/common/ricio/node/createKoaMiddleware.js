import { AzWsMessage } from '../ws';
import RicioPeer from '../RicioPeer';
import axios from 'axios';

function createContext(ctx, rcPeer) {
  ctx.rcPeer = rcPeer;
  ctx.rcResponse = {
    send: (msg) => {
      ctx.body = msg;
    },
    throw: (statusCode, message, optioins) => {
      ctx.throw(statusCode, message, optioins);
    },
  };
  return ctx;
}

export default (userSessionManager, PeerClass = RicioPeer) => (ctx, next) => {
  let {
    'x-ricio-webhook-url': webhookUrl = 'https://httpbin.org/post',
  } = ctx.request.headers
  const rcPeer = new PeerClass(userSessionManager, {
    protocol: {
      type: 'http',
      api: {
        send: (msg) => {
          return axios({
            method: 'post',
            url: webhookUrl,
            data: msg.body,
          })
          .then(res => res.data);
        },
      },
    },
  });

  createContext(ctx, rcPeer);

  return next();
}
