/**
 * RedCube - MOLAP Engine based on Redis and NodeJS
 * Copyright (C) 2015 RedCube (BSD3 License)
 * @authors https://github.com/redcube/api/graphs/contributors
 * @url https://redcube.io
 */
var Entity = require('./entity.js');

/**
 * The ACL entry
 */
var ACL = Entity.inherits(function() {
  Entity.apply(this, arguments);
  this.parent = false;
  this.groups = {};
  this.users = {};
}, 'sys.acl');

/**
 * Check if the user can do the specified action
 */
ACL.prototype.can = function(action, cb) {
  var self = this;
  if (this.driver.session === false) {
    cb(null, false);
  } else {
    this.driver.session.isSuperUser(function(err, result) {
      if (err) {
        self.error(err, cb);
      } else if (result) {
        cb(null, true);
      } else {
        // @todo : implement this
        cb(null, false);
      }
    });
  }
  return this;
};

// object specific cache for ACL entries
ACL.cache = {};

/**
 * Registers a class as an ACL controller
 */
ACL.register = function(type, object) {
  /**
   * Generic helper function for any ACL registered class
   */
  object.prototype.acl = function(action, cb) {
    if (!cb && typeof action === 'function') {
      cb = action;
      action = false;
    }
    // check the ACL
    var self = this;
    ACL.find(this.driver, type + ':' + this.identifier, function(err, acl) {
      if (err) {
        self.error(err, cb);
      } else if (action !== false) {
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
        cb(null, acl);
      }
    });
  };
  return object;
};

/**
 * Expose the ACL class
 */
module.exports = ACL;