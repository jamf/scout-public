var servers = require('express').Router();
var server = require('../models/server.js');
var db = require('../common/db.js');
var device = require('../models/device.js');
var schedule = require('node-schedule');
var exec = require('child_process').exec;
var cron = require('../common/cron-handler.js');

servers.post('/add', function(req,res) {
  if (req.body.url == null || req.body.username == null || req.body.password == null){
    return res.status(400).send({
      error : "Missing Required Fields"
    });
  }
  server.addNewServer(req.body.url, req.body.username, req.body.password, req.body.cron)
  .then(function(result) {
    //Need to now resetup the cron jobs
    server.getAllServers()
    .then(function(serverList){
      //Take the server list and pass it to the handler
      cron.handleServerRecords(serverList)
      .then(function(cronResult){
        res.status(201).send({ status : "success" });
      })
      .catch(function(error){
        res.status(206).send({ error : "Unable to verify cron jobs, please restart your server to fix this." });
        console.log(error);
      });
    })
    .catch(function(error){
      res.status(206).send({ error : "Unable to verify cron jobs, please restart your server to fix this." });
      console.log(error);
    });
  })
  .catch(error => {
    console.log(error);
    if (error.error == "Unable to contact server"){
      return res.status(401).send({ error: "Unable to contact JPS Server - check creds and try again"});
    } else if (error.error == "Unable to insert server to the database"){
      return res.status(500).send({ error: "Unable to insert server to the database. Check the scout logs."});
    } else if (error.error == "Unable to setup scout admin user"){
      return res.status(206).send({ error: "Unable to setup the scout admin user, emergency access will not function."});
    }
    res.status(500).send({ error: "Unkown error has occured"});
  });
});

servers.post('/access/', function(req,res){
  //Make sure this user has access to view passwords
  console.log(req.user);
  //First make sure there is a password that hasn't been destroyed
  server.getServerFromURL(req.body.url)
  .then(function(serverDetails){
    var encryptedPassword = serverDetails[0].scout_admin_password;
    if (encryptedPassword != '' && encryptedPassword != null){
      var resObj = { password : db.decryptString(encryptedPassword) };
      //destroy the password from the database
      server.setScoutAdminPassword(req.body.url, null)
      .then(function(result){
        res.status(200).send(resObj);
      })
      .catch(error => {
        console.log(error);
        res.status(500).send({
          error: "Unable to destory password, refusing to return password"
        });
      });
    } else {
      return res.status(400).send({
        error: "No emergency admin password has been setup for this server"
      });
    }
  })
  .catch(error => {
    console.log(error);
    res.status(400).send({
      error: "Unable to find server"
    });
  });
});

servers.delete('/delete/:id', function(req,res) {
  if (req.params.id == null){
    return res.status(400).send({
      error : "Missing Required Fields"
    });
  }
  var serverId = req.params.id;
  //Delete the server from the database
  server.deleteServer(serverId)
  .then(function(result) {
    //If success, then delete the devices for that jps
    device.deleteDevicesByJPSId(serverId)
    .then(function(result) {
      res.status(200).send({ status : "success" });
    })
    .catch(error => {
      console.log(error);
      res.status(500).send({
        error: "Unable to delete devices"
      });
    });
  })
  .catch(error => {
    console.log(error);
    res.status(500).send({
      error: "Unable to delete JPS server"
    });
  });
});

servers.get('/', function(req,res) {
  //Get all of the servers in the database
  server.getAllServers()
  .then(function(serverList){
    var servers = [];
    for (i = 0; i < serverList.length; i++){
      var s = { "id" : serverList[i].id, "url" : serverList[i].url, "username" : serverList[i].username, "org_name" : serverList[i].org_name, "ac" : serverList[i].activation_code, "cron" : serverList[i].cron_update};
      servers.push(s);
    }
    res.status(200).send({
      servers : servers
    });
  })
  .catch(error => {
    console.log(error);
    res.status(500).send({
      error: "Unable to get servers"
    });
  });
});

module.exports = servers;
