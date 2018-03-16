import HeaderManager from '~/utils/HeaderManager';
import modelMap from './modelMap';

const {
  createSessionEpic,
  readSessionCollEpic,
  readUserEpic,
  createUserEpic,
} = modelMap.epics;

const {
  createWsSessionEpic,
  readWsSessionCollEpic,
} = modelMap.wsEpics;

const {
  SESSION_CREATE_SUCCESS,
  SESSION_CLEAR_START,
  USER_CREATE_START,
  USER_CREATE_SUCCESS,
} = modelMap.types;

const {
  readUser,
  createSession,
} = modelMap.actions;

const fetchMyUserDataAfterPostedSession = (action$, store) =>
  action$.ofType(SESSION_CREATE_SUCCESS)
    .mergeMap(action => {
      // console.log('action :', action);
      HeaderManager.set('Authorization', `${action.data.token_type} ${action.data.token}`);
      return [
        readUser({}, {
          userId: action.data.user_id,
        }),
      ];
    });

const clearAuthorizationHeaderAfterClearSession = (action$, store) =>
  action$.ofType(SESSION_CLEAR_START)
    .mergeMap(action => {
      HeaderManager.delete('Authorization');
      return [{ type: 'TO_NULL' }];
    });

const autologinAfterRegistration = (action$, store) =>
  action$.ofType(USER_CREATE_START)
    .switchMap((startAction) =>
      action$.ofType(USER_CREATE_SUCCESS)
        .take(1) // don't listen forever! IMPORTANT!
        .switchMap(() => {
          return [createSession(startAction.data.accountLinks[0])]; 
        })
    );

export default [
  fetchMyUserDataAfterPostedSession,
  clearAuthorizationHeaderAfterClearSession,
  autologinAfterRegistration,
  createSessionEpic,
  readSessionCollEpic,
  createWsSessionEpic,
  readWsSessionCollEpic,
  readUserEpic,
  createUserEpic,
];
