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

//Returns all of the reports
reports.get('/', function(req,res){
  //Return all of the reports
  report.getReports()
  .then(function(reports){
    return res.status(200).send(reports);
  })
  .catch(error => {
    console.log(error);
    return res.status(500).send({
      error: "Unable to get reports"
    });
  });
});

//Gets a report by id
reports.get('/id/:reportId', function(req,res){
  //make sure the report id was provided in the request
  if (!req.params.reportId){
    res.status(400).send({
      error: "Missing report id"
    });
  }
  //Get the report and it's line items from the database
  report.getReportById(req.params.reportId)
  .then(function(report){
    res.status(200).send(report);
  })
  .catch(error => {
    console.log(error);
    return res.status(500).send({
      error: "Unable to get report"
    });
  });
});

reports.put('/update/:reportId', function(req,res){
  //Make sure everything is in the request
  if (!req.body.name || !req.body.line_items || req.body.line_items.length < 1){
    res.status(400).send({
      error: "Missing required fields"
    });
  }
});

//Saves a report to the database to be used later
reports.post('/save', function(req,res){
  //Make sure everything is in the request
  if (!req.body.name || !req.body.line_items || req.body.line_items.length < 1){
    res.status(400).send({
      error: "Missing required fields"
    });
  }
  //Copy out the line items to be inserted after the parent report
  var reportObj = req.body;
  reportObj.created = new Date();
  reportObj.created_by = req.user.id;
  reportObj.conditions_count = req.body.line_items.length;
  reportObj.type = req.body.type;
  //Default to some fields to select if not provided
  if (!req.body.fields_to_select){
    reportObj.fields_to_select = 'general.id, general.name';
  } else {
    reportObj.fields_to_select = req.body.fields_to_select;
  }
  var lineItems = req.body.line_items;
  delete reportObj.line_items;
  //Insert the report
  report.insertReportObject(reportObj)
  .then(function(result){
    //the insert id is the report id
    var newReportId = result.insertId;
    Promise.all(lineItems.map(lineItem => report.insertReportLineItem(lineItem, newReportId))).then(function(results){
      return res.status(200).send({ "status" : "success", "id" : newReportId});
    })
    .catch(error => {
      console.log(error);
      return res.status(500).send({
        error: "Unable to insert report line items"
      });
    });
  })
  .catch(error => {
    console.log(error);
    return res.status(500).send({
      error: "Unable to insert new report"
    });
  });
});

//Does an advanced search by id
reports.get('/search/:reportId', function(req,res){
  //Make sure a report Id was provided
  if (!req.params.reportId){
    res.status(400).send({
      error: "Missing required fields"
    });
  }
  //Get the report and it's line items by id
  report.getReportById(req.params.reportId)
  .then(function(reportObj){
    //Convert it's line items to a query string
    var lineItemsConverted = [];
    reportObj.line_items.forEach(function(l){
      lineItemsConverted.push(report.convertDbLineItem(l));
    });
    var searchObject = report.parseIntoQuery(lineItemsConverted,reportObj.type);
    var respObj = { fields_to_select : reportObj.fields_to_select};
    //Now perform the query
    report.getRecordsForSearchObject(reportObj.type, searchObject)
    .then(function(results){
      respObj.results = results;
      res.status(200).send(respObj);
    })
    .catch(error => {
      console.log(error);
      res.status(500).send({
        error: "Unable to perform search"
      });
    });
  })
  .catch(error => {
    console.log(error);
    return res.status(500).send({
      error: "Unable to get report"
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
  console.log(searchObject);
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
