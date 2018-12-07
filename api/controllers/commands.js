var commands = require('express').Router();
var device = require('../models/device.js');
var db = require('../common/db.js');

commands.post('/create', function(req,res) {
  //Make sure the user has permissions
  if (!req.user || !hasPermission(req.user, 'can_mdm')){
    //This user isn't authorized, exit
    return res.status(401).send({ error : "User has no permissions" });
  }
  //Make sure the request if valid
  if (!req.body.mdmCommand || !req.body.deviceType || req.body.deviceList.length < 1){
    return res.status(400).send({ error : "Missing required fields" });
  }
  //Send the MDM commands
  device.sendMDMCommandToDevices(req.body.deviceList, req.body.mdmCommand)
  .then(function(results){
    return res.status(200).send({ status : "success" });
  })
  .catch(error => {
    return res.status(500).send({ status : "failed" });
  });
});

function hasPermission(userObject, permisison){
  return (userObject[permisison] == 1 || userObject[permisison] == true);
}

module.exports = commands;
