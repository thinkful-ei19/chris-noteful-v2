'use strict';

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgres://chris:cjdrnch65@localhost/noteful-app',
    debug: true, // http://knexjs.org/#Installation-debug
    pool: {min : 1 , max : 2}
  },
  test: {
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL || 'postgres://localhost/notefulTest',
    pool: {min : 1 , max : 2}
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL
  }
};
