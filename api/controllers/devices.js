var devices = require('express').Router();
var device = require('../models/device.js');
var report = require('../models/export.js');

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
