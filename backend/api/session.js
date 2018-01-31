var session = require("express-session");
var createConnection = require('./core/db/connection').createConnection;

// var RDBStore = require('session-rethinkdb')(session);

// var r = require('rethinkdbdash')({
//     servers: [
//       {
//         // host: 'app-db',
//         host: 'db',
//         port: 28015,
//         authKey: '',
//         db: 'nerd',
//       }
//     ]
// });

// var store = new RDBStore(r,  {
//     browserSessionsMaxAge: 5000,
//     table: 'sessions' 
// });
var store = new session.MemoryStore()

module.exports = store;

