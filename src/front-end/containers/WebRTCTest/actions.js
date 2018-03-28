import {
  READ_TEST_API,
  READ_TEST_API_SUCCESS,
  CANCEL_READ_TEST_API,
} from './constants';

export const readTestApi = () => ({ type: READ_TEST_API });
export const readTestApiSuccess = data => ({ type: READ_TEST_API_SUCCESS, data });
export const cancelReadTestApi = () => ({ type: CANCEL_READ_TEST_API });
