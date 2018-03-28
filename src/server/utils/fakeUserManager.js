import JwtSessionHelper from 'jwt-session-helper';
import drawIcon from '~/utils/drawIcon';

class FakeUserManager {
  constructor(){
    this.userCount = 0;
    this.usernames = {};
    this.userIdMap = {};

    this.jwtSessionHelper = new JwtSessionHelper('secret', {
      defaults: {
        algorithm: 'HS256',
      },
      signDefaults: {
        issuer: 'localhost',
        expiresIn: '1y',
      },
      parsePayload: ({ user, auth_type, ...rest }) => ({
        user_id: user.id,
        user_name: user.name,
        auth_type,
        privilege: user.privilege,
        subject: `user:${user.id}:${rest.wsSessionNumber || 0}`,
        token_type: 'Bearer',
        ...rest,
      }),
      exposeInfo: (originalData, payload) => {
        let result = {
          ...payload,
        };
        delete result.auth_type;
        return result;
      },
    });

    this.register('admin@foo.bar', 'admin', '宗麟', 'admin', {
      bio: 'I should write my bio here but I don\'t even understand what I\'m writing, just putting lots of words here.',
      email: 'admin@foo.bar',
    });
    for (let index = 1; index <= 10; index++) {
      this.register(`t${index}@foo.bar`, `t${index}`, `Test User ${index}`, 'user');
    }
  }

  register(username, password, name, privilege, data){
    if(this.usernames[username]){
      return null;
    }
    const id = `${++this.userCount}`;
    const user = {
      id,
      name,
      username,
      password,
      privilege,
      picture: `data:png;base64,${drawIcon(username).toString('base64')}`,
      data: data || {
        bio: `I'm ${name}`,
        email: null,
      },
    };

    this.usernames[username] = user;
    this.userIdMap[id] = user;
    return user;
  }

  authenticate(auth_type, username, password, extraPayload){
    const user = this.usernames[username];
    if(auth_type !== 'basic' || !user){
      return null;
    }

    let session = this.jwtSessionHelper.createSession({
      ...extraPayload,
      user,
      auth_type,
    });

    return session.info;
  }

  authenticateFromToken(token, extraPayload){
    const tokenInfo = this.verify(token);
    if(!tokenInfo){
      return null;
    }

    const user = this.userIdMap[tokenInfo.user_id];
    if(!user){
      return null;
    }

    let session = this.jwtSessionHelper.createSession({
      ...extraPayload,
      user,
      auth_type: tokenInfo.auth_type,
    });

    return session.info;
  }

  verify(token){
    try{
      return this.jwtSessionHelper.verify(token);
    }catch(e){
      return null;
    }
  }

  _exposeUserData(user){
    if(!user){
      return null;
    }
    const {
      id,
      name,
      username,
      privilege,
      picture,
      data,
    } = user;
    return {
      id,
      name,
      username,
      privilege,
      picture,
      data,
    };
  }

  getUserById(id){
    return this._exposeUserData(this.userIdMap[id]);
  }

  updateUserById(id, inputData = {}){
    let user = this.userIdMap[id];
    if(!user){
      return user;
    }

    const {
      name,
      picture,
      data,
    } = inputData;
    if(name !== undefined){
      user.name = name;
    }
    if(picture !== undefined){
      user.picture = picture;
    }
    if(data !== undefined){
      user.data = data;
    }
    return this._exposeUserData(user);
  }

  updateUserPasswordById(id, password){
    let user = this.userIdMap[id];
    if(!user){
      return user;
    }

    user.password = password;
    user.recoveryToken = undefined;
    return this._exposeUserData(user);
  }

  getRecoveryToken(username){
    const user = this.usernames[username];
    if(!user){
      return user;
    }
    if(user.recoveryToken){
      return {
        user,
        ...user.recoveryToken,
      };
    }
    return {};
  }

  updateRecoveryToken(username){
    const user = this.usernames[username];
    if(!user){
      return user;
    }
    const rnd = Math.random().toString();
    return user.recoveryToken = {
      token: rnd.substr(rnd.length - 7, 6),
      updatedTime: new Date().getTime(),
    };
  }
}

export default new FakeUserManager();
