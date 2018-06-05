import modelMap from '../modelMap';
import handleSessionEpics from './handleSessionEpics';
import handleUserSettingsEpics from './handleUserSettingsEpics';
import handleDomainLogic from './handleDomainLogic';

export default [
  ...handleSessionEpics,
  ...handleUserSettingsEpics,
  ...handleDomainLogic,

  ...Object.values(modelMap.epics),
  ...Object.values(modelMap.wsEpics),
];
