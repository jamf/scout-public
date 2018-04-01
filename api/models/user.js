var db = require('../common/db.js');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var secretKey = process.env.JWT_KEY;

exports.getUserFromEmail = function(email) {
  return new Promise(function(resolve,reject) {
    db.get().query('SELECT * FROM users WHERE email = ?',email, function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.createUser = function(email, password){
  var hash = bcrypt.hashSync(password, 10);
  var obj = { email : email, hash : hash};
  //Check for existing email already
  return new Promise(function(resolve,reject) {
    exports.getUserFromEmail(email)
    .then(function(result) {
      console.log(result);
      if (result.length == 0){
        db.get().query('INSERT INTO users SET ?', [obj], function(error, results, fields) {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            var userObject = {id : results.insertId, email : email, hash : hash};
            resolve(userObject);
          }
        });
      } else {
        reject({"status" : 'Email already exists.'});
      }
    })
    .catch(error => {
      reject(error);
    });
  });
}
