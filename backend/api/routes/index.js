var express = require('express');
var bodyParser = require("body-parser");
var router = express.Router();
var r = require('rethinkdb');

const BOXES = 'boxes';
const TEMP = 'temperatureReadings';
const HUMIDITY = 'humidityReadings';
const CROPIMG = 'cropImagery';

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.get('/', (req, res) => {
  res.status(200).send("Mushbox 2018.")
})

router.post('/box/', (req, res) => {
  let name = req.body.name;
  if(!name) throw new Error("missing name");

  let box = {
    name,
  }

  r.table(BOXES).insert(box, {}).run(req._rdbConn, function(error, result) {
    if (error) {
      handleError(res, error)
    } else if (result.inserted !== 1) {
      handleError(res, new Error("Document was not inserted."))
    } else {
      res.status(200).send(result);
    }
  });
})

router.get('/box/:id', function(req, res) {
  r.table(BOXES).get(req.params.id)
  .run(req._rdbConn, function(err, result) {
    if(err) throw err;
    res.status(200).send(result);
  });
});

router.post('/box/:id/temperature', function(req, res) {
  let temperatureVal = req.body.temperature;
  let timeVal = req.body.time;
  if(!temperatureVal) throw new Error("temperature is null")
  if(!timeVal) throw new Error("time is null")

  let temp = {
    boxId: req.params.id,
    reading: temperatureVal,
    time: timeVal
  }
  r.table(TEMP).insert(temp, {})
  .run(req._rdbConn, function(err, result) {
    if(err) throw err;
    res.status(200).send(result);
  });
});

router.get('/box/:id/temperature', function(req, res) {
  r.table(TEMP).filter({ "boxId": req.params.id })
  .run(req._rdbConn, function(err, cursor) {
    if(err) throw err;
    cursor.toArray(function(error, result) {
      if (error) {
        handleError(res, error)
      } else {
        // Send back the data
        res.status(200).send(result);
      }
    });
  });
});



function handleError(res, error) {
  return res.status(500).send({
    error: error.message
  });
}

module.exports = router;
