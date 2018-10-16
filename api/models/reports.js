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
