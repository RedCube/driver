/**
 * Copyright (C) 2015 RedCube (BSD3 License)
 * @authors https://github.com/redcube/api/graphs/contributors
 * @url https://redcube.io
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;

/**
 * Constructor
 */
var Entity = function(driver, identifier, data) {
  if (typeof this === 'function') {
    return new this(driver, identifier, data);
  }
  EventEmitter.call(this);
  this.status = 0;
  this.identifier = Entity.sanitize(identifier);
  this.driver = driver;
  if (!data) {
    var self = this;
    this.data = {};
    this.refresh(function(err) {
      if (err) {
        self.status = 2;
        self.lastError = err;
      } else {
        self.status = 1;
      }
      self.emit('ready', err, self);
    });
  } else {
    this.data = data;
    this.status = 1;
  }
};


/**
 * Sanitize the specified column name (or unique identifier value)
 */
Entity.sanitize = function(column) {
  return column.toLowerCase().replace(/\s+/g, '_');
};

/**
 * Generic read function
 */ 
var doRead = function(self, namespace, cb) {
  self.driver.storage.hgetall(
    namespace + ':' + self.identifier, 
    function(err, result) {
      if (err) {
        self.error(err, cb);
      } else if (!result) {
        self.error(namespace + ' not found', cb);
      } else {
        self.data = result;
        cb(null, self);
      }
    }
  );
};

/**
 * Generic create function 
 */
var doCreate = function(self, namespace, cb) {
  self.data.created = Math.round((new Date()).getTime() / 1000);
  self.data.owner = self.driver.session.identifier;
  if (typeof self.onCreate === 'function') {
    self.onCreate();
  }
  self.emit('create');
  var data = self.getData();
  self.driver.storage.hsetnx(
    namespace + ':' + self.identifier, 'created', self.data.created,
    function(err, result) {
      if (err) {
        self.error(err, cb);
      } else if (result !== 1) {
        self.error(namespace + ' already exists', cb);
      } else {
        self.state = 1;
        self.driver.storage.hmset(
          namespace + ':' + self.identifier, data,
          function(err) {
            if (err) {
              self.error(err, cb);
            } else {
              cb(null, self);
            }
        });
      }
  });
};

/**
 * Generic update function
 */
var doUpdate = function(self, namespace, cb) {
  self.data.updated = Math.round((new Date()).getTime() / 1000);
  if (typeof self.onUpdate === 'function') {
    self.onUpdate();
  }
  self.emit('update');
  self.driver.storage.hmset(
    namespace + ':' + self.identifier, self.getData(),
    function(err) {
      if (err) {
        self.error(err, cb);
      } else {
        self.state = 1;
        cb(null, self);
      }
  });
};

/**
 * Generic delete function
 */
var doRemove = function(self, namespace, cb) {
  if (typeof self.onRemove === 'function') {
    self.onRemove();
  }
  self.emit('remove');
  self.driver.storage.del(
    namespace + ':' + self.identifier,
    function(err, result) {
      if (err) {
        self.error(err, cb);
      } else if (result !== 1) {
        self.error(namespace + ' not deleted', cb);
      } else {
        self.state = 0;
        cb(null, self);
      }
  });
};


/**
 * Inheritance helper
 */
util.inherits(Entity, EventEmitter);
Entity.inherits = function(object, namespace, acl) {

  // load acl on demand (avoid recursive dependency)
  var ACL = require('./acl.js');

  if (typeof object !== 'function') {
    throw new Error('Expecting a functor');
  }
  util.inherits(object, Entity);
  
  /**
   * Generic creator
   */
  object.create = function(driver, identifier, data, cb) {
    if (!driver.cache.hasOwnProperty(namespace)) {
      driver.cache[namespace] = {};
    }
    identifier = Entity.sanitize(identifier);
    if (driver.cache[namespace].hasOwnProperty(identifier)) {
      cb(new Error(namespace + ' already exists'));
    }
    driver.cache[namespace][identifier] = new object(driver, identifier);
    driver.cache[namespace][identifier].data = data || {};
    driver.cache[namespace][identifier].status = 0;
    if (acl) {
      driver.session.acl(namespace, 'create', function(err, acl) {
        if (err) {
          self.error(err, cb);
        } else {
          doCreate(driver.cache[namespace][identifier], namespace, cb);
        }
      });
    } else {
      doCreate(driver.cache[namespace][identifier], namespace, cb);
    }
    return driver.cache[namespace][identifier];
  };

  /**
   * Generic finder
   */
  object.find = function(driver, identifier, cb) {
    if (!driver.cache.hasOwnProperty(namespace)) {
      driver.cache[namespace] = {};
    }
    identifier = Entity.sanitize(identifier);
    if (!driver.cache[namespace].hasOwnProperty(identifier)) {
      driver.cache[namespace][identifier] = new object(driver, identifier);
    }
    return driver.cache[namespace][identifier].ready(function(err, entry) {
      driver.cache[namespace][identifier] = entry;
      if (err) {
        cb(err, null);
      } else {
        if (acl) {
          entry.acl('read', function(err) {
            if (err) {
              cb(err, null);
            } else {
              cb(null, entry);
            }
          });
        } else {
          cb(null, entry);
        }
      }
    });
  };
  
  /**
   * Reloading data
   */
  object.prototype.refresh = function(cb) {
    var self = this;
    if (acl) {
      self.acl('read', function(err) {
        if (err) {
          self.error(err, cb);
        } else {
          doRead(self, namespace, cb);
        }
      });
    } else {
      doRead(self, namespace, cb);
    }
    return this;
  };
  /**
   * Gets an array of data
   */
  object.prototype.getData = function() {
    var args = [];
    for(var k in this.data) {
      args.push(k, this.data[k]);
    }
    return args;
  };
  /**
   * Update informations
   */
  object.prototype.update = function(cb) {
    var self = this;
    if (acl) {
      self.acl('update', function(err) {
        if (err) {
          self.error(err, cb);
        } else {
          doUpdate(self, namespace, cb);
        }
      });
    } else {
      doUpdate(self, namespace, cb);
    }
    return this;
  };
  /**
   * Removes informations
   */
  object.prototype.remove = function(cb) {
    var self = this;
    if (acl) {
      self.acl('remove', function(err) {
        if (err) {
          self.error(err, cb);
        } else {
          doRemove(self, namespace, cb);
        }
      });
    } else {
      doRemove(self, namespace, cb);
    }
    return this;
  };
  // Handle ACL decorator
  if (acl === true) {
    object = ACL.register(namespace, object);
  }
  return object;
};

/**
 * Gets the driver instance
 */
Entity.prototype.getDriver = function() {
  return this.driver;
};

/**
 * Gets the unique key
 */
Entity.prototype.getIdentifier = function() {
  return this.identifier;
};

/**
 * Gets the driver instance
 */
Entity.prototype.asBoolean = function(value) {
  return value === 'true' || value === true;
};

/**
 * Handles the ready state event of the object
 */
Entity.prototype.ready = function(cb) {
  switch(this.status) {
    case 0:
      this.once('ready', cb);
      break;
    case 1:
      cb(null, this);
      break;
    case 2:
      cb(this.lastError, null);
      break;
  }
  return this;
};

/**
 * Raise an error
 */
Entity.prototype.error = function(message, cb) {
  var error = message;
  if (typeof message === 'string') {
    error = new Error(message);
  }
  if (this.status === 0) {
    this.status = 2;
  }
  this.lastError = error;
  if (typeof cb === 'function') {
    cb(error, null);
  } else {
    this.emit('error', error);
    this.driver.emit('error', error);
  }
  return this;
};


module.exports = Entity;