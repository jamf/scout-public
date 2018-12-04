var adminController = require('express').Router();
var user = require('../models/user.js');
var admin = require('../models/admin.js');

adminController.get('/all', function(req,res){
  //Make sure the user is an admin
  if (!user.hasPermission(req.user, 'is_admin')){
    //This user isn't authorized, exit
    return res.status(401).send({ error : "User has no permissions" });
  }
  //Get settings from the .env file, don't include passwords
  admin.readCurrentEnvSettings(false)
  .then(function(settings){
    //return the settings object
    return res.status(200).send(settings);
  })
  .catch(error => {
    return res.status(500).send({error: "Unable to read settings"});
  });
});

adminController.put('/all', function(req,res){
  //Make sure the user is an admin
  if (!user.hasPermission(req.user, 'is_admin')){
    //This user isn't authorized, exit
    return res.status(401).send({ error : "User has no permissions" });
  }
  if (!req.body || Object.keys(req.body).length == 0){
    return res.status(400).send({ error : "Must provide new file values" });
  }
  //Attempt to upsert the new file #TODO more validation on the user input
  admin.upsertNewSettings(req.body)
  .then(function(result){
    return res.status(200).send({status : "success"});
  })
  .catch(error => {
    return res.status(500).send({error : "Unable to update file"});
  });
});

module.exports = adminController;
