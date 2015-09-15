/**
 * Copyright (C) 2015 RedCube (BSD3 License)
 * @authors https://github.com/redcube/api/graphs/contributors
 * @url https://redcube.io
 */

var Dimension = function(api, name) {
  if (typeof this === 'function') {
    return new this(api, name);
  }
  this.api = api;
  this.name = name;
};
/**
 * Raised when the dimension is loaded
 */
Dimension.prototype.ready = function(cb) {
};
/**
 * Creates a new dimension
 */
Dimension.prototype.create = function(options, cb) {
};
/**
 * Removes the specified dimension
 */
Dimension.prototype.remove = function(cb) {
};
/**
 * Gets a value identifier from the dimension
 */
Dimension.prototype.get = function(value, cb) {
};
/**
 * Attach the dimension on the fact table
 */
Dimension.prototype.attach = function(fact, alias, cb) {
  if (!cb && typeof alias === 'function') {
    cb = alias;
    alias = null;
  }
};
/**
 * Detach the specified dimension from the fact table
 */
Dimension.prototype.detach = function(fact, alias, cb) {
  if (!cb && typeof alias === 'function') {
    cb = alias;
    alias = null;
  }
};
/**
 * Writes a fact entry
 */
Dimension.prototype.write = function(fact, primary, value, cb) {
};

module.exports = Dimension;