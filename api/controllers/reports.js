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

reports.post('/search', function(req,res) {
  //make sure they provided some search terms
  if (!req.body.search_line_items || req.body.search_line_items.length < 1){
    res.status(400).send({
      error: "No search terms provided"
    });
  }
  //Parse the search items into a NoSQL query
  var searchObject = report.parseIntoQuery(req.body.search_line_items);
  //Now perform the query
  report.getRecordsForSearchObject("computer", searchObject)
  .then(function(results){
    res.status(200).send(results);
  })
  .catch(error => {
    console.log(error);
    res.status(500).send({
      error: "Unable to perform search"
    });
  });
});

module.exports = reports;
