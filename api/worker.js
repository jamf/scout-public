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
//Check if we are updating a batch server or the mongo db
var serverType = 'limited';
if (process.argv.length > 3){
  serverType = process.argv[3];
}
//Connect to the db and start updating
db.connect(function(err) {
  if (err) {
    console.log('Unable to connect to database.');
    process.exit(1);
  } else {
    if (serverType == 'patch'){
      patch.handleWorkerUpdates(serverURL)
      .then(function(result){
        console.log(result.length + ' patches updated!');
      })
      .catch(function(error){
        console.log('Unable to update patches for server.');
        console.log(error);
        process.exit(1);
      });
    //Expanded records are inserted into a nosql mongo database for bulk storage
    } else if (serverType == 'expanded'){
      //Connect to the NoSQL database
      db.connectNoSQL(function(err){
        if (err){
          console.log('Unable to connect to database.');
          process.exit(1);
        }
        //Get all of the devices from the database
        servers.getServerFromURL(serverURL)
        .then(function(serverDetails){
          return inventory.getFullInventory(serverURL,serverDetails[0].username, db.decryptString(serverDetails[0].password), serverDetails[0].id)
        })
        .then(function(fullApiDevices){
          //After getting all of the devices from the jss insert them
          Promise.all(fullApiDevices.map(deviceObj => devices.insertFullInventory(deviceObj))).then(function(results){
            console.log('Inserted ' + results.length + ' expanded inventories');
            process.exit(0);
          });
        })
        .catch(error => {
          console.log('Unable to insert all inventory');
          process.exit(1);
        });
      });
    } else if (serverType == 'limited'){
       //Update the ScoutAdmin user's password to a new string
      servers.updateScoutAdminUserPassword(serverURL)
      .then(function(result){
        console.log('ScoutAdmin user password has been updated');
      })
      .catch(function(error){
        console.log('Error updating scout admin user');
      });
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
            process.exit(0);
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
