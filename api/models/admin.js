var db = require('../common/db.js');
var fs = require('fs');

//Returns various env variables excluding passwords and enc keys
exports.readCurrentEnvSettings = function(){
  return new Promise(function(resolve,reject) {
    fs.readFile('.env', 'utf8', function(err, contents) {
      if (err){
        reject(err);
      }
      //Split it by line and return anything that isn't a password
      var fileSplit = contents.split("\n");
      var resObj = {};
      fileSplit.forEach(function(l){
        if (!l.includes('KEY') && !l.includes('PASS')){
          //Split up the values
          var lineSplit = l.split("=");
          resObj[lineSplit[0]] = lineSplit[1];
        }
      });
      resolve(resObj);
    });
  });
}
