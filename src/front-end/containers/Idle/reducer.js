import { combineReducers } from 'redux'; // TODO
import {
  UPDATE_BOT_STATUS,
} from './constants';


const botStatus = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_BOT_STATUS:
      return {
        status: action.data,
      };

    default:
      return state;
  }
};

export default combineReducers({
  botStatus,
});
