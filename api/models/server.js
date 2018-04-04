var db = require('../common/db.js');
var https = require('https');
var axios = require('axios')
//Allow self signed certs
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

exports.addNewServer = function(url, username, password, cron){
  return new Promise(function(resolve,reject) {
    //Make sure we can make a connection to the jamf pro server
    exports.checkConnection(url,username,password)
    .then(function(res){
      //Need to parse to a string due to how JPS returns JSON, then back to object
      return JSON.parse(JSON.stringify(res));
    })
    //Insert the server into the database
    .then(function(response){
      //Built an object to represent the server
      console.log(response);
      //Encrypt the password - it's not super secure, but it needs to be read later and this is better than plaintext
      var data = { "url" : url, "username" : username, "password" : db.encryptString(password), "cron_update" : cron,
                   "org_name" : response.activation_code.organization_name, "activation_code" : response.activation_code.code};
      db.get().query('INSERT INTO servers SET ?', [data], function(error, results, fields) {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    })
    .catch(function (error) {
      console.log(error);
      reject(error);
    });
  });
}

exports.checkConnection = function(url, username, password){
  return new Promise(function(resolve,reject) {
    axiosInstance.get(url + '/JSSResource/activationcode', {
      auth: {
        username: username,
        password: password
      }
    })
    .then(function (response) {
      resolve(response.data);
    })
    .catch(function (error) {
      console.log(error);
      reject(error);
    });
  });
}

exports.getAllServers = function(){
  return new Promise(function(resolve,reject) {
    db.get().query('SELECT * FROM servers', function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.deleteServer = function(id) {
  return new Promise(function(resolve,reject) {
    db.get().query('DELETE FROM servers WHERE id = ?',id, function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.getServerFromURL = function(url){
  return new Promise(function(resolve,reject) {
    db.get().query('SELECT * FROM servers WHERE url = ?', url, function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.getDeviceByTypeFromJPS = function(url,type,username,password){
  return new Promise(function(resolve,reject) {
    axiosInstance.get(url + '/JSSResource/'+type+'/subset/basic', {
      auth: {
        username: username,
        password: password
      }
    })
    .then(function (response) {
      resolve(response.data);
    })
    .catch(function (error) {
      console.log(error);
      reject(error);
    });
  });
}

function translateAPIDeviceToDatabaseObject(device, serverId, type){
  var lastDate;
  if (type == "mobile" || type == "tv"){
    lastDate = device.last_inventory_update_utc;
  } else {
    lastDate = device.report_date_utc;
  }
  var dbObject = {"server_id" : serverId, "device_type" : type, "jss_id" : device.id, "jss_name" : device.name,
                  "jss_serial" : device.serial_number, "jss_last_inventory" : lastDate,
                  "jss_model" : device.model, "jss_managed" : device.managed, "jss_udid" : device.udid, "expanded_inventory" : true};
  return dbObject;
}

exports.getAllDevices = function(url, serverId, username, password){
  return new Promise(function(resolve,reject) {
    var deviceTypes = ['computers', 'mobiledevices'];
    Promise.all(deviceTypes.map(type => exports.getDeviceByTypeFromJPS(url,type,username,password))).then(function(allDevices) {
      var parsedDeviceObjects = [];
      for (i = 0; i < allDevices.length; i++){
        //Parse to JS object due to the way JPS API returns JSON
        var deviceObjList = JSON.parse(JSON.stringify(allDevices[i]));
        if ('computers' in deviceObjList){
          var unparsedList = deviceObjList.computers;
          unparsedList.forEach(function(d) {
            parsedDeviceObjects.push(translateAPIDeviceToDatabaseObject(d, serverId, 'computer'));
          });
        } else if ('mobile_devices' in deviceObjList){
          var unparsedList = deviceObjList.mobile_devices;
          unparsedList.forEach(function(d) {
            //sort out tvos devices since they are stored as 'mobiledevices' in the jss
            if (d.model.includes('Apple TV')){
              parsedDeviceObjects.push(translateAPIDeviceToDatabaseObject(d, serverId, 'tv'));
            } else {
              parsedDeviceObjects.push(translateAPIDeviceToDatabaseObject(d, serverId, 'mobile'));
            }
          });
        }
      }
      resolve(parsedDeviceObjects);
    })
    .catch(function (err){
      reject(err);
    });
  });
}
