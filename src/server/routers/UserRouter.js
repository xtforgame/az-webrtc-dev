import RouterBase from '../core/router-base';
import {
  RestfulResponse,
  RestfulError,
} from 'az-restful-helpers';
import fakeUserManager from './fakeUserManager';

export default class UserRouter extends RouterBase {
  setupRoutes({ router }) {
    router.get('/api/users/:userId', (ctx, next) => {
      // console.log('ctx.local.userSession :', ctx.local.userSession);
      const { authorization = '' } = ctx.request.headers;
      const { userId } = ctx.params;
      const tokens = authorization.split(' ');
      const currentUserName = tokens[tokens.length - 1].replace('FakeToken', '');
      const exposedUser = fakeUserManager.getUserByName(currentUserName);

      if(!exposedUser){
        ctx.throw(404);
      }
      if(exposedUser.id !== userId){
        ctx.throw(403);
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
