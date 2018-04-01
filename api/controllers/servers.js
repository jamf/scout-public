var servers = require('express').Router();
var server = require('../models/server.js');
var device = require('../models/device.js');
var schedule = require('node-schedule');
var exec = require('child_process').exec;

servers.post('/add', function(req,res) {
  if (req.body.url == null || req.body.username == null || req.body.password == null){
    return res.status(400).send({
      error : "Missing Required Fields"
    });
  }
  server.addNewServer(req.body.url, req.body.username, req.body.password, req.body.cron)
  .then(function(result) {
    res.status(201).send({
          status : "success"
    });
    //Submit a scheduled job to update this server
    var j = schedule.scheduleJob(req.body.url,req.body.cron, function(serverURL){
      //Update the servers in a new thread
      exec('node ./worker.js ' + serverURL, function(error, stdout, stderr) {
        console.log('Background worker: ', stdout);
        if (error !== null) {
          console.log('exec error: ', error);
        }
      });
    }.bind(null,req.body.url));
  })
  .catch(error => {
    console.log(error);
    res.status(500).send({
      error: "Unable to add server"
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
