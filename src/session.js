/**
 * Copyright (C) 2015 RedCube (BSD3 License)
 * @authors https://github.com/redcube/api/graphs/contributors
 * @url https://redcube.io
 */
var Entity = require('./entity.js');
var ACL = require('./acl.js');

/**
 * Initialize a new session
 */
var Session = Entity.inherits(function() {
  Entity.apply(this, arguments);
  this.cache = {};
}, 'sys.session');

/**
 * Check if it's a super user
 */
Session.prototype.isSuperUser = function(cb) {
  var self = this;
  if (this.identifier === this.driver.user.identifier) {
    cb(null, this.driver.user.isSuperUser());
  } else {
    this.driver.getUser(this.identifier, function(err, user) {
      if (err) {
        self.error(err, cb);
      } else {
        cb(null, user.isSuperUser());
      }
    });
  }
  return this;
};

/**
 * Checks if the user is authorized to execute the specified action over 
 * the specified namespace (usually a namespace is an entity type)
 */
Session.prototype.acl = function(namespace, action, cb) {
  var self = this;

  if (!cb && typeof action === 'function') {
    cb = action;
    action = false;
  }

  if (!this.cache.hasOwnProperty(namespace)) {
    this.cache[namespace] = new ACL(this.driver, '*:' + namespace);
  }
  
  this.cache[namespace].ready(function(err, acl) {
    if (err) {
      self.error(err, cb);
    } else if (action !== false) {
      // check the specified action
      acl.can(action, function(err, ok) {
        if (err) {
          self.error(err, cb);
        } else if (!ok) {
          self.error('Unauth', cb);
        } else {
          cb(null, acl);
        }
      });
    } else {
      // manual check on acl access level
      cb(null, acl);
    }
  });
  
  return this;
};

module.exports = Session;