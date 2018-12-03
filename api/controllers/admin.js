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
  admin.readCurrentEnvSettings()
  .then(function(settings){
    //return the settings object
    return res.status(200).send(settings);
  })
  .catch(error => {
    return res.status(500).send({error: "Unable to read settings"});
  });
});

module.exports = adminController;
