import { Observable } from 'rxjs';
import { promiseWait } from 'common/utils';
import {
  ActionTypesCreator,
  ActionsCreator,
  UrlInfo,
} from 'reduxtful';
import {
  toNull,
  getRespondActionCreators,
} from 'reduxtful/core/helper-functions';

import getMiddlewaresHandler from 'reduxtful/core/getMiddlewaresHandler';
import qs from 'qs';

class ErrorFromMiddleware {
  constructor(error){
    this.error = error;
  }
}

export default class ReduxtfulWsEpicCreator {
  static $name = 'wsEpics';

  create({ ns, names, url, getShared, methodConfigs }, { getId = (action => action.data.id) }, extensionConfig) {
    const shared = {};
    const exposed = {};

    const {
      wsProtocol,
      CancelToken,
      middlewares: {
        request: requestMiddlewares = [],
        response: responseMiddlewares = [],
        error: errorMiddlewares = [],
      } = {},
    } = extensionConfig;

    methodConfigs.forEach((methodConfig) => {
      if (methodConfig.supportedActions.length <= 1) {
        return;
      }
      const actionTypes = getShared(ActionTypesCreator.$name)[methodConfig.name];
      const actions = getShared(ActionsCreator.$name)[methodConfig.name];
      // console.log('actionTypes :', actionTypes);
      // console.log('actions :', actions);

      const arg = {
        methodName: methodConfig.name,
        names,
      };

      if (!methodConfig.getSagaName || !methodConfig.getUrlTemplate) {
        return { shared, exposed };
      }

      const epicName = methodConfig.getEpicName(arg);
      const urlInfo = new UrlInfo(methodConfig.getUrlTemplate({ url, names }));

      const {
        respondCreator,
        respondErrorCreator,
      } = getRespondActionCreators(methodConfig);

      shared[methodConfig.name] = (action$, store) => {
        return action$.ofType(actionTypes.start)
          .mergeMap(action => {
            const url = urlInfo.compile(action.entry);
            const query = action.options.query;
            const headers = {};
            if (query) {
              headers.query = qs.stringify(query);
            }
            let cancelToken = CancelToken && new CancelToken();
            if (!cancelToken) {
              cancelToken = {
                cancel: () => {},
              };
            }
            const request = {
              method: methodConfig.method,
              path: url,
              headers,
              body: action.data,
            };
            return Observable.fromPromise(
              //promiseWait(1000)
              Promise.resolve()
              .then(() => {
                const next = getMiddlewaresHandler([
                  ...requestMiddlewares,
                  (request, { options: { cancelToken } }) => wsProtocol.open()
                  .then(() => wsProtocol.request(request, { cancelToken })),
                ],
                [request, { options: { cancelToken } }]);
                return next();
              })
              .then(response => {
                const next = getMiddlewaresHandler([
                  ...responseMiddlewares,
                  response => Promise.resolve(response),
                ],
                [response, { request, options: extensionConfig }]);
                return Promise.resolve()
                .then(next)
                .then(response => response || Promise.reject(new ErrorFromMiddleware(`Malformed Response: ${response}, please check you response middlewares`)))
                .catch(error => Promise.reject(new ErrorFromMiddleware(error)));
              })
              .catch((error) => {
                if(error instanceof ErrorFromMiddleware){
                  return Promise.reject(error.error);
                }
                const next = getMiddlewaresHandler([
                  ...errorMiddlewares,
                  error => Promise.reject(error),
                ],
                [error, { request, options: extensionConfig }]);
                return Promise.resolve()
                .then(next);
              })
            )
            .map(respondCreator(actions, action, getId))
            .catch(error => Observable.of(respondErrorCreator(actions, action)(error)))
            .race(
              action$.filter(cancelAction => {
                if(cancelAction.type !== actionTypes.cancel){
                  return false;
                }
                return urlInfo.include(cancelAction.entry, action.entry);
              })
                .map(cancelAction => {
                  cancelToken.cancel('Operation canceled by the user.');
                  return toNull();
                })
                .take(1)
            )
          });
      };
      exposed[epicName] = shared[methodConfig.name];
    });
    return { shared, exposed };
  }
}
