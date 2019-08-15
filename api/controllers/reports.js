var reports = require('express').Router();
var report = require('../models/reports.js');
var user = require('../models/user.js');
const audit = require('../common/audit-logger').logActivity;

reports.get('/builder/fields', function(req,res) {
  //get all of the supported fields and their UI name
  report.getSupportedFields()
  .then(function(fieldList){
    //Return it to the client to add to the UI
    return res.status(200).send(fieldList);
  })
  .catch(error => {
    console.log(error);
    return res.status(500).send({
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
    return res.status(400).send({
      error: "Missing report id"
    });
  }
  //Get the report and it's line items from the database
  report.getReportById(req.params.reportId)
  .then(function(report){
    return res.status(200).send(report);
  })
  .catch(error => {
    console.log(error);
    return res.status(500).send({
      error: "Unable to get report"
    });
  });
});

//Deletes a report by id
reports.delete('/id/:reportId', function(req,res){
  //make sure the report id was provided in the request
  if (!req.params.reportId){
    return res.status(400).send({
      error: "Missing report id"
    });
  }
  //Make sure the user has permission to delete the report
  if (!user.hasPermission(req.user, 'can_delete')){
    audit({user: req.user, user_agent: req.headers['user-agent'], ip: req.connection.remoteAddress, message: "Failed attempt to delete a report."});
    return res.status(401).send({ error: "User does not have permission to delete objects."});
  }
  //Get the report and it's line items from the database
  report.deleteReport(req.params.reportId)
  .then(function(result){
    audit({user: req.user, user_agent: req.headers['user-agent'], ip: req.connection.remoteAddress, message: `Successfully deleted report ${req.params.reportId}`});
    return res.status(200).send({status : 'success'});
  })
  .catch(error => {
    return res.status(500).send({
      error: "Unable to delete report or it's line items."
    });
  });
});

reports.put('/update/:reportId', function(req,res){
  //Make sure everything is in the request
  if (!req.body.name || !req.body.line_items || req.body.line_items.length < 1 || !req.params.reportId){
    res.status(400).send({
      error: "Missing required fields"
    });
  }
  //Make sure the user has permission to update
  if (!user.hasPermission(req.user, 'can_edit')){
    audit({user: req.user, user_agent: req.headers['user-agent'], ip: req.connection.remoteAddress, message: `Failed attempt to create a update report.`});
    return res.status(401).send({ error: "User does not have permission to edit objects."});
  }
  //Rebuild the report object
  var reportObj = req.body;
  reportObj.conditions_count = req.body.line_items.length;
  reportObj.type = req.body.type;
  //Only overwrite fields to select if they are provided
  if (req.body.fields_to_select){
    reportObj.fields_to_select = req.body.fields_to_select;
  }
  console.log(reportObj);
  //Copy these out so we can update the parent report object first
  var lineItems = req.body.line_items;
  delete reportObj.line_items;
  //Update the parent report object
  report.updateReportById(reportObj, req.params.reportId)
  .then(function(result){
    Promise.all(lineItems.map(lineItem => report.updateReportLineItem(lineItem,lineItem.item_order,req.params.reportId))).then(function(results){
      audit({user: req.user, user_agent: req.headers['user-agent'], ip: req.connection.remoteAddress, message: `Successfully created report ${req.params.reportId}`, reportObj});
      return res.status(200).send({ "status" : "success", "id" : req.params.reportId});
    })
    .catch(error => {
      console.log(error);
      return res.status(500).send({
        error: "Unable to update report line items"
      });
    });
  })
  .catch(error => {
    console.log(error);
    return res.status(500).send({
      error: "Unable to update report"
    });
  });
});

//Saves a report to the database to be used later
reports.post('/save', function(req,res){
  //Make sure everything is in the request
  if (!req.body.name || !req.body.line_items || req.body.line_items.length < 1){
    return res.status(400).send({
      error: "Missing required fields"
    });
  }
  //Make sure the user has permission
  if (!user.hasPermission(req.user, 'can_create')){
    audit({user: req.user, user_agent: req.headers['user-agent'], ip: req.connection.remoteAddress, message: `Failed attempt to create a report.`});
    return res.status(401).send({ error: "User does not have permission to create objects."});
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
      audit({user: req.user, user_agent: req.headers['user-agent'], ip: req.connection.remoteAddress, message: `Successfully deleted report ${req.params.reportId}`});
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
    return res.status(400).send({
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
      respObj.mongo_query = searchObject;
      audit({user: req.user, user_agent: req.headers['user-agent'], ip: req.connection.remoteAddress, details: {mongo_query: searchObject, results: respObj.results}, message: `Report ran for report ${req.params.reportId}`});
      return res.status(200).send(respObj);
    })
    .catch(error => {
      console.log(error);
      return res.status(500).send({
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
    return res.status(400).send({
      error: "No search terms provided"
    });
  }
  //Parse the search items into a NoSQL query
  var searchObject = report.parseIntoQuery(req.body.search_line_items);
  console.log(searchObject);
  //Now perform the query
  report.getRecordsForSearchObject("computer", searchObject)
  .then(function(results){
    return res.status(200).send(results);
  })
  .catch(error => {
    console.log(error);
    return res.status(500).send({
      error: "Unable to perform search"
    });
  });
});

module.exports = reports;
