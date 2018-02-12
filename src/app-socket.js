

var r = require('rethinkdb');
var createConnPromise = require('./core/db/connection').createConnPromise;

module.exports = function(server) {
    // Realtime libs.
    var io = require('socket.io')(server);
  
    io.use((socket, next) => {
      let auth = {
        ...socket.handshake.query
      };
  
      createConnPromise()
      .then(conn => {
        r.table('users')
        .get(auth.id)
        .run(conn, (err, res) => {
          if(err) return next(new Error('Database error in authenticating user'));
  
          if(res.clientPassword === auth.clientPassword) {
            socket.request.user = res;
            next(null);
          } else {
            next(new Error('User is not authenticated'));
          }
        })
      })
    })
  
    io.on('connection', function(socket) {
      let userId = socket.request.user.id;
      // TODO update user is online
  
      socket.on('current status', (status) => {
        createConnPromise()
        .then(conn => {
          r.table('users')
          .update({
            id: userId,
            statuses: r.row('statuses').append(status)
          })
          .run(conn)
        })
      })
  
      socket.on('get statuses', (status) => {
        createConnPromise()
        .then(conn => {
          r.table('users')
          .filter(user => user('id').not(userId))
          .map(user => {
            return user.merge({
              statuses: user('statuses').orderBy('time').limit(3)
            })
          })
          .run(conn, (err, cursor) => {
            if(err) console.log(err);
  
            io.emit('statuses', { statuses: cursor.toArray() })
          })
        })
      })
  
      socket.on('disconnect', function() {
        // TODO update offline
      })
  
      createConnPromise()
      .then(conn => {
        r.table('users')
        .changes()
        .run(conn, (err, cursor) => {
          cursor.each(change => {
            if(change.new_val) {
              io.emit('status updated', { statusEvent: change.new_val })
            }
          })
        })
      })
  
    });
}