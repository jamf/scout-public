var db = require('../common/db.js');
var fs = require('fs');
const path = require("path");

exports.getSupportedFields = function(){
  return new Promise(function(resolve,reject) {
    try {
      //get the current mapping of API supported fields, to UI friendly strings
      var fileString = fs.readFileSync(path.resolve(__dirname, '../common/api-field-mappings.json'), 'utf-8');
      //parse to an object and return
      resolve(JSON.parse(fileString));
    } catch (e){
      reject(e);
    }
  });
}

exports.parseIntoQuery = function(searchLineItems){
  var searchObject = {};
  //Loop throught the query and build up the search query
  for (var i = 0; i < searchLineItems.length -1; i++){
    //Make sure the line item was actually filled out
    if (Object.keys(searchLineItems[i]).length > 0 && searchLineItems[i].value != ''){
      var line = searchLineItems[i];
      //see if we need to add a new conidtion or use the last one in the query
      var operatorsInSearch = Object.keys(searchObject);
      //Check if we need to add this operator to the search object
      if (operatorsInSearch.length == 0 || operatorsInSearch[operatorsInSearch.length - 1] != operatorToNoSQL(line.junction)){
        if (i == 0){
          //add the new operator
          searchObject[operatorToNoSQL(searchLineItems[1].junction)] = [];
        } else {
          //add the new operator
          searchObject[operatorToNoSQL(line.junction)] = [];
        }
      }
      //If if it's the first item add it fto whatever the second operator is
      var lineItemSearchObject = getSearchObject("computer", "general", line.field, line.operator, line.value);
      console.log(lineItemSearchObject);
      if (i == 0){
        //Add the serach item to the correct operator
        searchObject[operatorToNoSQL(searchLineItems[1].junction)].push(lineItemSearchObject);
      } else {
        //Add the serach item to the correct operator
        searchObject[operatorToNoSQL(line.junction)].push(lineItemSearchObject);
      }
    }
  }
  return searchObject;
}


//Get matching inventory record by category and field search
exports.getRecordsForSearchObject = function(collection, searchObject){
  return new Promise(function(resolve,reject) {
    db.getNoSQL().collection(collection).find(searchObject).toArray(function(err, result) {
      if (err){
        console.log('ERROR');
        reject(err);
      } else {
        console.log(result);
        resolve(result);
      }
    });
  });
}

exports.insertReportObject = function(reportObject){
  return new Promise(function(resolve,reject) {
    db.get().query('INSERT INTO reports SET ?', [reportObject], function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.insertReportLineItem = function(lineItem, reportId){
  lineItem.report_id = reportId;
  return new Promise(function(resolve,reject) {
    db.get().query('INSERT INTO reports_line_item SET ?', [lineItem], function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

function getSearchObject(collection, category, field, operation, searchValue){
  var pathString = collection + "." + category + "." + field;
  //Build the actual search object
  var searchObject = {};
  searchObject[pathString] = operationToObject(operation, searchValue);
  return searchObject;
}

function operatorToNoSQL(value){
  if (value == "AND"){
    return '$and';
  } else if (value == "OR"){
    return '$or';
  }
}

function operationToObject(operation, value){
  if (operation == "equals"){
    return { "$eq" : value};
  } else if (operation == "does not equal"){
    return { "$ne" : value};
  } else if (operation == "is greater than"){
    return { "$gt" : value};
  } else if (operation == "is less than"){
    return { "$lt" : value};
  } else if (operation == "contains"){
    return "/.*"+value+".*/";
  } else if (operation == "does not contain"){
    return "{ $not: /.*"+value+".*/ }";
  }
  return '';
}
