var users = require('express').Router();
var user = require('../models/user.js');
var jwt = require('express-jwt');
var secretKey = process.env.JWT_KEY;
var bcrypt = require('bcrypt-nodejs');
var ldap = require('ldapjs');
var jwttoken = require('jsonwebtoken');


function createToken(user) {
  //Sign a new JWT token
  return jwttoken.sign(user, process.env.JWT_KEY, { expiresIn: 60*60*5 });
}

function authDN(dn, password, cb) {
  var client = ldap.createClient({url: process.env.LDAP_URL});
  client.bind(dn, password, function (err) {
    client.unbind();
    cb(err === null, err);
  });
}

users.post('/create', function(req, res) {
  //check for all fields in request
  if (!req.body.email || !req.body.password || !req.body.register_pin) {
    return res.status(400).send({
      error : "Missing Required Fields"
    });
  }
  if (req.body.register_pin != process.env.REG_PIN){
    return res.status(401).send({
      error : "Incorrect Register Pin"
    });
  }
  //Insert the user into the database
  user.createUser(req.body.email, req.body.password)
  .then(function(userObject){
    //Send a success with the token
    res.status(201).send({
          status : "success",
          token: createToken(userObject)
    });
  })
  .catch(error => {
    console.log(error);
    //Check for dupe user error
    if (error.hasOwnProperty('status')){
      res.status(409).send({
        error: "Email already exists"
      });
    } else {
      res.status(500).send({
        error: "Unable to create user"
      });
    }
  });
});

users.post('/login/basic', function(req, res) {
  //check for all fields in request
  if (!req.body.email || !req.body.password) {
    res.status(400).send({
      error : "Email and Password Required"
    });
  }
  //Get the user and verify password
  user.getUserFromEmail(req.body.email)
  .then(function(userObject){
    console.log(bcrypt.compareSync(req.body.password, userObject[0].hash));
    if (!userObject || !bcrypt.compareSync(req.body.password, userObject[0].hash)) {
      return res.status(401).send({
        error : "Unable to Log In"
      });
    }
    var user = { "id" : userObject[0].id, "email" : userObject[0].email, "can_mdm" : userObject[0].mdm_commands, "notificaitons" : userObject[0].notifications};
    var resp = { userId : userObject[0].id, token : createToken(user), "can_mdm" : userObject[0].mdm_commands, "notificaitons" : userObject[0].notifications};
    res.status(201).send(resp);
  })
  .catch(error => {
    console.error(error);
    res.status(400).send({
      error: "Unable to log in user"
    });
  });
});

users.post('/login/ldap', function(req, res) {
  if (!req.body.username || !req.body.password){
    return res.status(400).send({
      error : "Missing required fields - username, password"
    });
  }
  authDN('uid='+req.body.username+','+process.env.LDAP_STR, req.body.password, function(result,err){
    if (err){
      return res.status(401).send({
        error : "Unable to login"
      });
    } else {
      var user = { 'username' : req.body.username };
      return res.status(200).send({
        status : "success",
        token : createToken(user)
      });
    }
  });
});

module.exports = users;
