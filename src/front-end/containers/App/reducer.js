import { combineReducers } from 'redux';
import {
  REMEMBER_ME,
  CHANGE_THEME,
} from './constants';
import modelMap from './modelMap';

const {
  sessionReducer,
  wsSessionReducer,
  userReducer,
  recoveryTokenReducer,

  challengeRecoveryTokenReducer,
  resetPasswordRequestReducer,
} = modelMap.reducers;

const persistence = (state = { rememberUser: false }, action) => {
  switch (action.type) {
  case REMEMBER_ME:
    return {
      ...state,
      rememberUser: action.rememberUser,
    };

  case CHANGE_THEME:
    return {
      ...state,
      uiTheme: action.uiTheme,
    };

  default:
    return state;
  }
};

export default combineReducers({
  sessions: sessionReducer,
  wsSessions: wsSessionReducer,
  users: userReducer,
  recoveryTokens: recoveryTokenReducer,
  challengeRecoveryTokens: challengeRecoveryTokenReducer,
  resetPasswordRequests: resetPasswordRequestReducer,
  persistence,
});
