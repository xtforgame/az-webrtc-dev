/* eslint-disable import/prefer-default-export */
import {
  UPDATE_BOT_STATUS,
} from './constants';

export const updateBotStatus = data => ({ type: UPDATE_BOT_STATUS, data });
