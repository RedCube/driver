/**
 * Constructor
 */
var Main = function(opt) {
  // handle the storage connection
  if (opt.hasOwnProperty('fact') && opt.hasOwnProperty('cube')) {
    // use differents servers for facts & cubes
    this.storage = {
      fact: new Redis(opt.fact),
      cube: new Redis(opt.cube)
    };
  } else {
    // same server for facts and cubes
    var redis = new Redis(opt);
    this.storage = {
      fact: redis,
      cube: redis
    };
  }
  // default values
  this.facts = {};
  this.cubes = {};
};

/**
 * Gets the list of facts
 */
Main.prototype.list = function(cb) {
  this.storage.fact.hgetall('*', function(err, result) {
    if (err) {
      cb(err, null);
    } else {
      var items = {};
      for(var fact in result) {
        items[fact] = {
          name: fact,
          size: result[fact]
        };
      }
      cb(null, items);
    }
  });
  return this;
};


/**
 * Retrieves the specified fact
 */
Main.prototype.fact = function(fact, cb) {
  fact = this.sanitize(fact);
  if (!this.facts.hasOwnProperty(fact)) {
    this.facts[fact] = new Fact(this, fact);
  }
  this.facts[fact].ready(cb);
  return this;
};

/**
 * Writes some data into the fact table
 */
Main.prototype.write = function(fact, data, cb) {
  this.fact(fact, function(err, fact) {
    if (err) {
      return cb(err, null);
    }
    fact.write(data, cb);
  });
  return this;
};

/**
 * Declare the specified fact
 */
Main.prototype.create = function(fact, cb) {
  this.fact(fact, function(err) {
    if (err) {
      if (err.message && err.message === 'Fact does not exists') {
        this.facts[fact].create(cb);
      } else {
        cb(err, null);
      }
    } else {
      cb(new Error('Fact already exists'), null);
    }
  }.bind(this));
};

/**
 * Removes the specified fact
 */
Main.prototype.remove = function(fact, cb) {
  var self = this;
  this.fact(fact, function(err, fact) {
    if (err) {
      cb(err, null);
    } else {
      self.remove(function(err, result) {
        if (err) {
          return cb(err, null);
        }
        delete self.facts[fact];
        cb(null, result);
      });
    }
  });
};

/**
 * Execute an MDX request
 */
Main.prototype.request = function(mdx, cb) {
  
};