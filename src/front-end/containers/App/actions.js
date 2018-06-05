import {
  GREET,
  REMEMBER_ME,
  CHANGE_THEME,
  SESSION_VERIFIED,
  USER_LOADED,
  FAIL_TO_LOAD_USER,
  WS_NEED_RECONNECT,
  REQUEST_SAVE_USER_SETTING,
  SAVE_USER_SETTINGS,
  CLEAR_SENSITIVE_DATA,
} from './constants';

export const greet = name => ({ type: GREET, name });
export const rememberMe = rememberUser => ({ type: REMEMBER_ME, rememberUser });
export const changeTheme = (uiTheme, saveToServer = true) => ({ type: CHANGE_THEME, uiTheme, saveToServer });
export const sessionVerified = session => ({ type: SESSION_VERIFIED, session });
export const userLoaded = () => ({ type: USER_LOADED });
export const failToLoadUser = error => ({ type: FAIL_TO_LOAD_USER, error });
export const wsNeedReconnect = () => ({ type: WS_NEED_RECONNECT });
export const requestSaveUserSetting = (userSettingType, data) => ({
  type: REQUEST_SAVE_USER_SETTING,
  userSettingType,
  data,
});
export const saveUserSettings = () => ({ type: SAVE_USER_SETTINGS });
export const clearSensitiveData = () => ({ type: CLEAR_SENSITIVE_DATA });
