require('dotenv').config();
//Setup modules to use
var schedule = require('node-schedule');
var servers = require('./models/server.js');
var devices = require('./models/device.js');
var db = require('./common/db.js');
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = process.env.ENC_KEY;
//Get the url passed in for this server to update
var serverURL = process.argv[2];
//Connect to the db and start updating
db.connect(function(err) {
  if (err) {
    console.log('Unable to connect to database.');
    process.exit(1);
  } else {
    console.log('Getting all devices for: ' + serverURL);
    //Get the server details from the database
    servers.getServerFromURL(serverURL)
    .then(function(serverDetails){
      //get all of the devices for that server
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
});
