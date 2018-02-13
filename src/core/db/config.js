module.exports = {
  rethinkdb: {
    host: 'wh_db',
    port: 28015,
    authKey: '',
    db: `app_${process.env.NODE_ENV}`,
    tables: ['users', 'activity', 'sessions']
  },
  express: {
     port: 3000
  }
};
