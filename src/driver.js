/**
 * RedCube - MOLAP Engine based on Redis and NodeJS
 * Copyright (C) 2015, RedCube (BSD3 License)
 * @authors https://github.com/redcube/api/graphs/contributors
 * @url https://redcube.io
 */

// core libs
var Redis = require('ioredis');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

// framework
var Entity = require('./entity.js');
var User = require('./user.js');
var DataWarehouse = require('./datawarehouse.js');


/**
 * Constructor
 */
var Driver = function(opt, username, password) {
  if (typeof this === 'function') {
    return new this(opt, username, password);
  }

  // init
  EventEmitter.call(this);
  this.storage = new Redis(opt);

  // session
  this.session = false;
  this.user = false;
  this.cache = {};

  // Opens a new session :
  var self = this;
  User.login(this, username, password, function(err, user, session) {
    if (err) {
      self.error(err);
    } else {
      self.session = session;
      self.user = user;
    }
    self.emit('ready', err, self);
  });
};
util.inherits(Driver, EventEmitter);

/**
 * Raise an error
 */
Driver.prototype.error = function(message, cb) {
  var error = message;
  if (typeof message === 'string') {
    var error = new Error(message);
  }
  if (this.status === 0) {
    this.status = 2;
  }
  this.emit('error', error);
  this.lastError = error;
  if (typeof cb === 'function') {
    cb(error, null);
  }
  return this;
};

/* == DATA WAREHOUSE SECTION == */
Driver.prototype.createDataWarehouse = function(auth, name, cb) {
  var self = this;
  return this.getDataWarehouse(function(err) {
    if (!err) {
      cb(new Error('Data Warehouse already exists'), null);
    } else {
      if (err.message && err.message === 'Data Warehouse does not exists') {
        self.dwh[name].create(cb);
      } else {
        cb(err, null);
      }
    }
  });
};

/**
 * Gets the specified data warehouse (using specified credentials)
 */ 
Driver.prototype.getDataWarehouse = function(auth, name, cb) {
  name = Entity.sanitize(name);
  if (!this.dwh.hasOwnProperty(name)) {
    this.dwh[name] = new DatawareHouse(this, name);
  }
  this.dwh[name].ready(function(err, dwh) {
    if (err) {
      cb(err, null);
    } else {
      dwh.acl(auth, 'read', cb);
    }
  });
  return this;
};

/**
 * 
 */
Driver.prototype.listDataWarehouses = function(auth, filter, cb) {
  // @todo
};

/* == USERS SECTION == */




/**
 * Creates the specified user with the specified account
 */
Driver.prototype.createUser = function(name, pwd, cb) {
  User.create(this, name, { password: pwd }, cb);
  return this;
};
/**
 * Gets the specified user
 */
Driver.prototype.getUser = function(name, cb) {
  User.find(this, name, cb);
  return this;
};
Driver.prototype.listUsers = function(auth, filter, cb) {
  // @todo
};

/* == GROUPS SECTION == */
Driver.prototype.createGroup = function(auth, name, cb) {
};
Driver.prototype.getGroup = function(auth, name, cb) {
};
Driver.prototype.listGroups = function(auth, filter, cb) {
};



// expose the main API
module.exports = Driver;
