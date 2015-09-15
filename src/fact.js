/**
 * Copyright (C) 2015 RedCube (BSD3 License)
 * @authors https://github.com/redcube/api/graphs/contributors
 * @url https://redcube.io
 */
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var moment = require('moment');

/**
 * Constructor
 */
var Fact = function(api, name) {
  EventEmitter.call(this);
  this.api = api;
  this.name = name;
  this.status = 0;
  var self = this;
  this.refresh(function(err) {
    if (err) {
      self.status = 2;
      self.lastError = err;
    } else {
      self.status = 1;
    }
    self.emit('ready', err, self);
  });
};
util.inherits(Fact, EventEmitter);

/**
 * Handles the ready state event of the object
 */
Fact.prototype.ready = function(cb) {
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
 * Reloading fact data
 */
Fact.prototype.refresh = function(cb) {
  var self = this;
  self.api.storage.fact.hget('*', self.name, function(err, counter) {
    if (err) {
      return cb(err, null);
    }
    self.api.storage.fact.hgetall('*.' + self.name, function(err, result) {
      if (err) {
        return cb(err, null);
      }
      if (!result) {
        return cb(new Error('Fact does not exists'), null);
      }
      var measures = JSON.parse(result.measures);
      var dimensions = JSON.parse(result.dimensions);
      // get the human readable size
      var hSize = result.memory / 1024;
      if (hSize > 1024) {
        hSize /= 1024;
        if (hSize > 1024) {
          hSize /= 1024;
          hSize = (Math.round(hSize * 10) / 10) + 'Gb';
        } else {
          hSize = (Math.round(hSize * 10) / 10) + 'Mb';
        }
      } else {
        hSize = (Math.round(hSize * 10) / 10) + 'Kb';
      }
      // read statistics
      self.stats = {
        created: moment.unix(result.created),
        updated: moment.unix(result.updated),
        size: counter,
        memory: result.memory,
        usage: hSize
      };
    });
  });
  return this;
};

/**
 * Declaring the fact namespace
 */
Fact.prototype.create = function(cb) {
  var self = this;
  // 1. create the index
  self.api.storage.fact.hsetnx('*', self.name, 0, function(err, reply) {
    if (err) {
      self.status = 2;
      self.lastError = err;
      return cb(err, null);
    }
    if (reply) {
      // 2. create the meta data
      self.api.storage.fact.hmset(
        '*.' + self.name, 
        'measures', '{}', 
        'dimensions', '{}', 
        'memory', 0, 
        'created', Math.round((new Date()).getTime() / 1000),
        'updated', Math.round((new Date()).getTime() / 1000),
        'imported', null,
        'requested', null,
        function(err) {
          if (err) {
            // @fixme : should revert the hsetnx cmd
            self.status = 2;
            self.lastError = err;
            return cb(err, null);
          } else {
            self.refresh(function(err, result) {
              if (err) {
                self.status = 2;
                self.lastError = err;
                return cb(err, null);
              } else {
                self.status = 1;
                cb(null, result);
              }
            });
          }
        }
      );
    } else {
      return cb(new Error('Fact already exists'), null);
    }
  });
  return this;
};

/**
 * Removing the namespace
 * @fixme : handle errors
 */
Fact.prototype.remove = function(cb) {
  if (this.status !== 1) {
    cb(new Error('The fact is not ready'), null);
    return this;
  }
  this.status = 2;
  this.lastError = new Error('Fact is deleted');
  var self = this;
  // 1. deletes the counter
  self.api.storage.fact.hdel('*', self.name, function() {
    // 2. deletes the meta
    self.api.storage.fact.del('*.' + self.name, function() {
      // 3. Deletes each imported entry
      var next = function(position) {
        self.api.storage.fact.scan(position, 'match', '\*' + self.name + '.*', 'count', 100, function(err, response) {
          if (response[1].length > 0) {
            self.app.redis.del(response[1]);
          }
          if (response[0] > 0) {
            next(response[0]);
          } else {
            // @todo : clean cubes
            setTimeout(function() {
              cb(null, self);
            }, 1000);
          }
        });
      };
      next(0);
    });
  });
  return this;
};

/**
 * Writing some data
 */
Fact.prototype.write = function(data, cb) {
  if (this.status !== 1) {
    cb(new Error('The fact is not ready'), null);
    return this;
  }

  return this;
};

// expose the API
module.exports = Fact;