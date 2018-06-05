/* eslint-disable no-console */
import { AzWsMsgBody } from 'ricio/ws';
import { GenericUserSessionManagerType } from '~/services/user-manager/GenericUserSessionManager';
import {
  WsCtx,
} from '~/websocket/index';
import RouterBase from './RouterBase';

export interface HttpAndWsSessionData {
  session?: any;
  wsSession?: any;
}

export default class PreprocessRouter extends RouterBase {
  loginWithToken = (ctx : WsCtx, token) : Promise<HttpAndWsSessionData | null> => {
    return this.gusm.loginWithToken(ctx.rcPeer, token)
    .then(wsSession => wsSession && {
      wsSession,
    });
  }

  loginWithPassword = (ctx : WsCtx, body) : Promise<HttpAndWsSessionData | null> => {
    return this.gusm.loginWithPassword(ctx.rcPeer, body)
    .then(session => session && this.loginWithToken(ctx, session.token)
      .then((result) => {
        const { wsSession = null } = (result || {});
        return wsSession && {
          session,
          wsSession,
        };
      }));
  }

  setupRoutes({ router }) {
    router.connect('/', (ctx : WsCtx, next) => {
      console.log('connect');
      this.gusm.addPeer(ctx.rcPeer);
    });

    router.post('/test-api', (ctx : WsCtx, next) => (<AzWsMsgBody>ctx.body).json().then(data => ctx.rcResponse.send({
      echo: data,
    })));

    router.post('/sessions', (ctx : WsCtx, next) => (<AzWsMsgBody>ctx.body).json().then((data) => {
      let p : Promise<any> = Promise.resolve();
      if (data.token) {
        p = p = p.then(() => this.loginWithToken(ctx, data.token));
      } else {
        p = p = p.then(() => this.loginWithPassword(ctx, data));
      }
      return p
      .then((sessions) => {
        if (!sessions) {
          return ctx.rcResponse.send({ error: 'Wrong credential' });
        }
        const {
          // session,
          wsSession,
        } = sessions;

        if (!wsSession) {
          return ctx.rcResponse.send({ error: 'Wrong credential' });
        }

        if (wsSession.name) {
          const user = ctx.rcPeer.getUser();
          if (user) {
            user.data.name = wsSession.name;
          }
        }

        return ctx.rcResponse.send(sessions);
      });
    }));

    router.get('/users', (ctx : WsCtx, next) => {
      const users = this.gusm.mapUser(({ uid, data: { name = 'noname', isBusy = false } }) => ({
        uid,
        name,
        isBusy,
      }));
      console.log('users :', users);

      return ctx.rcResponse.send(users);
    });

    router.send('/logout', (ctx : WsCtx, next) => {
      this.gusm.logout(ctx.rcPeer);
      try {
        ctx.rcPeer.getWsPeer().close(4000);
      } catch (e) {
        console.log('e :', e);
      }
    });

    router.send('/debug/unexpectedLogout', (ctx : WsCtx, next) => {
      this.gusm.unexpectedLogout(ctx.rcPeer);
      try {
        ctx.rcPeer.getWsPeer().close(4001);
      } catch (e) {
        console.log('e :', e);
      }
    });

    router.error('/', (ctx : WsCtx, next) => next());

    router.close('/', (ctx : WsCtx, next) => {
      console.log('close');
      console.log('ctx.peerInfo.code :', ctx.peerInfo.code);
      // console.log('ctx.peerInfo.reason :', ctx.peerInfo.reason);
      if ((ctx.peerInfo.code >= 1002 && ctx.peerInfo.code <= 1005) || ctx.peerInfo.code === 4001) {
        this.gusm.unexpectedLogout(ctx.rcPeer);
      } else {
        this.gusm.logout(ctx.rcPeer);
      }
      return next();
    });
  }
}
