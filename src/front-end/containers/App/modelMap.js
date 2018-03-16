import { getHeaders } from '~/utils/HeaderManager';
import ModelMap from '~/utils/rest-model/ModelMap';
import wsProtocol from '~/utils/wsProtocol1';
import { CancelToken } from 'ricio/front-end';

const responseMiddleware = (response, info) => {
  if(response.status === 200 && response.data.error){
    // for some error carried by a 200 response
    return Promise.reject(response.data.error);
  }
  return Promise.resolve(response);
};

const modelsDefine = {
  api: {
    url: '/api',
    names: { singular: 'api', plural: 'apis' },
    singleton: true,
    extensionConfigs: {
      epics: {
        getHeaders,
        responseMiddleware,
      },
    },
  },
  sessions: {
    url: '/api/sessions',
    names: { singular: 'session', plural: 'sessions' },
    extensionConfigs: {
      epics: {
        getHeaders,
        responseMiddleware,
      },
      selectors: {
        baseSelector: state => state.get('global').sessions,
      },
      reducers: {
        getId: action => 'me', // action.data.user_id,
      },
    },
  },
  wsSessions: {
    url: '/sessions',
    names: { singular: 'wsSession', plural: 'wsSessions' },
    extensionConfigs: {
      wsEpics: {
        wsProtocol,
        CancelToken,
      },
      selectors: {
        baseSelector: state => state.get('global').wsSessions,
      },
      reducers: {
        getId: action => 'me', // action.data.user_id,
      },
    },
  },
  users: {
    url: '/api/users',
    names: { singular: 'user', plural: 'users' },
    extensionConfigs: {
      epics: {
        getHeaders,
        responseMiddleware,
      },
      selectors: {
        baseSelector: state => state.get('global').users,
      },
      reducers: {
        getId: action => action.data.id,
      },
    },
  },
};

const modelMap = new ModelMap('global', modelsDefine);
export default modelMap;
