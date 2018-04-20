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

export default class ReduxtfulWsEpicCreator {
  static $name = 'wsEpics';

  create({ ns, names, url, getShared, methodConfigs }, { getId = (action => action.data.id) }, extensionConfig){
    let shared = {};
    let exposed = {};

    const {
      wsProtocol,
      CancelToken,
      responseMiddleware = (response, info, error) => ({}),
    } = extensionConfig;

    methodConfigs.forEach(methodConfig => {
      if(methodConfig.supportedActions.length <= 1){
        return ;
      }
      let actionTypes = getShared(ActionTypesCreator.$name)[methodConfig.name];
      let actions = getShared(ActionsCreator.$name)[methodConfig.name];
      // console.log('actionTypes :', actionTypes);
      // console.log('actions :', actions);

      let arg = {
        methodName: methodConfig.name,
        names,
      };

      if(!methodConfig.getEpicName || !methodConfig.getUrlTemplate){
        return { shared, exposed };
      }

      const epicName = methodConfig.getEpicName(arg);
      const urlInfo = new UrlInfo(methodConfig.getUrlTemplate({url, names}));

      const {
        respondCreator,
        respondErrorCreator,
      } = getRespondActionCreators(methodConfig);

      shared[methodConfig.name] = (action$, store) => {
        return action$.ofType(actionTypes.start)
          .mergeMap(action => {
            const url = urlInfo.compile(action.entry);
            let cancelToken = CancelToken && new CancelToken();
            if(!cancelToken){
              cancelToken = {
                cancel: () => {},
              }
            }

            const request = {
              method: methodConfig.method,
              path: url,
              // headers: getHeaders(),
              body: action.data,
            };
            return Observable.fromPromise(
              //promiseWait(1000)
              promiseWait(0)
              .then(() =>
                wsProtocol.open()
                .then(() => wsProtocol.request(request, { cancelToken }))
              )
              // .then(({ data }) => {
              //   // console.log('data :', data);
              //   return data;
              // })
              .catch((error) => {
                if(error.response){
                  let result = responseMiddleware(error.response, { request }, error);
                  if(result){
                    return Promise.resolve(result);
                  }
                }
                return Promise.reject(error);
              })
            )
            .map(respondCreator(actions, action, getId))
            .catch(error => Observable.of(respondErrorCreator(actions, action)))
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
          })/*
          .mergeMap(action => {
            console.log('action :', action);
            return [action];
          })*/;
      };
      exposed[epicName] = shared[methodConfig.name];
    });
    return { shared, exposed };
  }
}
