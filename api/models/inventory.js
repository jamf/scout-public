var db = require('../common/db.js');

exports.buildExpandedInventoryRecord = function(jssResponse){
  console.log(jssResponse);
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
    db.get().query('SHOW COLUMNS FROM inventories', function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        var fields = [];
        for (i = 0; i < results.length; i++){
          fields.push(results[i].Field);
        }
        resolve(fields);
      }
    });
  });
}

exports.insertInventoryRecords = function(inventory){
  return new Promise(function(resolve,reject) {
    db.get().query('INSERT INTO inventories SET ?', [inventory], function(error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}
