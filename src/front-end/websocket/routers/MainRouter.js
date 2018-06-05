/* eslint-disable arrow-body-style */
import RouterBase from './RouterBase';
import {
  updateBotStatus,
} from '~/containers/Idle/actions';

// import modelMap from '~/containers/App/modelMap';
// const {
//   respondGetSession,
// } = modelMap.actions;

export default class MainRouter extends RouterBase {
  setupRoutes({ router }) {
    router.send('/*', (ctx, next) => next());

    router.send('/bot-status', (ctx, next) => {
      this.store.dispatch(updateBotStatus(ctx.local.data));
      // this.store.dispatch(respondGetSession('me', null));
      console.log('ctx.local.data :', ctx.local.data);
      return next();
    });

    router.send('/chs/:channelId?/:subType?', (ctx, next) => {
      // console.log('ctx.local.data :', ctx.local.data);
      return next();
    });
  }
}
