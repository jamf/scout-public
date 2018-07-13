var db = require('../common/db.js');
var devices = require('./device.js');

//This method handles updating all of the devices via the worker
exports.handleWorkerRecords = function(listOfDevices, serverURL, username, password){
  return new Promise(function(resolve,reject) {
    //First call the JSS API to get records
    Promise.all(listOfDevices.map(device => devices.getExpandedInventory(serverURL,username, db.decryptString(password),device))).then(function(responseFromJSSList){
      return responseFromJSSList;
    })
    //Now build records ready for the database
    .then(function(responseFromJSS){
      return exports.buildExpandedInventoryRecords(responseFromJSS);
    })
    //Now insert these to the database
    .then(function(databaseReadyRecords){
      Promise.all(databaseReadyRecords.map(record => exports.insertInventoryRecords(record))).then(function(results){
        resolve(results);
      })
      .catch(function(error){
        console.log('Error inserting expanded inventory devices');
        console.log(error);
        reject(error);
      });
    })
    .catch(function(error){
      console.log('Error getting devices from the JSS Inventory');
      console.log(error);
      reject(error);
    });
  });
}

exports.buildExpandedInventoryRecords = function(listOfDevicesFromJPSAPI){
  return new Promise(function(resolve,reject) {
    Promise.all(listOfDevicesFromJPSAPI.map(jssDevice => exports.buildExpandedInventoryRecord(jssDevice))).then(function(databaseReadyRecords){
      resolve(databaseReadyRecords);
    })
    .catch(function(error){
      console.log('Error Building Expanded Inventory');
      console.log(error);
      reject(error);
    });
  });
}

exports.buildExpandedInventoryRecord = function(jssResponse){
  return new Promise(function(resolve,reject) {
    exports.getExpandedInventoryTables()
    .then(function(result){
      //Get the root key
      var finalObj = {};
      for (var deviceType in jssResponse) {
        var keysToGet = ['general', 'location', 'purchasing', 'hardware'];
        //For each item, parse out the items we are intersted in
        keysToGet.forEach(function(k){
          var data = jssResponse[deviceType][k];
          //For every item
          for (var d in data){
            //Check if it's an item we care about
            if (result.includes(d)){
              finalObj[d] = data[d];
            }
          }
        });
      }
      //Replace the jss id before inserting to scout
      finalObj.jss_device_id = finalObj.id;
      finalObj.id = null;
      resolve(finalObj);
    })
    .catch(function (error) {
      console.log(error);
      reject(error);
    });
  });
}

exports.getExpandedInventoryTables = function(){
  return new Promise(function(resolve,reject) {
    db.get().query('SHOW COLUMNS FROM computer_inventory', function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        var fields = [];
        for (i = 0; i < results.length; i++){
          fields.push(results[i].Field);
        }
        //Now get the mobile devices
        db.get().query('SHOW COLUMNS FROM mobiledevice_inventory', function(error, results, fields) {
          if (error) {
            reject(error);
          } else {
            for (i = 0; i < results.length; i++){
              fields.push(results[i].Field);
            }
            resolve(fields);
          }
        });
      }
    });
  });
}

exports.insertInventoryRecords = function(inventory){
  var query = '';
  if (inventory.os_type == 'iOS'){
    query = 'INSERT INTO mobiledevice_inventory SET ?';
  } else {
    query = 'INSERT INTO computer_inventory SET ?';
  }
  return new Promise(function(resolve,reject) {
    db.get().query(query, [inventory], function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}
