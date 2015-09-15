
var Redis = require('ioredis');
var crypto = require('crypto');
var cnx = new Redis();
var started = false;

// initialize the database & create a default user
beforeEach(function(done) {
  if (started) {
    done();
  } else {
    started = true;
    cnx.flushdb(function(err) {
      if (err) {
        throw err;
      } else {
        cnx.hmset(
          'sys.user:admin',
          'su', true,
          'enabled', true,
          'password', crypto.createHash('md5').update('test').digest('hex'),
          function(err) {
            if (err) {
              throw err;
            } else {
              done();
            }
          }
        );
      }
    });
  }
});