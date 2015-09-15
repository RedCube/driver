
var assert = require('assert');
var Driver = require('../src/driver.js');

describe('test the driver api', function() {

  var driver;

  it('should connect', function(done) {
    driver = new Driver(null, 'admin', 'test');
    driver.on('ready', function(err) {
      if (err) throw err;
      done();
    });
  });

  it('should create a guest', function(done) {
    driver.createUser('guest', 'guest', function(err) {
      if (err) throw err;
      done();
    });
  });

  it('should find a user', function(done) {
    // clean up the cache
    driver = new Driver(null, 'guest', 'guest');
    // finder
    driver.on('ready', function(err) {
      if (err) {
        throw err;
      }
      driver.getUser('admin', function(err, user) {
        assert(err && err.message === 'Unauth');
        done();
      });
    });
  });

});