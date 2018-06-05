/* eslint-disable no-nested-ternary */
import { Observable } from 'rxjs/Observable';
import HeaderManager from '~/utils/HeaderManager';
import wsProtocol from '~/websocket/wsProtocol1';
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

  getOrganizations,
  getProjects,
  postWsSessions,
} = modelMap.waitableActions;

const {
  selectOrganizationPath,
} = modelMap.actions;

wsProtocol.nativeEvents.addListener('close', (e) => {
  const store = getStore();
  store.dispatch(wsNeedReconnect());
  // console.log('close :', e);
});


const dispatchSessionVerifiedAfterPostedSession = (action$, store) => action$.ofType(types.respondPostSessions)
  .mergeMap(action => [
    sessionVerified(action.data),
  ]);

const autoSelectDefaultOrganization = (organizations) => {
  let array = organizations.filter(org => org.name === 'default');
  array = array.length ? array : (organizations[0] ? [organizations[0]] : []);
  return array.map(org => selectOrganizationPath(org.id));
};

const postWsSessionAfterPostedSession = (action$, store) => action$.ofType(SESSION_VERIFIED)
.mergeMap((action) => {
  HeaderManager.set('Authorization', `${action.session.token_type} ${action.session.token}`);
  return [
    postWsSessions({
      token: action.session.token,
    }),
  ];
});

const fetchDataAfterSessionVerified = (action$, store) => action$.ofType(SESSION_VERIFIED)
  .mergeMap((action) => {
    HeaderManager.set('Authorization', `${action.session.token_type} ${action.session.token}`);
    return Observable.fromPromise(
      Promise.all([
        store.dispatch(getUser(action.session.user_id)),
        store.dispatch(getUserSettings()),
        store.dispatch(getOrganizations()),
        store.dispatch(getProjects()),
      ])
      .then(
        ([_, { data: userSettings }, { data: organizations }]) => userSettings
        .filter(setting => setting.type === 'preference' && setting.data)
        .map(setting => changeTheme(setting.data.uiTheme, false))
        .concat(autoSelectDefaultOrganization(organizations))
      )
    )
    .mergeMap(result => result.concat([userLoaded()]))
    .catch((error) => {
      console.error('fetch data failed :', error);
      return [failToLoadUser(error)];
    });
  });

const clearAuthorizationHeaderAfterClearSession = (action$, store) => action$.ofType(types.clearSessionCache)
  .mergeMap((action) => {
    HeaderManager.delete('Authorization');
    return [
      clearSensitiveData(),
    ];
  });

const autologinAfterRegistration = (action$, store) => action$.ofType(types.postUsers)
  .switchMap(
    startAction => action$.ofType(types.respondPostUsers)
    .take(1) // don't listen forever! IMPORTANT!
    .switchMap(() => [postSessions(startAction.data.accountLinks[0])])
  );

export default [
  dispatchSessionVerifiedAfterPostedSession,
  postWsSessionAfterPostedSession,
  fetchDataAfterSessionVerified,
  clearAuthorizationHeaderAfterClearSession,
  autologinAfterRegistration,
];
