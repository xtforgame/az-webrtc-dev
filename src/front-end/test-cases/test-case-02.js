import axios from 'axios';
import { promiseWait } from 'common/utils';
import wsProtocol1 from './utils/wsProtocol1';
import wsProtocol2 from './utils/wsProtocol2';

// const { expect } = chai;

const login = (wsProtocol, key) => {
  const r = {
    method: 'post',
    url: '/api/sessions',
    data: {
      auth_type: 'basic',
      username: key,
      password: key,
    },
  };
  return axios(r)
  .then(({ data }) => wsProtocol.login(data.token_type, data.token));
};

const login1 = () => login(wsProtocol1, 'testUser1');
const login2 = () => login(wsProtocol2, 'testUser2');

const logout1 = () => wsProtocol1.logout();
const logout2 = () => wsProtocol2.logout();

const loginWithPassword = (wsProtocol, key) => wsProtocol.loginWithPassword(key, key);

const loginWithPassword1 = () => loginWithPassword(wsProtocol1, 'testUser1');
const loginWithPassword2 = () => loginWithPassword(wsProtocol2, 'testUser2');


function testCase() {
  describe('Basic', function () {
    this.timeout(20000);
    it('wsProtocol1', () => login1()
      .then(() => logout1()));

    it('login with token', () => login1()
      .then(() => login2())
      .then(() => wsProtocol1.joinChannels(['ssssss', 's', 'qq']))
      .then(() => wsProtocol1.sendChannelMessage('s'))
      .then(() => wsProtocol2.joinChannels(['ssssss', 's', 'qq']))
      .then(() => wsProtocol2.sendChannelMessage('s'))
      .then(() => logout2())
      .then(() => promiseWait(3000))
      .then(() => promiseWait(1000))
      .then(() => logout1()));

    it('login with password', () => loginWithPassword1()
      .then(() => loginWithPassword2())
      .then(() => wsProtocol1.joinChannels(['ssssss', 's', 'qq']))
      .then(() => wsProtocol1.sendChannelMessage('s'))
      .then(() => wsProtocol2.joinChannels(['ssssss', 's', 'qq']))
      .then(() => wsProtocol2.sendChannelMessage('s'))
      .then(() => promiseWait(3000))
      .then(() => logout2())
      .then(() => promiseWait(1000))
      .then(() => logout1()));

    // it('wsProtocol1', () => {
    //   let request = {
    //     path: '/debug/unexpectedLogout',
    //   };
    //   let cb = (...args) => {
    //     console.log('...args :', ...args);
    //     wsProtocol1.wsPeer.unlistenNative('close', cb);
    //   }
    //   wsProtocol1.wsPeer.listenNative('close', cb);

    //   return wsProtocol1.open()
    //   .then(() => wsProtocol1.send(request))
    //   .then(res => {
    //     console.log('res :', res);
    //   })
    //   .catch(e => {
    //     console.log('e :', e);
    //   });
    // });
  });
}

export default testCase;
