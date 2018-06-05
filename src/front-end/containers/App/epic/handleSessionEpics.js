import { Observable } from 'rxjs/Observable';
import HeaderManager from '~/utils/HeaderManager';
import wsProtocol from '~/utils/wsProtocol1';
import {
  getStore,
} from '~/configureStore';
import modelMap from '../modelMap';
import {
  SESSION_VERIFIED,
} from '../constants';

import {
  sessionVerified,
  userLoaded,
  failToLoadUser,
  wsNeedReconnect,
  clearSensitiveData,
  changeTheme,
} from '../actions';

const { types } = modelMap;

const {
  getUser,
  getUserSettings,
  postSessions,

  postWsSessions,
} = modelMap.waitableActions;

wsProtocol.nativeEvents.addListener('close', (e) => {
  const store = getStore();
  store.dispatch(wsNeedReconnect());
  // console.log('close :', e);
});


const dispatchSessionVerifiedAfterPostedSession = (action$, store) => action$.ofType(types.respondPostSessions)
    .mergeMap(action => [
      sessionVerified(action.data),
    ]);

const postWsSessionAfterPostedSession = (action$, store) => action$.ofType(SESSION_VERIFIED)
.mergeMap((action) => {
  HeaderManager.set('Authorization', `${action.session.token_type} ${action.session.token}`);
  return [
    postWsSessions({
      token: action.session.token,
    }),
  ];
});

const fetchDataAfterSessionVerified = (action$, store) => action$.ofType(types.respondPostWsSessions)
    .mergeMap(action => Observable.combineLatest(
      Observable.fromPromise(store.dispatch(getUser(action.data.wsSession.user_id))),
      Observable.fromPromise(store.dispatch(getUserSettings()))
    )
      .mergeMap(([_, action]) => action.data
        .filter(setting => setting.type === 'preference' && setting.data)
        .map(setting => changeTheme(setting.data.uiTheme, false))
        .concat([userLoaded()]))
      .catch((error) => {
        console.error('fetch data failed :', error);
        return [failToLoadUser(error)];
      }));

const clearAuthorizationHeaderAfterClearSession = (action$, store) => action$.ofType(types.clearSessionCache)
    .mergeMap((action) => {
      HeaderManager.delete('Authorization');
      return Observable.combineLatest(
        Observable.fromPromise(wsProtocol.logout())
      )
      .mergeMap(([_, action]) => (
        [
          clearSensitiveData(),
        ]
      ));
    });

const autologinAfterRegistration = (action$, store) => action$.ofType(types.postUsers)
    .switchMap(startAction => action$.ofType(types.respondPostUsers)
        .take(1) // don't listen forever! IMPORTANT!
        .switchMap(() => [postSessions(startAction.data.accountLinks[0])]));

export default [
  dispatchSessionVerifiedAfterPostedSession,
  postWsSessionAfterPostedSession,
  fetchDataAfterSessionVerified,
  clearAuthorizationHeaderAfterClearSession,
  autologinAfterRegistration,
];
