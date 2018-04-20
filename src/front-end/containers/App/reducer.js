import { combineReducers } from 'redux'
import {
  REMEMBER_ME,
} from './constants';
import modelMap from './modelMap';

const {
  sessionReducer,
  wsSessionReducer,
  userReducer,
} = modelMap.reducers;

const persistence = (state = { rememberUser: false }, action) => {
  switch (action.type) {

  case REMEMBER_ME:
    return {
      ...state,
      rememberUser: action.rememberUser,
    };

  default:
    return state;
  }
};

export default combineReducers({
  sessions: sessionReducer,
  wsSessions: wsSessionReducer,
  users: userReducer,
  persistence,
});
