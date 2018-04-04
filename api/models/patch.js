var fs = require('fs');
var https = require('https');
var axios = require('axios');
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});
var db = require('../common/db.js');
var path = require('path');


exports.getFilesInDirectory = function(path){
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      if (err){
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

exports.getPatchById = function(id){
  return exports.getFileToObject(process.env.PATCH_DIR, id + '.json');
}

exports.getFileToObject = function(path, softwareid){
  return new Promise((resolve, reject) => {
    fs.readFile(path + softwareid, 'utf8', (err, content) => {
      if(err) {
        reject(err)
      } else {
        try {
          var obj = JSON.parse(content);
          //Get just the id of the software from the file path
          if (softwareid.includes('.json')){
            obj.id = softwareid.split('.')[0];
          } else {
            obj.id = softwareid;
          }
          resolve(obj);
        } catch(err) {
          reject(err)
        }
      }
    })
  });
}

exports.addNewPatchServer = function(serverBaseURL, updateTime){
  var data = {"base_url" : serverBaseURL, "cron_update" : updateTime};
  db.get().query('INSERT INTO patch_servers SET ?', [data], function(error, results, fields) {
    if (error) {
      reject(error);
    } else {
      resolve(results);
    }
  });
}

exports.getPatchServers = function(){
  return new Promise(function(resolve,reject) {
    db.get().query('SELECT * FROM patch_servers', function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.addPatchServer = function(server){
  return new Promise(function(resolve,reject) {
    db.get().query('INSERT INTO patch_servers SET ?', server, function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

exports.getAllPatchesFromServer = function(serverURL){
  return new Promise(function(resolve,reject) {
    axiosInstance.get(serverURL + '/software')
    .then(function (response) {
      resolve(response.data);
    })
    .catch(function (error) {
      console.log(error);
      reject(error);
    });
  });
}

exports.writePatchFromServer = function(serverURL, patchId){
  return new Promise(function(resolve,reject) {
    console.log(patchId);
    axiosInstance.get(serverURL + '/patch/' + patchId)
    .then(function (response) {
      exports.writePatchToFile(patchId, response.data)
      .then(function(file){
        resolve(file);
      })
      .catch(function (error) {
        //console.log(error);
        reject(error);
      });
    })
    .catch(function (error) {
      reject(error);
    });
  });
}

exports.writePatchToFile = function (patchId, content){
  return new Promise(function(resolve,reject) {
    fs.writeFile(process.env.PATCH_DIR + patchId + '.json', content, function(err) {
      if(err) {
        reject(err);
      } else {
        resolve(process.env.PATCH_DIR + patchId + '.json');
      }
    });
  });
}

exports.getPatchesFromFile = function(){
  return new Promise(function(resolve,reject) {
    exports.getFilesInDirectory(process.env.PATCH_DIR)
    .then(function(files){
      //Read each title and return it
      resolve(Promise.all(files.map(f => exports.getFileToObject(process.env.PATCH_DIR,f))));
    })
    .catch(function (error) {
      reject(error);
    });
  });
}
