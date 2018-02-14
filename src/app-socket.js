

var r = require('rethinkdb');
var createConnPromise = require('./core/db/connection').createConnPromise;

const PRIVATE_FIELDS = ['clientPassword', 'githubAuth'];

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
        .get(+auth.id) // weird bug where socket-io.client would send this param as a string, not an int, and thus the record would be null
        .run(conn, (err, res) => {
          if(!res) return next(new Error("no user found for id "+auth.id))
          if(err) return next(new Error('Database error in authenticating user'));
          if(!res['clientPassword']) return next(new Error("can't read client password"))

          if(res.clientPassword === auth.clientPassword) {
            socket.request.user = res;
            next(null);
          } else {
            next(new Error('User is not authenticated'));
          }
        })
      })
      .error(err => console.log)
    })
  
    io.on('connection', function(socket) {
      let userId = socket.request.user.id;
      // TODO update user is online

      socket.error(err => {
        console.error(userId, "error", err)
      })
  
      socket.on('current status', (status) => {
        createConnPromise()
        .then(conn => {
          r.table('users')
          .update({
            id: userId,
            statuses: r.row('statuses').append({
              ...status,
              time: new Date
            })
          })
          .run(conn, (err, res) => {
            if(err) console.error(err)
          })
        })
      })
  
      socket.on('get statuses', (status) => {
        createConnPromise()
        .then(conn => {
          r.table('users')
          .filter(r.row('id').ne(userId))
          .without(PRIVATE_FIELDS)
          .map(user => {
            return user.merge({
              statuses: user('statuses').orderBy(r.desc('time')).limit(3)
            })
          })
          .run(conn, (err, cursor) => {
            if(err) throw new Error(err)
            cursor.toArray((err, res) => {
              if(err) throw new Error(err)
              socket.emit('user statuses', { users: res })
            })
          })
        })
      })
  
      socket.on('disconnect', function() {
        // TODO update offline
      })
  
      createConnPromise()
      .then(conn => {
        r.table('users')
        .without(PRIVATE_FIELDS)
        .changes()
        .run(conn, (err, cursor) => {
          cursor.each((err, change) => {
            if(change.new_val) {
              socket.emit('status updated', { statusEvent: change.new_val })
            }
          })
        })
      })
  
    });
}