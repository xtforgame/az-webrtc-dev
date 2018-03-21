import { Observable } from 'rxjs';
import {
  READ_TEST_API,
  CANCEL_READ_TEST_API,
} from './constants';

import {
  readTestApiSuccess,
} from './actions';
import wsProtocol from '~/utils/wsProtocol1';
import { promiseWait } from 'common/utils';

export default (action$, store) => {
  return action$.ofType(READ_TEST_API)
    .mergeMap(action =>
      Observable.fromPromise(
        //promiseWait(1000)
        promiseWait(0)
        .then(() =>
          wsProtocol.open()
          .then(() => wsProtocol.request({
            method: 'POST',
            path: '/test-api',
            body: {
              version: '0.1.0',
            },
          }))
        )
        .then(({ data }) => {
          return readTestApiSuccess(data.echo);
        })
      )
      .catch(error => {
        console.log('error :', error);
        return Observable.of(actions.error({ error }))
      })
      .race(
        action$.filter(action => {
          // Filter can check more conditions for canceling
          return action.type === CANCEL_READ_TEST_API;
        })
          .map(() => {
            // should use cancel action here instead
            return { type: 'TO_BLACK_HOLE' };
          })
          .take(1)
      )
    );
};
