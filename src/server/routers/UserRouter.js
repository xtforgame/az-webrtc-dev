import {
  // RestfulResponse,
  RestfulError,
} from 'az-restful-helpers';
import RouterBase from '../core/router-base';
import fakeUserManager from '../utils/fakeUserManager';

export default class UserRouter extends RouterBase {
  setupRoutes({ router }) {
    router.get('/api/users/:userId', fakeUserManager.getIdentity, (ctx, next) => {
      // console.log('ctx.local.userSession :', ctx.local.userSession);
      if (!ctx.local.userSession || !ctx.local.exposedUser) {
        RestfulError.koaThrowWith(ctx, 404, 'User not found');
      }

      const { userId } = ctx.params;
      const currentUserId = ctx.local.userSession.user_id;
      if (currentUserId !== userId) {
        RestfulError.koaThrowWith(ctx, 403, 'Admin privilege required');
      }

      return ctx.rcResponse.send(ctx.local.exposedUser);
    });

    router.post('/api/users', (ctx) => {
      const body = ctx.request.body || {};
      const {
        name,
        privilege = 'user',
        accountLinks = [],
      } = body;

      if (!accountLinks.length) {
        ctx.throw(400, 'No accountLink provided', { expose: true });
      }

      const {
        username,
        password,
      } = accountLinks[0];

      const user = fakeUserManager.register(username, password, name, privilege);
      if (!user) {
        ctx.throw(400, 'Account id has already been taken.', { expose: true });
      }
      return ctx.rcResponse.send({
        id: user.id,
        name,
        privilege,
      });
    });

    router.patch('/api/users/:userId', fakeUserManager.getIdentity, (ctx, next) => {
      // console.log('ctx.local.userSession :', ctx.local.userSession);
      if (!ctx.local.userSession || !ctx.local.exposedUser) {
        RestfulError.koaThrowWith(ctx, 404, 'User not found');
      }

      const { userId } = ctx.params;
      const currentUserId = ctx.local.userSession.user_id;
      if (currentUserId !== userId) {
        RestfulError.koaThrowWith(ctx, 403, 'Admin privilege required');
      }

      return ctx.body = fakeUserManager.updateUserById(currentUserId, ctx.request.body);
    });
  }
}
