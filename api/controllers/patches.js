var patches = require('express').Router();
var patch = require('../models/patch.js');

patches.get('/software', function(req,res) {
  //Get all of the patches from the server
  patch.getPatchesFromFile()
  .then(function(patches){
    var patchList = [];
    //Parse each full patch to a subset for response
    patches.forEach(function(p) {
      patchList.push(getPatchSubset(p));
    });
    res.status(200).send(patchList);
  })
  .catch(error => {
    console.log(error);
    res.status(500).send({
      error: "Unable to read patches"
    });
  });
});

patches.get('/servers', function(req,res){
  patch.getPatchServers()
  .then(function(servers){
    res.status(200).send(servers);
  })
  .catch(error => {
    res.status(500).send({
      error: "Unable to get servers"
    });
  });
});

patches.post('/servers/create', function(req,res){
  if (req.body.url == null || req.body.cron == null){
    return res.status(400).send({
      error: "Missing required fields"
    });
  }
  //Add the server to the database
  var server = { "base_url" : req.body.url, "cron_update" : req.body.cron};
  patch.addPatchServer(server)
  .then(function(result){
    res.status(200).send(server);
  })
  .catch(error => {
    res.status(500).send({
      error: "Unable to add server to database"
    });
  });
});

patches.get('/software/:titles', function(req,res) {
  var softwareTitles = [];
  //Check if multiple titles have been provided
  if (req.params.titles.includes(',')){
    softwareTitles = req.params.titles.split(',');
  } else {
    softwareTitles.push(req.params.titles);
  }
  Promise.all(softwareTitles.map(patchId => patch.getPatchById(patchId)))
  .then(function(files){
    var patchList = [];
    files.forEach(function(p) {
      patchList.push(getPatchSubset(p));
    });
    res.status(200).send(patchList);
  })
  .catch(error => {
    console.log(error);
    res.status(500).send({
      error: "Unable to read patches"
    });
  });
});

patches.get('/patch/:titleId', function(req,res) {
  var softwareId = req.params.titleId;
  patch.getPatchById(softwareId)
  .then(function(file){
    res.status(200).send(file);
  })
  .catch(error => {
    res.status(500).send({
      error: "Unable to read patches"
    });
  });
});

function getPatchSubset(fullPatch){
  return { "currentVersion" : fullPatch.currentVersion, "id" : fullPatch.id, "lastModified" : fullPatch.lastModified, "name" : fullPatch.name, "publisher" : fullPatch.publisher };
}

module.exports = patches;
