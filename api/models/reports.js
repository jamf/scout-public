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

//Converts a line item stored in the database to one similar to the UI
exports.convertDbLineItem = function(lineItem){
  var newLineItem = {};
  newLineItem.junction = lineItem.condition;
  newLineItem.param_one = lineItem.parenthesis_one;
  newLineItem.operator = lineItem.operator;
  newLineItem.value = lineItem.value;
  newLineItem.field = lineItem.field;
  newLineItem.param_two = lineItem.parenthesis_two;
  return newLineItem;
}

exports.parseIntoQuery = function(searchLineItems, reportType){
  //Group all of the items if there are sub queries
  var grouped = [];
  var i = 0;
  var lastGroupObject = null;
  while (i < searchLineItems.length){
    //Default to AND if no junction
    if (searchLineItems[i].junction != 'AND' || searchLineItems[i].junction != 'OR'){
      searchLineItems[i].junction = 'AND';
    }
    //We found a new grouping
    if (lastGroupObject == null && searchLineItems[i].param_one == 1){
      //Find the object before this so we now where to include the group
      lastGroupObject = {};
      lastGroupObject.last_junction = searchLineItems[i].junction;
      //Only can have one operator per parenthesis so default to this one
      lastGroupObject.junction = searchLineItems[i + 1].junction;
      lastGroupObject.items = [];
      lastGroupObject.items.push(searchLineItems[i]);
    //Add another one to the grouping
    } else if (lastGroupObject != null && searchLineItems[i].param_two == 0){
      //Push to the grouping
      lastGroupObject.items.push(searchLineItems[i]);
    //This is the end of the grouping
    } else if (lastGroupObject != null && searchLineItems[i].param_two == 1){
      lastGroupObject.items.push(searchLineItems[i]);
      //reset the group placeholder and add the current one to the list of grouped objects.
      grouped.push(lastGroupObject);
      lastGroupObject = null;
    } else {
      //This isn't a grouping, just push the line item
      grouped.push(searchLineItems[i]);
    }
    //continue on
    i++;
  }
  var mongoSearchObject = {};
  //Now we are going to build a nosql object for each of the items
  for (var i = 0; i < grouped.length; i++){
    //This is a grouped object
    if ('last_junction' in grouped[i]){
      //create a parent object to hold this grouping
      var subSearchItem = {};
      //create an array to hold the search items
      subSearchItem[operatorToNoSQL(grouped[i].junction)] = [];
      //for each of the line items, get a search item
      grouped[i].items.forEach(function(l){
        subSearchItem[operatorToNoSQL(grouped[i].junction)].push(getSearchObject(reportType,l.field, l.operator, l.value));
      });
      //Add it to the correct parent operator
      //Check if the parent operator exists in the parent object
      if (operatorToNoSQL(grouped[i].last_junction) in mongoSearchObject){
        mongoSearchObject[operatorToNoSQL(grouped[i].last_junction)].push(subSearchItem);
      } else {
        //create a new array to store the items
        mongoSearchObject[operatorToNoSQL(grouped[i].last_junction)] = [];
        mongoSearchObject[operatorToNoSQL(grouped[i].last_junction)].push(subSearchItem);
      }
    } else {
      //Check if the search object has this operator, if not add it
      if (operatorToNoSQL(grouped[i].junction) in mongoSearchObject){
        //Create a nosql line item
        var lineItem = getSearchObject(reportType,grouped[i].field, grouped[i].operator, grouped[i].value);
        //push it to the mongo search object
        mongoSearchObject[operatorToNoSQL(grouped[i].junction)].push(lineItem);
      } else {
        //Create a nosql line item
        var lineItem = getSearchObject(reportType,grouped[i].field, grouped[i].operator, grouped[i].value);
        //create an array to store the searches
        mongoSearchObject[operatorToNoSQL(grouped[i].junction)] = [];
        mongoSearchObject[operatorToNoSQL(grouped[i].junction)].push(lineItem);
      }
    }
    console.log(mongoSearchObject);
  }
  return mongoSearchObject;
}

// exports.parseIntoQuery = function(searchLineItems, reportType){
//   var searchObject = {};
//   //Loop throught the query and build up the search query
//   for (var i = 0; i < searchLineItems.length; i++){
//     //Make sure the line item was actually filled out
//     if (Object.keys(searchLineItems[i]).length > 0 && searchLineItems[i].value != ''){
//       var line = searchLineItems[i];
//       console.log(line);
//       //see if we need to add a new conidtion or use the last one in the query
//       var operatorsInSearch = Object.keys(searchObject);
//       console.log(operatorsInSearch);
//       //Check if we need to add this operator to the search object
//       if (operatorsInSearch.length == 0 || operatorsInSearch[operatorsInSearch.length - 1] != operatorToNoSQL(line.junction)){
//         if (i == 0){
//           //add the new operator
//           searchObject[operatorToNoSQL(searchLineItems[1].junction)] = [];
//         } else {
//           //add the new operator
//           searchObject[operatorToNoSQL(line.junction)] = [];
//         }
//       }
//       //If if it's the first item add it fto whatever the second operator is
//       var lineItemSearchObject = getSearchObject(reportType,line.field, line.operator, line.value);
//       console.log(lineItemSearchObject);
//       if (i == 0){
//         //Add the serach item to the correct operator
//         searchObject[operatorToNoSQL(searchLineItems[1].junction)].push(lineItemSearchObject);
//       } else {
//         //Add the serach item to the correct operator
//         searchObject[operatorToNoSQL(line.junction)].push(lineItemSearchObject);
//       }
//     }
//   }
//   return searchObject;
// }


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

exports.getReports = function(){
  return new Promise(function(resolve,reject) {
    db.get().query('SELECT reports.*, users.email FROM reports JOIN users ON reports.created_by = users.id', function(error, results, fields) {
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
  //Check if we need to replace a parenthesis with a boolean value
  if (lineItem.parenthesis_one == "("){
    lineItem.parenthesis_one = true;
  }
  if (lineItem.parenthesis_two == ")"){
    lineItem.parenthesis_two = true;
  }
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

exports.getReportById = function(reportId){
  return new Promise(function(resolve,reject) {
    db.get().query('SELECT * FROM reports WHERE id = ?',[reportId], function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        //Now get the line items
        var reportObj = results[0];
        db.get().query('SELECT * FROM reports_line_item WHERE report_id = ?',[reportId], function(error, results, fields) {
          if (error) {
            reject(error);
          } else {
            //Setup the line items
            reportObj.line_items = results;
            resolve(reportObj);
          }
        });
      }
    });
  });
}

function getSearchObject(collection, field, operation, searchValue){
  var pathString = collection + "." + field;
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
    return `/.*${value}.*/`;
  } else if (operation == "does not contain"){
    return "{ $not: /.*"+value+".*/ }";
  }
  return '';
}
