var db = require('../common/db.js');
var bcrypt = require('bcrypt-nodejs');
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

exports.getAllUsers = function(){
  return new Promise(function(resolve,reject) {
    db.get().query('SELECT id, email, can_edit, mdm_commands, can_delete, can_create, can_edit_users, can_build_reports FROM users', function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.createUser = function(email, password){
  return new Promise(function(resolve,reject) {
    //var hash = bcrypt.hashSync(password, 10);
    bcrypt.hash(password, null, null, function(err, hash) {
      var obj = { email : email, hash : hash};
      //Check for existing email already
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
  });
}
