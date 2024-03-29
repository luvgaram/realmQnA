'use strict';

const credentials = require('./credentials.js');
const Realm = require('realm');

module.exports = () => {
  const username = credentials.user;
  const password = credentials.password;
  const serverUrl = credentials.server;
  const questServerUrl = credentials.questserver;

  const QuestionSchema = {
    name: 'Question',
    primaryKey: 'id',
    properties: {
      id: 'int',
      status: { type: 'bool', default: true },
      date: 'date',
      question: 'string',
      author: { type: 'User' },
      votes: { type: 'list', objectType: 'User' },
      voteCount: 'int',
      isAnswered: { type: 'bool', default: false },
    },
  };

  const UserSchema = {
    name: 'User',
    primaryKey: 'id',
    properties: {
      id: 'string',
    },
  };

  function getSyncRealm(user, eventNumber) {
    return new Realm({
      sync: {
        user,
        url: questServerUrl + eventNumber,
      },
      schema: [QuestionSchema, UserSchema],
    });
  }

  return (req, res, next) => {
    if (Realm.Sync.User.current) {
      const eventPath = req.path.split('/');
      if (eventPath.length > 1) {
        req.syncRealm = getSyncRealm(Realm.Sync.User.current, eventPath[1]);
      }
      next();
    } else {
      Realm.Sync.User.login(serverUrl, username, password, (error, user) => {
        if (!error) {
          req.syncRealm = getSyncRealm(user);
          next();
        } else {
          res.status(500).send(error.toString());
        }
      });
    }
  };
};
