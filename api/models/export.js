var db = require('../common/db.js');
var device = require('./device.js');
var fs = require('fs');

function deviceRowToCSV(mysqlObject){
  var row = mysqlObject.id + ',' + mysqlObject.server_id + ',' + mysqlObject.org_name + ',' + mysqlObject.device_type + ',' + mysqlObject.jss_id + ',' +
            mysqlObject.jss_name + ',' + mysqlObject.jss_serial + ',' + mysqlObject.jss_last_inventory + ',' + mysqlObject.jss_udid + ',' +
            mysqlObject.jss_os_version + ',' + mysqlObject.jss_managed + ',' + mysqlObject.jss_Model;
  return row;
}
exports.writeCSVOfAllDevices = function(){
  return new Promise(function(resolve,reject) {
    device.getAllDevices()
    .then(function(devices){
      var header = 'id,server_id,org_name,device_type,jss_id,jss_name,jss_serial,jss_last_inventory,jss_udid,jss_os_version,jss_managed,jss_Model';
      var stream = fs.createWriteStream("./reports/all_devices_"+Date.now()+".txt");
      stream.once('open', function(fd) {
        stream.write(header);
        for (i = 0; i < devices.length; i++){
          stream.write(deviceRowToCSV(devices[i]));
        }
        stream.end();
      });
      resolve(stream);
    })
    .catch(error => {
      reject(error);
    })
  })
}
