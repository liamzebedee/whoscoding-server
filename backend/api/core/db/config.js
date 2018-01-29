module.exports = {
  rethinkdb: {
    // host: 'app-db',
    host: 'db',
    port: 28015,
    authKey: '',
    db: 'nerd',
    tables: ['users', 'posts']
  },
  express: {
     port: 3000
  }
};
