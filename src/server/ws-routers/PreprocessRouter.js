import RouterBase from '../core/router-base';

export default class PreprocessRouter extends RouterBase {
  loginWithToken(ctx, token){
    return this.userSessionManager.loginWithToken(ctx.rcPeer, token)
    .then(wsSession => {
      return wsSession && {
        wsSession,
      };
    });
  }

  loginWithPassword(ctx, body){
    return this.userSessionManager.loginWithPassword(ctx.rcPeer, body)
    .then(session => {
      return session && this.loginWithToken(ctx, session.token)
      .then(result => {
        let { wsSession } = (result || {});
        return wsSession && {
          session,
          wsSession,
        };
      });
    });
  }

  setupRoutes({ router }) {
    router.connect('/', (ctx, next) => {
      console.log('connect');
      this.userSessionManager.addPeer(ctx.rcPeer);
    });

    router.post('/test-api', (ctx, next) => ctx.body.json().then((data) => {
      return ctx.rcResponse.send({
        echo: data,
      });
    }));

    router.post('/sessions', (ctx, next) => ctx.body.json().then((data) => {
      let p = null;
      if(data.token){
        p = this.loginWithToken(ctx, data.token)
      }else{
        p = this.loginWithPassword(ctx, data);
      };
      return p
      .then(sessions => {
        const {
          session,
          wsSession,
        } = sessions;

        if(!wsSession){
          return ctx.rcResponse.send({ error: 'Wrong credential' });
        }

        if(wsSession.name){
          let user = ctx.rcPeer.getUser();
          user.data.name = wsSession.name;
        }
  
        return ctx.rcResponse.send(sessions);
      });
    }));

    router.get('/users', (ctx, next) => {
      let users = this.userSessionManager.mapUser((_, {uid, data: {name = 'noname', isBusy = false}}) => ({
        uid,
        name,
        isBusy,
      }));
      console.log('users :', users);

      return ctx.rcResponse.send(users);
    });

    router.send('/logout', (ctx, next) => {
      this.userSessionManager.logout(ctx.rcPeer);
      try{
        ctx.rcPeer.getWsPeer().close(4000);
      }catch(e){
        console.log('e :', e);
      }
    });

    router.send('/debug/unexpectedLogout', (ctx, next) => {
      this.userSessionManager.unexpectedLogout(ctx.rcPeer);
      try{
        ctx.rcPeer.getWsPeer().close(4001);
      }catch(e){
        console.log('e :', e);
      }
    });

    router.error('/', (ctx, next) => {
      // console.log('ctx.peerInfo.error :', ctx.peerInfo.error);
      return next();
    });

    router.close('/', (ctx, next) => {
      console.log('close');
      console.log('ctx.peerInfo.code :', ctx.peerInfo.code);
      // console.log('ctx.peerInfo.reason :', ctx.peerInfo.reason);
      if((ctx.peerInfo.code >= 1002 && ctx.peerInfo.code <= 1005) || ctx.peerInfo.code === 4001){
        this.userSessionManager.unexpectedLogout(ctx.rcPeer);
      }else{
        this.userSessionManager.logout(ctx.rcPeer);
      }
      return next();
    });
  }
}
