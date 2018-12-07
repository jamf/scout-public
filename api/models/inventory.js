var db = require('../common/db.js');
var devices = require('./device.js');
var Throttle = require('promise-parallel-throttle');
//Feel free to edit this if your server has low availablity
const jpsMaxConnections = 3;

//This function handles getting inventory data for every device and storing it in mongo nosqldb
exports.getFullInventory = function(serverUrl, username, password, jssId){
  return new Promise(function(resolve,reject) {
    //Get all of the devices for this server
    devices.getStoredDevicesByServer(serverUrl)
    .then(function(devicesList){
      //Create a list of promises to be executed, but throttled to not overwhelm the JPS
      const queue = devicesList.map(device => () => devices.getExpandedInventory(serverUrl,username, password,device, jssId));
      //In my tests, five devices seems to be fast enough, but still has never crashed a server
      var opts = { maxInProgress : jpsMaxConnections, failFast : false};
      //Returns a list of promise results just like promise.all
      resolve(Throttle.all(queue, opts));
    })
    .catch(error => {
      console.log(error);
      reject(error);
    });
  });
}

//Gets the most recent expanded inventory record for a given scout device id
exports.getExpandedInventoryById = function(collection, id){
  return new Promise(function(resolve,reject) {
    devices.getDeviceById(id)
    .then(function(deviceObj){
      //Use the server id and jss device id to get the device from mongo
      db.getNoSQL().collection(collection).findOne({ jss_id : deviceObj[0].jss_id, jss_server_id : deviceObj[0].server_id}, function(err, result) {
        if (err){
          reject(err);
        } else {
          resolve(result);
        }
      });
    })
    .catch(error => {
      console.log(error);
      reject(error);
    });
  });
}
