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

exports.getSearchObject = function(collection, category, field, searchValue){
  //Build the search query
  var searchObject = {};
  searchObject[collection] = {};
  var fieldSearch = {};
  fieldSearch[field] = searchValue;
  searchObject[collection][category] = fieldSearch;
  console.log(searchObject);
  return searchObject;
}
