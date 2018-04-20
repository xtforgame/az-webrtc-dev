import HeaderManager from '~/utils/HeaderManager';
import modelMap from './modelMap';

const {
  postSessionsEpic,
  getSessionsEpic,
  getUserEpic,
  postUsersEpic,
} = modelMap.epics;

const types = modelMap.types;

const {
  postWsSessionsEpic,
  getWsSessionsEpic,
} = modelMap.wsEpics;

const {
  getUser,
  postSessions,
} = modelMap.actions;

const fetchMyUserDataAfterPostedSession = (action$, store) =>
  action$.ofType(types.respondPostSessions)
    .mergeMap(action => {
      // console.log('action :', action);
      HeaderManager.set('Authorization', `${action.data.token_type} ${action.data.token}`);
      return [
        getUser(action.data.user_id),
      ];
    });

const clearAuthorizationHeaderAfterClearSession = (action$, store) =>
  action$.ofType(types.clearSessionCache)
    .mergeMap(action => {
      HeaderManager.delete('Authorization');
      return [{ type: 'TO_NULL' }];
    });

const autologinAfterRegistration = (action$, store) =>
  action$.ofType(types.postUsers)
    .switchMap((startAction) =>
      action$.ofType(types.respondPostUsers)
        .take(1) // don't listen forever! IMPORTANT!
        .switchMap(() => {
          return [postSessions(startAction.data.accountLinks[0])]; 
        })
    );

export default [
  fetchMyUserDataAfterPostedSession,
  clearAuthorizationHeaderAfterClearSession,
  autologinAfterRegistration,
  postSessionsEpic,
  getSessionsEpic,
  getUserEpic,
  postUsersEpic,
  postWsSessionsEpic,
  getWsSessionsEpic,
];
