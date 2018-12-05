var db = require('../common/db.js');
var fs = require('fs');

//Returns various env variables excluding passwords and enc keys
exports.readCurrentEnvSettings = function(includePasswords){
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
        //Include the passwords if overridden
        } else if (includePasswords && (l.includes('KEY') || l.includes('PASS'))){
          //Split up the values
          var lineSplit = l.split("=");
          resObj[lineSplit[0]] = lineSplit[1];
        }
      });
      resolve(resObj);
    });
  });
}

exports.upsertNewSettings = function(newFile){
  return new Promise(function(resolve,reject) {
    //first get the existing file including passwords
    exports.readCurrentEnvSettings(true)
    .then(function(existingFile){
      //Write the new file
      exports.writeNewEnvSettings(existingFile, newFile)
      .then(function(result){
        if (result){
          resolve(result);
        }
        reject(result);
      })
      .catch(error => {
        reject(error);
      });
    })
    .catch(error => {
      reject(error);
    });
  });
}

exports.updateUserSettings = function(setting, newValue, userId){
  var q = 'UPDATE users SET ' + setting + ' = ? WHERE id = ?';
  return new Promise(function(resolve,reject) {
    db.get().query(q, [newValue,userId], function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.writeNewEnvSettings = function(existingFile, newFile){
  return new Promise(function(resolve,reject) {
    //Loop all of the new file objects and over write them in the existing file
    for (var key in newFile){
      //Check if the key is in the existing file, don't overrite passwords
      if (key in existingFile && !key.includes('KEY') && !key.includes('PASS')){
        //overwrite the value
        existingFile[key] = newFile[key];
      }
    }
    //Build a string from the new file map
    var fileString = '';
    for (var key in existingFile){
      if (existingFile[key] != undefined){
        fileString += key + '=' + existingFile[key] + "\n";
      }
    }
    //first make a backup of the existing file
    fs.copyFile('.env', '.env.bu', (err) => {
      if (err){
        reject(err);
      }
      //write the string to the new env
      fs.writeFile('.env', fileString, function(err) {
        if(err) {
          reject(err);
        }
        resolve(true);
      });
    });
  });
}
