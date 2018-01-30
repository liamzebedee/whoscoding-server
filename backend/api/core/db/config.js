module.exports = {
  rethinkdb: {
    // host: 'app-db',
    host: 'db',
    port: 28015,
    authKey: '',
    db: 'nerd',
    tables: ['users', 'posts', 'activity']
  },
  express: {
     port: 3000
  }
};
