// Load .env file into Environment Variables
require('dotenv').config();

var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var compression = require('compression');
var helmet = require('helmet');
var jwt = require('express-jwt');
var jwttoken = require('jsonwebtoken');
var cors = require('cors');
var schedule = require('node-schedule');
var exec = require('child_process').exec;

//Check for a JWT Key, if not set to 'local' for tests
if (!process.env.JWT_KEY){
  process.env.JWT_KEY = 'local';
}
//Sets up jwt object to verify key in auth header
var jwtCheck = jwt({
  secret: process.env.JWT_KEY
});

var app = module.exports = express();
//Serve up the reports
app.use('/reports', express.static('reports'));
//serve the app contents
app.use(express.static('../app'));
//Basic application hardening
app.use(helmet());
// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Allow cross origin requests
app.use(cors());
app.use(compression()); //Compress all routes
//require auth to use endpoints
app.use('/servers', jwtCheck);
app.use('/devices', jwtCheck);
//Provide custom response middleware
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send(' ');
  }
});
//Setup routes
app.use('/servers', require('./controllers/servers'));
app.use('/devices', require('./controllers/devices'));
app.use('/webhooks', require('./controllers/webhooks'));
app.use('/patches', require('./controllers/patches'));
app.use('/users', require('./controllers/users'));

//Serve the web app
app.get('/', function(req, res) {
  res.sendFile('../app/index.html');
});

var servers = require('./models/server.js');
var devices = require('./models/device.js');

if (!module.parent) {
  var db = require('./common/db.js');
  db.connect(function(err) {
    if (err) {
      console.log('Unable to connect to database.');
      process.exit(1);
    } else {
      var port = process.env.PORT || 3000;
      app.listen(port, function() {
        console.log("  ___              _   ");
        console.log(" / __| __ ___ _  _| |_ ");
        console.log(" \\__ \\/ _/ _ \\ || |  _|");
        console.log(" |___/\\__\\___/\\_,_|\\__|");
        console.log("                       ");
        console.log("Written by Jacob Schultz");
        console.log("                       ");
        console.log('Express started on port ' + port);
      });
      //For every server in the database, we should schedule the updates for them
      servers.getAllServers()
      .then(function(serverList){
        var scheduledJobs = [];
        //For ever server in the database
        for (i = 0; i < serverList.length; i++){
          //Create and schedule a new job and bind the server url
          var j = schedule.scheduleJob(serverList[i].url,serverList[i].cron_update, function(serverURL){
            //Update the servers in a new thread
            exec('node ./worker.js ' + serverURL + ' limited', function(error, stdout, stderr) {
              console.log('Background worker: ', stdout);
              if (error !== null) {
                console.log('exec error: ', error);
              }
            });
          }.bind(null,serverList[i].url));
          //Add it to our list of jobs
          scheduledJobs.push(j);
          //Now create a schedule job to get exapnded device inventory
          var e = schedule.scheduleJob(serverList[i].url,serverList[i].cron_update, function(serverURL){
            //Update the servers in a new thread
            exec('node ./worker.js ' + serverURL + ' expanded', function(error, stdout, stderr) {
              console.log('Background worker: ', stdout);
              if (error !== null) {
                console.log('exec error: ', error);
              }
            });
          }.bind(null,serverList[i].url));
          //Add it to our list of jobs
          scheduledJobs.push(e);
        }
        console.log((scheduledJobs.length / 2) + ' servers are scheduled to update');
      })
      .catch(function(error){
        console.log(error);
      });
    }
  });
}
