var reports = require('express').Router();
var report = require('../models/reports.js');

reports.get('/builder/fields', function(req,res) {
  //get all of the supported fields and their UI name
  report.getSupportedFields()
  .then(function(fieldList){
    //Return it to the client to add to the UI
    res.status(200).send(fieldList);
  })
  .catch(error => {
    console.log(error);
    res.status(500).send({
      error: "Unable to get supported fields"
    });
  });
});

module.exports = reports;
