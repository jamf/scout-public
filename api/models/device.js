var db = require('../common/db.js');
var inventory = require('./inventory.js');
var https = require('https');
var axios = require('axios')
//Allow self signed certs
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

exports.upsertDevice = function(deviceData){
  return new Promise(function(resolve,reject) {
    //Try to get the device first
    exports.getDeviceByUDID(deviceData.jss_udid)
    .then(function(results) {
      //If it exists, update it, else insert new device
      if (results.length == 0){
        exports.insertNewDevice(deviceData)
        .then(function(data){
          resolve(data.insertId);
        })
        .catch(error => {
          reject(error);
        });
      } else {
        exports.updateDevice(deviceData, deviceData.jss_id, deviceData.device_type)
        .then(function(data){
          resolve(results[0].id);
        })
        .catch(error => {
          reject(error);
        });
      }
    })
    .catch(error => {
      reject(error);
    });
  });
}

exports.getExpandedInventory = function(url, username, password, device, jssServerId) {
  return new Promise(function(resolve,reject) {
    //First translate mobile device to what the JPS API expects
    var scoutDeviceType = device.device_type;
    if (device.device_type == 'mobile'){
      device.device_type = 'mobiledevice';
    }
    //Get the device information
    axiosInstance.get(url + '/JSSResource/' + device.device_type + 's/id/'+device.jss_id, {
      auth: {
        username: username,
        password: password
      },
      headers: {'Accept': 'application/json'}
    })
    .then(function (response) {
      //add the server id to the returned object
      response.data.jss_server_id = jssServerId;
      resolve(response.data);
    })
    .catch(function (error) {
      console.log('Failed to get a device!');
      reject(error);
    });
  });
}

exports.getDeviceById = function(scoutDeviceId){
  return new Promise(function(resolve,reject) {
    db.get().query('SELECT * FROM devices JOIN servers ON devices.server_id = servers.id WHERE devices.id = ?', [scoutDeviceId], function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.getDeviceByUDIDAndSerial = function(serial, udid){
  return new Promise(function(resolve,reject) {
    db.get().query('SELECT * FROM devices JOIN servers ON devices.server_id = servers.id WHERE devices.jss_serial = ? AND devices.jss_udid = ?', [serial, udid], function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.getDeviceByUDID = function(udid) {
  return new Promise(function(resolve,reject) {
    db.get().query('SELECT devices.*, servers.org_name FROM devices JOIN servers ON devices.server_id = servers.id WHERE jss_udid = ?', udid, function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.deleteDevicesByJPSId = function(jpsId){
  return new Promise(function(resolve,reject) {
    db.get().query('DELETE FROM devices WHERE server_id = ?',jpsId, function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.getAllDevices = function() {
  return new Promise(function(resolve,reject) {
    db.get().query('SELECT devices.*, servers.org_name FROM devices JOIN servers ON devices.server_id = servers.id', function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.getDeviceByPlatform = function(platform) {
  return new Promise(function(resolve,reject) {
    db.get().query('SELECT devices.*, servers.org_name FROM devices JOIN servers ON devices.server_id = servers.id WHERE device_type = ?', platform, function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.getDeviceWithSearch = function(platform, search) {
  return new Promise(function(resolve,reject) {
  if (search != null && search != ''){
    var wild = '%' + search + '%';
    db.get().query('SELECT devices.*, servers.org_name FROM devices JOIN servers ON devices.server_id = servers.id WHERE device_type = ? AND (jss_name LIKE ? OR jss_serial LIKE ? OR jss_udid LIKE ?)', [platform,wild,wild,wild], function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  } else {
    db.get().query('SELECT devices.*, servers.org_name FROM devices JOIN servers ON devices.server_id = servers.id WHERE device_type = ?', platform, function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  }
  });
}

exports.getDevicesByOrg = function(orgName) {
  return new Promise(function(resolve,reject) {
    db.get().query('SELECT devices.*, servers.org_name FROM devices JOIN servers ON devices.server_id = servers.id WHERE server_id IN (SELECT id FROM servers WHERE org_name = ?)', orgName, function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.getStoredDevicesByServer = function(jssURL) {
  return new Promise(function(resolve,reject) {
    db.get().query('SELECT devices.*, servers.org_name FROM devices JOIN servers ON devices.server_id = servers.id WHERE server_id IN (SELECT id FROM servers WHERE url = ?)', jssURL, function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.insertNewDevice = function(deviceData){
  return new Promise(function(resolve,reject) {
    db.get().query('INSERT INTO devices SET ?', deviceData, function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.updateDevice = function(deviceData, deviceId, type){
  return new Promise(function(resolve,reject) {
    db.get().query('UPDATE devices SET ? WHERE id = ? AND device_type = ?', [deviceData, deviceId, type], function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.upsertFullInventory = function(deviceObjFromJSS, jss_server_id){
  return new Promise(function(resolve,reject) {
    //Set the colleciton name
    var collectionName = 'computer';
    if ('mobile_device' in deviceObjFromJSS){
      collectionName = 'mobile_device';
    }
    var jss_id = deviceObjFromJSS[collectionName].general.id;
    //See if there is already a record for this device
    exports.getFullInventoryByJSSAndServerId(collectionName, jss_id, jss_server_id)
    .then(function(existingDevice){
      //We didn't find a device
      if (existingDevice == null){
        //Return a promise based on the status of the insert
        resolve(exports.insertFullInventory(deviceObjFromJSS));
      } else {
        resolve(exports.updateFullInventory(deviceObjFromJSS, { jss_id : jss_id, jss_server_id : jss_server_id}));
      }
    })
    .catch(error => {
      console.log(error);
      reject(error);
    });
  });
}

exports.getFullInventoryByJSSAndServerId = function(collection, jss_id, jss_server_id){
  return new Promise(function(resolve,reject) {
    db.getNoSQL().collection(collection).findOne({ jss_id : jss_id, jss_server_id : jss_server_id}, function(err, result) {
      if (err){
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

exports.updateFullInventory = function(deviceObj, searchObject){
  var collectionName = 'computer';
  if ('mobile_device' in deviceObj){
    collectionName = 'mobile_device';
  }
  //Add the jss id to the top of the object to make searching easier
  deviceObj.jss_id = deviceObj[collectionName].general.id;
  return new Promise(function(resolve,reject) {
    //Make the update
    db.getNoSQL().collection(collectionName).replaceOne(searchObject,deviceObj, function(err, result) {
      if (err){
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

exports.insertFullInventory = function(deviceObj){
  var collectionName = 'computer';
  if ('mobile_device' in deviceObj){
    collectionName = 'mobile_device';
  }
  //Add the jss id to the top of the object to make searching easier
  deviceObj.jss_id = deviceObj[collectionName].general.id;
  return new Promise(function(resolve,reject) {
    db.getNoSQL().collection(collectionName).insertOne(deviceObj, function(err, result) {
      if (err){
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}
