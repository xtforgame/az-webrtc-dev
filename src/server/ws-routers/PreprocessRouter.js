import RouterBase from '../core/router-base';

export default class PreprocessRouter extends RouterBase {
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
      return this.userSessionManager.loginSession(ctx.rcPeer, data.token)
      .then(session => {
        if(data.name){
          let user = ctx.rcPeer.getUser();
          user.data.name = data.name;
        }
        
        return ctx.rcResponse.send({
          session,
        });
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

    router.error('/', (ctx, next) => {
      this.userSessionManager.unexpectedLogout(ctx.rcPeer);
    });

    router.close('/', (ctx, next) => {
      this.userSessionManager.logout(ctx.rcPeer);
    });
  }
}
