/**
 * Copyright (C) 2015 RedCube (BSD3 License)
 * @authors https://github.com/redcube/api/graphs/contributors
 * @url https://redcube.io
 */
var Entity = require('./entity.js');
var Session = require('./session.js');
var crypto = require('crypto');

/**
 * Declare the user class constructor
 */
var User = Entity.inherits(function() {
  Entity.apply(this, arguments);
}, 'sys.user', true);

/**
 * Encrypt the specified value
 */
User.encrypt = function(value) {
  return crypto.createHash('md5').update(value).digest('hex');
};

/**
 * Open a session for the specified user
 */
User.login = function(driver, username, password, cb) {
  username = Entity.sanitize(username);
  driver.storage.hgetall('sys.user:' + username, function(err, data) {
    if (err) {
      cb(err);
    } else {
      var user = new User(driver, username, data);
      if (!user.check(password)) {
        cb(new Error('Bad username/password'));
      } else if (!user.isEnabled()) {
        cb(new Error('User account is disabled'));
      } else {
        var session = new Session(driver, username);
        session.ready(function(err, session) {
          if (err) {
            cb(err);
          } else {
            session.update(function(err) {
              if (err) {
                cb(err);
              } else {
                cb(null, user, session);
              }
            });
          }
        });
      }
    }
  });
};

/**
 * Handles the user creation
 */
User.prototype.onCreate = function() {
  this.data.password = User.encrypt(this.data.password);
  this.data.enabled = true;
};

/**
 * Check a password
 */
User.prototype.check = function(password) {
  return this.data.password === User.encrypt(password);
};
/**
 * Check if the user has any access
 */
User.prototype.isSuperUser = function() {
  return this.asBoolean(this.data.su);
};
/**
 * Check if the user has any access
 */
User.prototype.isEnabled = function() {
  return this.asBoolean(this.data.enabled);
};
/**
 * Checks if the user is authorized to execute the specified action over 
 * the specified namespace (usually a namespace is an entity type)
 */
User.prototype.access = function(namespace, action, flag, cb) {
  var self = this;

  if (!cb && typeof action === 'function') {
    cb = action;
    action = false;
  }

/*
  acl.set(action, flag).update(function(err) {
    if (err) {
      self.error(err, cb);
    } else {
      cb(null, acl);
    }
  });
*/

  // @todo
  return this;
};


/**
 * Exports the user class
 */
module.exports = User;