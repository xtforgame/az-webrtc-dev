import RouterBase from '../core/router-base';
import fakeUserManager from '../utils/fakeUserManager';

export default class SessionRouter extends RouterBase {
  setupRoutes({ router }) {
    router.post('/api/sessions', (ctx, next) => {
      const body = ctx.request.body || {};
      const { auth_type, password, username } = body;
      const session = fakeUserManager.authenticate(auth_type, username, password);
      return ctx.rcResponse.send(session || { error: 'Wrong credential' });
    });
  }
}
