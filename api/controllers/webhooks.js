var webhooks = require('express').Router();
var devices = require('../models/device.js');

/* this will handle the following commands from the JPS
 * Add a new device - MobileDeviceEnrolled, ComputerAdded
 * Update existing - ComputerCheckIn, ComputerInventoryComplete, ComputerPolicyFinished, ComputerPushCapabilityChanged
 *                 - MobileDeviceCommandCompleted, MobileDevicePushSent
 * Archive Existing - MobileDeviceUnenrolled
 *
 * To set these up go to Settings -> Global -> Webhoooks and add a new one for all of the above
 * events you would like to support updates for. The webhook url is:
 * yourserverurl:port/webhooks/device/JSSIDHERE
 * The JSS Id can be found in the database for each JSS and is required to properly link devices
 * THIS SERVER ONLY SUPPORTS JSON
 */
 const supportedDeviceEvents = ['MobileDeviceEnrolled','ComputerAdded','ComputerCheckIn','ComputerInventoryComplete',
                                'ComputerPolicyFinished','ComputerPushCapabilityChanged', 'MobileDeviceCommandCompleted', 'MobileDevicePushSent'];
const supportedServerEvents = ['JSSShutdown','JSSStartup'];

webhooks.post('/device/:jssId', function(req,res) {
  var type = 'computer';
  //Only mobile devices have imei
  if (req.body.event.hasOwnProperty('imei')){
    type = 'mobile';
  }
  //Make sure it's a supported command
  if (supportedDeviceEvents.filter(s => s.includes(req.body.webhook.webhookEvent))){
    var device = webhookEventToDevice(req.body.event, req.params.jssId, type);
    devices.upsertDevice(device)
    .then(function(result) {
      res.status(200).send(result);
    })
    .catch(error => {
      res.status(500).send({
        error: "Unable to upsert devices"
      });
    });
  } else {
    res.status(400).send({
      error: "Unsupported method"
    });
  }
});

/* This will handle server event webhooks, the following two events are supported
 * JSSShutdown, JSSStartup
 *
 * The URL to hit is: yourserverurl:port/webhooks/server/JSSIDHERE
 * THIS SERVER ONLY SUPPORTS JSON
 */
webhooks.post('/server/:jssId', function(req,res) {
  res.status(418).send({
    status: "Coming soon"
  });
});

function webhookEventToDevice(eventObj, serverId, type){
  var currentdate = new Date();
  var dbObject = {"server_id" : serverId, "device_type" : type, "jss_id" : eventObj.jssID, "jss_name" : eventObj.deviceName,
                  "jss_serial" : eventObj.serialNumber, "jss_last_inventory" : currentDate,
                  "jss_model" : eventObj.model, "jss_udid" : eventObj.udid };
  return dbObject;
}

module.exports = webhooks;
