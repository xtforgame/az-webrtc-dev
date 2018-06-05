import { Observable } from 'rxjs';
import { promiseWait } from 'common/utils';
import {
  READ_TEST_API,
  CANCEL_READ_TEST_API,
} from './constants';

import {
  readTestApiSuccess,
} from './actions';
import wsProtocol from '~/utils/wsProtocol1';

export default (action$, store) => action$.ofType(READ_TEST_API)
    .mergeMap(action => Observable.fromPromise(
      // promiseWait(1000)
      promiseWait(0)
        .then(() => wsProtocol.open()
          .then(() => wsProtocol.request({
            method: 'POST',
            path: '/test-api',
            body: {
              version: '0.1.0',
            },
          })))
        .then(({ data }) => readTestApiSuccess(data.echo))
    )
      .catch((error) => {
        console.error('error :', error);
        return Observable.of({ type: 'TO_NULL', error });
      })
      .race(
        action$.filter(action => action.type === CANCEL_READ_TEST_API)
          .map(() => ({ type: 'TO_BLACK_HOLE' }))
          .take(1)
      ));
