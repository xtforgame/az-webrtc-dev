// import { promiseWait } from 'common/utils';
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
  constructor(error) {
    this.error = error;
  }
}

export default class ReduxtfulWsSagaCreator {
  static $name = 'wsSagas';

  create({
    ns, names, url, getShared, methodConfigs,
  }, { getId = (action => action.data.id) }, extensionConfig) {
    const shared = {};
    const exposed = {};

    const {
      effects,
      wsProtocol,
      CancelToken,
      middlewares: {
        request: requestMiddlewares = [],
        response: responseMiddlewares = [],
        error: errorMiddlewares = [],
      } = {},
    } = extensionConfig;

    if (!effects || !wsProtocol) {
      return { shared, exposed };
    }

    const {
      takeEvery, call, put, race, take, /* , select */
    } = effects;

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
        return;
      }

      const sagaName = methodConfig.getSagaName(arg);
      const urlInfo = new UrlInfo(methodConfig.getUrlTemplate({ url, names }));

      const {
        respondCreator,
        respondErrorCreator,
      } = getRespondActionCreators(methodConfig);

      shared[methodConfig.name] = function* requestSaga() {
        yield takeEvery(actionTypes.start, function* foo(action) {
          const path = urlInfo.compile(action.entry);
          const { query } = action.options;
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
          // const state = yield select(s => s);
          const request = {
            method: methodConfig.method,
            path,
            headers,
            body: action.data,
          };

          const next = getMiddlewaresHandler([
            ...requestMiddlewares,
            (req, { options: { cancelToken: c } }) => wsProtocol.open()
            .then(() => wsProtocol.request(req, { cancelToken: c })),
          ],
          [request, { options: { cancelToken } }]);

          try {
            const { response, cancelSagas } = yield race({
              response: call(next),
              cancelSagas: take((cancelAction) => {
                if (cancelAction.type !== actionTypes.cancel) {
                  return false;
                }
                return urlInfo.include(cancelAction.entry, action.entry);
              }),
            });

            if (cancelSagas) {
              cancelToken.cancel('Operation canceled by the user.');
              yield put(toNull());
            } else {
              const nextHandler = getMiddlewaresHandler([
                ...responseMiddlewares,
                res => Promise.resolve(res),
              ],
              [response, { request, options: extensionConfig }]);
              const p = () => Promise.resolve()
              .then(nextHandler)
              .then(res => res || Promise.reject(new ErrorFromMiddleware(`Malformed Response: ${res}, please check you response middlewares`)))
              .catch(error => Promise.reject(new ErrorFromMiddleware(error)));

              try {
                const result = yield call(p);
                yield put(respondCreator(actions, action, getId)(result));
              } catch (error) {
                if (error instanceof ErrorFromMiddleware) {
                  throw error;
                } else {
                  const errNextHandler = getMiddlewaresHandler([
                    ...errorMiddlewares,
                    err => Promise.reject(err),
                  ],
                  [error, { request, options: extensionConfig }]);
                  const result = yield call(() => Promise.resolve()
                  .then(errNextHandler));
                  yield put(respondErrorCreator(actions, action)(result));
                }
              }
            }
          } catch (error) {
            yield put(respondErrorCreator(actions, action)(error));
          }
        });
      };
      exposed[sagaName] = shared[methodConfig.name];
    });
    return { shared, exposed };
  }
}
