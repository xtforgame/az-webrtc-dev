import { getHeaders } from '~/utils/HeaderManager';
import {
  ModelMap,
  defaultExtensions,
} from 'reduxtful';

import SelectorsCreator from 'reduxtful/extensions/SelectorsCreator';
import EpicCreator from 'reduxtful/extensions/EpicCreator';
import WaitableActionsCreator from 'reduxtful/extensions/WaitableActionsCreator';
import ReduxtfulWsEpicCreator from '~/utils/ReduxtfulWsEpicCreator';

import axios from 'axios';
import { Observable } from 'rxjs';
import { createSelector } from 'reselect';
import wsProtocol from '~/utils/wsProtocol1';
import { CancelToken } from 'ricio/front-end';

const responseMiddleware = (response, info) => {
  if(response.status === 200 && response.data.error){
    // for some error carried by a 200 response
    return Promise.reject(response.data.error);
  }
  return Promise.resolve(response);
};

const epics = {
  axios,
  Observable,
  getHeaders,
  responseMiddleware,
}

const modelsDefine = {
  api: {
    url: '/api',
    names: { model: 'api', member: 'api', collection: 'apis' },
    singleton: true,
    config: {
      // actionNoRedundantBody: true,
      getId: data => 'api', // data.user_id,
    },
    extensionConfigs: {
      epics,
    },
  },
  sessions: {
    url: '/api/sessions',
    names: { model: 'session', member: 'session', collection: 'sessions' },
    config: {
      // actionNoRedundantBody: true,
      getId: data => 'me', // data.user_id,
    },
    extensionConfigs: {
      epics,
      selectors: {
        createSelector,
        baseSelector: state => state.get('global').sessions,
      },
    },
  },
  wsSessions: {
    url: '/sessions',
    names: { model: 'wsSession', member: 'wsSession', collection: 'wsSessions' },
    config: {
      // actionNoRedundantBody: true,
      getId: data => 'me', // data.user_id,
    },
    extensionConfigs: {
      wsEpics: {
        wsProtocol,
        CancelToken,
      },
      selectors: {
        baseSelector: state => state.get('global').wsSessions,
      },
    },
  },
  users: {
    url: '/api/users',
    names: { model: 'user', member: 'user', collection: 'users' },
    config: {
      // actionNoRedundantBody: true,
      getId: data => data.id,
    },
    extensionConfigs: {
      epics,
      selectors: {
        createSelector,
        baseSelector: state => state.get('global').users,
      },
    },
  },
};

const modelMap = new ModelMap('global', modelsDefine, defaultExtensions.concat([SelectorsCreator, EpicCreator, WaitableActionsCreator, ReduxtfulWsEpicCreator]));
export default modelMap;
