require('dotenv').config();
//Setup modules to use
var schedule = require('node-schedule');
var servers = require('./models/server.js');
var devices = require('./models/device.js');
var patch = require('./models/patch.js');
var inventory = require('./models/inventory.js');
var db = require('./common/db.js');
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = process.env.ENC_KEY;
//Get the url passed in for this server to update
var serverURL = process.argv[2];
//check if it's a patch server that is updating
var isPatch = false;
if (process.argv.length > 3){
  isPatch = process.argv[3];
}


//Connect to the db and start updating
db.connect(function(err) {
  if (err) {
    console.log('Unable to connect to database.');
    process.exit(1);
  } else {
    if (isPatch){
      patch.handleWorkerUpdates(serverURL)
      .then(function(result){
        console.log(result.length + ' patches updated!');
      })
      .catch(function(error){
        console.log('Unable to update patches for server.');
        console.log(error);
        process.exit(1);
      });
    } else {
      console.log('Getting all devices for: ' + serverURL);
      var serverId;
      //Get the server details from the database
      servers.getServerFromURL(serverURL)
      .then(function(serverDetails){
        //get all of the devices for that server
        serverId = serverDetails[0].id;
        servers.getAllDevices(serverURL, serverDetails[0].id, serverDetails[0].username, db.decryptString(serverDetails[0].password))
        .then(function(allDevicesList){
          //Update each device in the database
          Promise.all(allDevicesList.map(deviceData => devices.upsertDevice(deviceData))).then(function(result){
            console.log(result.length + ' devices updated in the database');
            //Now check for expanded inventory devices
            devices.getExpandedDevicesByJSS(serverId)
            .then(function(expandedInventoryDevices){
              console.log(expandedInventoryDevices.length + ' expanded inventory devices will be updated');
              if (expandedInventoryDevices.length > 0){
                //There are expanded inventory devices, so insert them
                inventory.handleWorkerRecords(expandedInventoryDevices, serverURL,serverDetails[0].username, serverDetails[0].password)
                .then(function(result){
                  //Update complete, finish the process
                  process.exit(0);
                })
                .catch(function(error){
                  console.log(error);
                  process.exit(1);
                });
              } else {
                process.exit(0);
              }
            })
            .catch(function(error){
              console.log('Error Getting Expanded Inventory Devices');
              console.log(error);
              process.exit(1);
            });
          })
          .catch(function(error){
            console.log('Error Inserting Devices');
            console.log(error);
            process.exit(1);
          });
        })
        .catch(function(error){
          console.log('Error Getting Devices');
          console.log(error);
          process.exit(1);
        });
      })
      .catch(function(error){
        console.log('Error Getting Server from Database');
        console.log(error);
        process.exit(1);
      });

    }
  }
});
