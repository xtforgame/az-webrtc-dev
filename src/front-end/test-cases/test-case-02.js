import axios from 'axios';
import { promiseWait } from 'common/utils';
import wsProtocol1 from './utils/wsProtocol1';
import wsProtocol2 from './utils/wsProtocol2';

let expect = chai.expect;

const login = (wsProtocol, key) => {
  let r = {
    method: 'post',
    url: '/api/sessions',
    data: {
      auth_type: 'basic',
      username: key,
      password: key,
    },
  };
  return axios(r)
  .then(({ data }) => {
    return wsProtocol.login(data.token_type, data.token);
  });
};

const login1 = () => login(wsProtocol1, 'testUser1');
const login2 = () => login(wsProtocol2, 'testUser2');

const logout1 = () => wsProtocol1.logout();
const logout2 = () => wsProtocol2.logout();

const loginWithPassword = (wsProtocol, key) => {
  return wsProtocol.loginWithPassword(key, key);
};

const loginWithPassword1 = () => loginWithPassword(wsProtocol1, 'testUser1');
const loginWithPassword2 = () => loginWithPassword(wsProtocol2, 'testUser2');


function testCase() {
  describe('Basic', function() {
    this.timeout(20000);
    it('wsProtocol1', () => {
      return login1()
      .then(() => logout1());
    });

    it('login with token', () => {
      return login1()
      .then(() => {
        return login2()
      })
      .then(() => {
        return wsProtocol1.joinChannels(['ssssss', 's', 'qq']);
      })
      .then(() => {
        return wsProtocol1.sendChannelMessage('s');
      })
      .then(() => {
        return wsProtocol2.joinChannels(['ssssss', 's', 'qq']);
      })
      .then(() => {
        return wsProtocol2.sendChannelMessage('s');
      })
      .then(() => {
        return logout2()
      })
      .then(() => {
        return promiseWait(1000);
      })
      .then(() => logout1());
    });

    it('login with password', () => {
      return loginWithPassword1()
      .then(() => {
        return loginWithPassword2()
      })
      .then(() => {
        return wsProtocol1.joinChannels(['ssssss', 's', 'qq']);
      })
      .then(() => {
        return wsProtocol1.sendChannelMessage('s');
      })
      .then(() => {
        return wsProtocol2.joinChannels(['ssssss', 's', 'qq']);
      })
      .then(() => {
        return wsProtocol2.sendChannelMessage('s');
      })
      .then(() => {
        return logout2()
      })
      .then(() => {
        return promiseWait(1000);
      })
      .then(() => logout1());
    });

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
