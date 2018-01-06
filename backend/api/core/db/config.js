module.exports = {
  rethinkdb: {
    // host: 'app-db',
    host: 'db',
    port: 28015,
    authKey: '',
    db: 'nerd',
    tables: ['temperatureReadings', 'humidityReadings', 'cropImagery', 'boxes']
  },
  express: {
     port: 3000
  }
};
