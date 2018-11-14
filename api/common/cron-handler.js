//Cron tab module handles modifying system cron tabs
var crontab = require('cron-tab');
require('dotenv').config({path: '~/.env'});

exports.handleServerRecords = function(serverObjects){
  //Build a list to hand off to the cron handler
  var serverUrls = [];
  var cronList = [];
  var cronListExpanded = [];
  serverObjects.forEach(function(s){
    serverUrls.push(s.url);
    cronList.push(s.cron_update);
    cronListExpanded.push(s.cron_update_expanded);
  });
  return exports.upsertCronJobs(serverUrls, cronList, cronListExpanded);
}

//This function handles inserting new cron jobs, updating exisiting or deleting old jobs
exports.upsertCronJobs = function(serverList, cronList, cronListExpanded){
  return new Promise(function(resolve,reject) {
    const workerLocation = process.cwd() + '/worker.js';
    const logLocation = process.cwd() + '/logs/';
    //First load all of the exisiting cron tabs that are from scout
    crontab.load(function(err, crontab){
      //Filter to scout created jobs only
      var existingJobs = crontab.jobs({comment:/Scout-Update-/});
      //for all of the existing jobs, make sure they are still in the server, else delete them
      existingJobs.forEach(function(j){
        var isInServerList = false;
        var serverUrl = j.comment().split('-')[2];
        for (var i = 0; i < serverList.length && !isInServerList; i++){
          //Split up the comment of the job to get the server url
          if (serverUrl == serverList[i]){
            isInServerList = true;
          }
        }
        //If it isn't in there, remove it
        if (!isInServerList){
          var removeMatch = 'Scout-Update-'+serverUrl;
          crontab.remove({comment:removeMatch});
        }
      });
      //Now for all of the servers, make sure they have a job, if not create one
      for (var s = 0; s < serverList.length; s++){
        var shouldCreate = true;
        //Loop all the existing jobs to make sure it doesn't already exist
        existingJobs.forEach(function(j){
          var serverUrl = j.comment().split('-')[2];
          if (serverUrl == serverList[s]){
            shouldCreate = false;
          }
        });
        //Create the new job
        if (shouldCreate){
          var logStamp = serverList[s] + '-' + new Date();
          var newBulkJob = crontab.create(process.env.NODE_DIR + ' ' + workerLocation + ' ' + serverList[s] + ' limited', cronList[s], 'Scout-Update-' + serverList[s]);
          var newExpandedJob = crontab.create(process.env.NODE_DIR + ' ' + workerLocation + ' ' + serverList[s] + ' expanded', cronListExpanded[s], 'Scout-Update-' + serverList[s]);
        }
      }
      //Now that we have deleted or created all of the cron jobs, save the changes to the cron file
      crontab.save(function(err, crontab) {
        //If there is an error, let them know, otherwise return
        if (err){
          reject(err);
        } else {
          resolve(crontab);
        }
      });
    });
  });
}
