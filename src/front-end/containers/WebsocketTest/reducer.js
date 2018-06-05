import {
  // READ_TEST_API,
  READ_TEST_API_SUCCESS,
} from './constants';

export default (state = {}, action) => {
  switch (action.type) {
    case READ_TEST_API_SUCCESS:
      return {
        data: { ...action.data },
      };

    default:
      return state;
  }
};
