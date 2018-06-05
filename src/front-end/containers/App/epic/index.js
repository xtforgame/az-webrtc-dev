import modelMap from '../modelMap';
import handleSessionEpics from './handleSessionEpics';
import handleUserSettingsEpics from './handleUserSettingsEpics';

const {
  postSessionsEpic,
  getSessionsEpic,
  getUserEpic,
  postUsersEpic,
  patchUserEpic,
  postRecoveryTokensEpic,

  getUserSettingsEpic,
  patchUserSettingEpic,

  postChallengeRecoveryTokensEpic,
  postResetPasswordRequestsEpic,

  getMemosEpic,
  postMemosEpic,
  patchMemoEpic,
} = modelMap.epics;

const {
  postWsSessionsEpic,
  getWsSessionsEpic,
} = modelMap.wsEpics;

export default [
  ...handleSessionEpics,
  ...handleUserSettingsEpics,

  postSessionsEpic,
  getSessionsEpic,
  getUserEpic,
  postUsersEpic,
  patchUserEpic,

  postRecoveryTokensEpic,

  getUserSettingsEpic,
  patchUserSettingEpic,

  postChallengeRecoveryTokensEpic,
  postResetPasswordRequestsEpic,

  getMemosEpic,
  postMemosEpic,
  patchMemoEpic,

  postWsSessionsEpic,
  getWsSessionsEpic,
];
