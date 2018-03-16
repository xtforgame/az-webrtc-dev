import RouterBase from '../core/router-base';
import {
  RestfulResponse,
  RestfulError,
} from 'az-restful-helpers';
import fakeUserManager from '../utils/fakeUserManager';

export default class UserRouter extends RouterBase {
  setupRoutes({ router }) {
    router.get('/api/users/:userId', (ctx, next) => {
      // console.log('ctx.local.userSession :', ctx.local.userSession);
      const { authorization = '' } = ctx.request.headers;
      const { userId } = ctx.params;
      const authorizationParts = authorization.split(' ');
      const session = fakeUserManager.verify(authorizationParts[authorizationParts.length - 1]);

      if(!session){
        ctx.throw(404);
      }

      const currentUserId = session.user_id;
      if(currentUserId !== userId){
        ctx.throw(403);
      }

      const exposedUser = fakeUserManager.getUserById(currentUserId);
      if(!exposedUser){
        ctx.throw(404);
      }

      return ctx.rcResponse.send(exposedUser);
    });

    router.post('/api/users', (ctx) => {
      const body = ctx.request.body || {};
      const {
        name,
        privilege = 'user',
        accountLinks = [],
      } = body;

      if(!accountLinks.length){
        ctx.throw(400, 'No accountLink provided', { expose: true });
      }

      const {
        username,
        password,
      } = accountLinks[0];

      const user = fakeUserManager.register(username, password, name, privilege);
      if(!user){
        ctx.throw(400, 'Account id has already been taken.', { expose: true });
      }
      return ctx.rcResponse.send({
        id: user.id,
        name,
        privilege,
      });
    });
  }
}
