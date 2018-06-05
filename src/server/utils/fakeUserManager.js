/* eslint-disable no-underscore-dangle */
import JwtSessionHelper from 'jwt-session-helper';
import {
  createInitialUserData,
} from '~/domain-logic';

class FakeUserManager {
  constructor() {
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
        const result = {
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
      this.register(`testUser${index}`, `testUser${index}`, `Test User ${index}`, 'user');
    }
  }

  register(username, password, name, privilege, data) {
    if (this.usernames[username]) {
      return null;
    }
    const id = `${++this.userCount}`;
    const user = createInitialUserData({
      id,
      name,
      username,
      password,
      privilege,
      data,
    }, {
      memos: [],
    });

    this.usernames[username] = user;
    this.userIdMap[id] = user;
    return user;
  }

  authenticate(auth_type, username, password, extraPayload) {
    const user = this.usernames[username];
    if (auth_type !== 'basic' || !user) {
      return null;
    }

    const session = this.jwtSessionHelper.createSession({
      ...extraPayload,
      user,
      auth_type,
    });

    return session.info;
  }

  authenticateFromToken(token, extraPayload) {
    const tokenInfo = this.verify(token);
    if (!tokenInfo) {
      return null;
    }

    const user = this.userIdMap[tokenInfo.user_id];
    if (!user) {
      return null;
    }

    const session = this.jwtSessionHelper.createSession({
      ...extraPayload,
      user,
      auth_type: tokenInfo.auth_type,
    });

    return session.info;
  }

  verify(token) {
    try {
      return this.jwtSessionHelper.verify(token);
    } catch (e) {
      return null;
    }
  }

  exposeUserData(user) {
    if (!user) {
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

  getUserById(id) {
    return this.exposeUserData(this.userIdMap[id]);
  }

  updateUserById(id, inputData = {}) {
    const user = this.userIdMap[id];
    if (!user) {
      return user;
    }

    const {
      name,
      picture,
      data,
    } = inputData;
    if (name !== undefined) {
      user.name = name;
    }
    if (picture !== undefined) {
      user.picture = picture;
    }
    if (data !== undefined) {
      user.data = data;
    }
    return this.exposeUserData(user);
  }

  updateUserPasswordById(id, password) {
    const user = this.userIdMap[id];
    if (!user) {
      return user;
    }

    user.password = password;
    user.recoveryToken = undefined;
    return this.exposeUserData(user);
  }

  getRecoveryToken(username) {
    const user = this.usernames[username];
    if (!user) {
      return user;
    }
    if (user.recoveryToken) {
      return {
        user,
        ...user.recoveryToken,
      };
    }
    return {};
  }

  updateRecoveryToken(username) {
    const user = this.usernames[username];
    if (!user) {
      return user;
    }
    const rnd = Math.random().toString();
    return user.recoveryToken = {
      token: rnd.substr(rnd.length - 7, 6),
      updatedTime: new Date().getTime(),
    };
  }

  _ensureLocal(ctx) {
    ctx.local = ctx.local || {};
  }

  _ensureUserSession(ctx) {
    this._ensureLocal(ctx);
    ctx.local = ctx.local || {};
    const { authorization = '' } = ctx.request.headers;
    const authorizationParts = authorization.split(' ');

    ctx.local.userSession = this.verify(authorizationParts[authorizationParts.length - 1]);
  }

  getIdentity = (ctx, next) => {
    this._ensureUserSession(ctx);
    if (ctx.local.userSession) {
      const currentUserId = ctx.local.userSession.user_id;
      ctx.local.user = this.userIdMap[currentUserId];
      ctx.local.exposedUser = this.getUserById(currentUserId);
    }

    return next();
  };
}

export default new FakeUserManager();
