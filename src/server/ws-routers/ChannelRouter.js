/* eslint-disable no-console */
import RouterBase from '../core/router-base';

export default class ChannelRouter extends RouterBase {
  handleJoinChannels(ctx, channels) {
    const user = ctx.rcPeer.getUser();
    if (!user) {
      return;
    }
    user.joinChannel(channels);

    // this.userSessionManager.getPeerChannelList(user);
    channels.forEach((channelId) => {
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

  handleLeaveChannels(ctx, channels) {
    const user = ctx.rcPeer.getUser();
    if (!user) {
      return;
    }
    // this.userSessionManager.getPeerChannelList(user);
    channels.forEach((channelId) => {
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

    user.leaveChannel(channels);
    channels.forEach((channelId) => {
      if (channelId !== 'lobby') {
        this.userSessionManager.channelRemoveAllPeers(channelId);
      }
    });
  }

  setupRoutes({ router }) {
    router.post('/joined-channels', (ctx, next) => ctx.body.json().then((data) => {
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

    router.delete('/joined-channels', (ctx, next) => ctx.body.json().then((data) => {
      const user = ctx.rcPeer.getUser();
      if (!user) {
        return ctx.rcResponse.throw(401);
      }

      this.handleLeaveChannels(ctx, data);

      return ctx.rcResponse.send({
        result: 'good',
      });
    }));

    router.send('/chs/:channelId/msgs', (ctx, next) => ctx.body.json().then((data) => {
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

    router.error('/', (ctx, next) => next());

    router.close('/', (ctx, next) => {
      const user = ctx.rcPeer.getUser();
      if (!user) {
        return next();
      }
      this.handleLeaveChannels(ctx, this.userSessionManager.getPeerChannelList(user));
      return next();
    });
  }
}
