var devices = require('express').Router();
var device = require('../models/device.js');
var report = require('../models/export.js');
var inventory = require('../models/inventory.js');
var db = require('../common/db.js');

devices.get('/server/:orgName', function(req,res) {
  device.getDevicesByOrg(req.params.orgName)
  .then(function(deviceList){
    res.status(200).send({
      devices : deviceList
    });
  })
  .catch(error => {
    res.status(500).send({
      error: "Unable to get devices"
    });
  });
});

devices.post('/paged/:deviceType', function(req,res) {
  var start = parseInt(req.body.start);
  var len = parseInt(req.body.length);
  var search = req.body.search.value;
  device.getDeviceWithSearch(req.params.deviceType, search)
  .then(function(deviceList){
    var obj = getDataTablesRes(req.body.draw,deviceList.slice(start, start + len),deviceList.length,deviceList.length);
    res.status(200).send(obj);
  })
  .catch(error => {
    res.status(500).send({
      error: "Unable to get devices"
    });
  });
});

devices.post('/paged/:deviceType', function(req,res) {
  var start = parseInt(req.body.start);
  var len = parseInt(req.body.length);
  var search = req.body.search.value;
  device.getDeviceWithSearch(req.params.deviceType, search)
  .then(function(deviceList){
    var obj = getDataTablesRes(req.body.draw,deviceList.slice(start, start + len),deviceList.length,deviceList.length);
    res.status(200).send(obj);
  })
  .catch(error => {
    res.status(500).send({
      error: "Unable to get devices"
    });
  });
});

devices.get('/', function(req,res) {
  device.getAllDevices()
  .then(function(deviceList){
    res.status(200).send({
      devices : deviceList
    });
  })
  .catch(error => {
    res.status(500).send({
      error: "Unable to get devices"
    });
  });
});

devices.get('/csv', function(req,res) {
  report.writeCSVOfAllDevices()
  .then(function(stream){
    //Send the server path
    res.status(200).send({ "status" : "success", "path" : process.env.SCOUT_URL + stream.path.substring(1,stream.path.length)});
  })
  .catch(error => {
    res.status(500).send({
      error: "Unable to write file"
    });
  });
});

//Gets an expanded inventory record by id
devices.get('/computers/expanded/:id', function(req,res){
  inventory.getExpandedInventoryById('computers',req.params.id)
  .then(function(result){
    res.status(200).send(result);
  })
  .catch(error => {
    res.status(500).send({
      error: "Unable to find device record"
    });
  });
});

//Gets a device live from the JPS by UDID and serial
devices.post('/live/:collection', function(req,res){
  //Make sure required fields are in the post
  if (req.body.serial == null || req.body.udid == null){
    return res.status(400).send({error: "Missing required fields"});
  }
  device.getDeviceByUDIDAndSerial(req.body.serial, req.body.udid)
  .then(function(deviceObj){
    //Now hit the JPS API
    device.getExpandedInventory(deviceObj[0].url,deviceObj[0].username, db.decryptString(deviceObj[0].password), deviceObj[0], deviceObj[0].id)
    .then(function(jpsAPIResponse){
      res.status(200).send(jpsAPIResponse);
    })
    .catch(error => {
      res.status(500).send({
        error: "Unable to hit the JPS API for this device"
      });
    });
  })
  .catch(error => {
    res.status(400).send({
      error: "Unable to find device record"
    });
  });
});

//Gets a device live from the JPS by scout id
devices.get('/live/:collection/:id', function(req,res){
  //First get the device object from the databse to lookup server details
  device.getDeviceById(req.params.id)
  .then(function(deviceObj){
    //Now use the server details to callout to the JPS
    device.getExpandedInventory(deviceObj[0].url,deviceObj[0].username, db.decryptString(deviceObj[0].password), deviceObj[0], deviceObj[0].id)
    .then(function(jpsAPIResponse){
      res.status(200).send(jpsAPIResponse);
    })
    .catch(error => {
      res.status(500).send({
        error: "Unable to hit the JPS API for this device"
      });
    });
  })
  .catch(error => {
    res.status(400).send({
      error: "Unable to find device record"
    });
  });
});

devices.get('/computers', function(req,res) {
  device.getDeviceByPlatform('computer')
  .then(function(deviceList){
    res.status(200).send({
      devices : deviceList
    });
  })
  .catch(error => {
    res.status(500).send({
      error: "Unable to get devices"
    });
  });
});

devices.get('/mobiledevices', function(req,res) {
  device.getDeviceByPlatform('mobile')
  .then(function(deviceList){
    res.status(200).send({
      devices : deviceList
    });
  })
  .catch(error => {
    res.status(500).send({
      error: "Unable to get devices"
    });
  });
});

devices.get('/tvs', function(req,res) {
  device.getDeviceByPlatform('tv')
  .then(function(deviceList){
    res.status(200).send({
      devices : deviceList
    });
  })
  .catch(error => {
    res.status(500).send({
      error: "Unable to get devices"
    });
  });
});

devices.get('/count/:deviceType', function(req,res) {
  device.getDeviceByPlatform(req.params.deviceType)
  .then(function(deviceList){
    res.status(200).send({ "size" : deviceList.length});
  })
  .catch(error => {
    console.log(error);
    res.status(500).send({
      error: "Unable to get devices"
    });
  });
});

function getBoolVal(origin){
  if (origin == '1' || origin == 1){
    return true;
  } else {
    return false;
  }
}
function getDataTablesRes(draw, data, totalRecords, filteredRecords){
  var dataList = [];
  for (i = 0; i < data.length; i++){
    var item = [ data[i].jss_name, data[i].org_name, data[i].jss_Model, data[i].jss_serial, data[i].jss_last_inventory, data[i].jss_udid, getBoolVal(data[i].jss_managed)];
    dataList.push(item);
  }
  return { "draw" : parseInt(draw), "recordsTotal" : totalRecords, "recordsFiltered" :  filteredRecords, "data" : dataList};
}

module.exports = devices;
