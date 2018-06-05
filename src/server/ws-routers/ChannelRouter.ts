/* eslint-disable no-console */
import { AzWsMsgBody } from 'ricio/ws';
import { GenericUserSessionManagerType } from '~/services/user-manager/GenericUserSessionManager';
import {
  WsCtx,
} from '~/websocket/index';
import RouterBase from './RouterBase';

export default class ChannelRouter extends RouterBase {
  handleJoinChannels(ctx : WsCtx, channelUids : string[]) {
    const user = ctx.rcPeer.getUser();
    if (!user) {
      return;
    }
    user.joinChannel(channelUids);

    // this.gusm.getPeerChannelList(user);
    channelUids.forEach((channelId) => {
      ctx.rcPeer.channelBroadcast(channelId, {
        path: `/chs/${channelId}/user-joined`,
        body: {
          sender: {
            id: user.uid,
            name: user.data.name,
          },
          payload: {},
        },
      }/* , { includeSender: true } */)
      .catch((e) => {});
    });
  }

  handleLeaveChannels(ctx : WsCtx, channelUids : string[]) {
    const user = ctx.rcPeer.getUser();
    if (!user) {
      return;
    }
    // this.gusm.getPeerChannelList(user);
    channelUids.forEach((channelId) => {
      console.log('channelId :', channelId);
      ctx.rcPeer.channelBroadcast(channelId, {
        path: `/chs/${channelId}/user-left`,
        body: {
          sender: {
            id: user.uid,
            name: user.data.name,
          },
          payload: {},
        },
      }/* , { includeSender: true } */)
      .catch((e) => {});
    });

    user.leaveChannel(channelUids);
  }

  setupRoutes({ router }) {
    router.post('/joined-channels', (ctx : WsCtx, next) => (<AzWsMsgBody>ctx.body).json().then((data) => {
      const user = ctx.rcPeer.getUser();
      if (!user) {
        return ctx.rcResponse.throw(401);
      }
      // console.log('user :', user);

      this.handleJoinChannels(ctx, data);

      return ctx.rcResponse.send({
        result: 'good',
      });
    }));

    router.delete('/joined-channels', (ctx : WsCtx, next) => (<AzWsMsgBody>ctx.body).json().then((data) => {
      const user = ctx.rcPeer.getUser();
      if (!user) {
        return ctx.rcResponse.throw(401);
      }

      this.handleLeaveChannels(ctx, data);

      return ctx.rcResponse.send({
        result: 'good',
      });
    }));

    router.send('/chs/:channelId/msgs', (ctx : WsCtx, next) => (<AzWsMsgBody>ctx.body).json().then((data) => {
      const user = ctx.rcPeer.getUser();
      if (!user) {
        return ctx.rcResponse.throw(401);
      }
      console.log('ctx.params.channelId :', ctx.params.channelId);

      // ctx.rcPeer.send({
      //   path: `/chs/${ctx.params.channelId}/msgs`,
      //   body: {
      //     sender: {
      //       id: user.uid,
      //       name: user.data.name,
      //     },
      //     payload: {},
      //   },
      // });
      return ctx.rcPeer.channelBroadcast(ctx.params.channelId, {
        path: `/chs/${ctx.params.channelId}/msgs`,
        body: {
          sender: {
            id: user.uid,
            name: user.data.name,
          },
          payload: {},
        },
      });

      // ctx.rcPeer.getWsPeer().emit('error', new Error('foo'));
      // ctx.rcPeer.getWsPeer().close(1002, 'xxxx');
    }));

    router.error('/', (ctx : WsCtx, next) => next());

    router.close('/', (ctx : WsCtx, next) => {
      const user = ctx.rcPeer.getUser();
      if (!user) {
        return next();
      }
      if (user.sessionMap.size === 1) {
        // this is the last one session, leave all channels
        this.handleLeaveChannels(ctx, this.gusm.getPeerChannelList(user));
      }
      return next();
    });

    router.post('/sessions', (ctx, next) => ctx.body.json().then((data) => {
      const user = ctx.rcPeer.getUser();
      if (!user) {
        return ctx.rcResponse.throw(401);
      }

      const rooms = ['lobby'];
      return this.handleJoinChannels(ctx, rooms.map(room => `room:${room}`));
    }));
  }
}
