/* eslint-disable no-console */
import DefaultWsPeer from './WsPeer';

export default class WsPeerManager<WsPeer = DefaultWsPeer> {
  wsPeerMap : Map<any, WsPeer>;
  constructor() {
    this.wsPeerMap = new Map<any, WsPeer>();
  }
}

export type WsPeerManagerType = WsPeerManager<DefaultWsPeer>;
