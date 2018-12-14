# scout
Scout is a easy to use webapp that allows you to aggregate multiple Devices from Jamf Pro Servers. It's built on lightweight and proven tech like node.js, mysql, mongo and more. When the web server starts up, a few things occur:

 - An Express application is created, which exposes REST endpoints like /servers, /devices to get information stored in the database for the various Jamf Pro Servers. Partial documentation is below.
 - After the express app starts, the node app gets all of the servers in the database and looks at the cron string of when the servers should have inventory pulled. It then schedules a worker to run and do those updates.
 - The worker file will exec based on the contents of your crontab file. Scout automatically manages adding and removing servers from your crontab file. It runs via the command 'node worker.js JPSSERVERURL'. This can be run at anytime independent of the server as well. It handles getting devices from the Jamf Pro Instance provided and then updating them in the database.
 - All of the webapp files are location in /app and can be swapped out for anything you'd like. The front end is pretty basic and uses jQuery to load in everything with DataTables being used to render the tables.
 - Scout is also a fully functional Patch server that can even aggregate patches from multiple other servers!
 - Some screenshots can be found here: https://imgur.com/a/qEfd0KM
 - View complete install instructions below

# Running Server (Required)
 - Start by installing node, mysql and mongo. Then run the install script in the root of the project. This will write your .env settings file, create and import the database, install the required node modules, then start the server. If this app is being run in a production enviornment, or with real data it's recommended that a 'production' setup guide is followed. There are guides for both Ubuntu and Red Hat at the root of this repo. 
 - After you have run the install script, to start the server again or restart it you'll need to run 'npm start' in the /api directory
 - To run just the worker for an item that is already in the database run in the api directory : 'node worker.js SERVER URL (limited/expanded)'

# Viewing the Data
 - The server will automatically serve the app from the /app directory. Simply navigate to the hostname in your browser. (This is http://localhost:3000 by default). You could also put the files in any web server you'd like. You'll need to configure the host name whenever it changes in app/js/server-url.js. (You must run the installer once to get this file).

# Required .env Variables

There are several env variables that must be setup for the server and cron jobs to run properly. There is a sample '.env' file at the root of this repo called 'sample.env'. This should be edited and named '.env' in the roo of the /api directory. 

# API Endpoints Currently Implemented

All of these endpoints are currently auth protected using JWT tokens (Except /users and/webhooks). After hitting /user/login/(ldap/basic) you will receive a JWT that you can use in the header of all future requests. **This section of the documentation is currently being migrated to full swager docs**.  

| Path | Method | Description | Sample Body |
| --- | --- | --- | --- |
| /users/login/ldap | POST | Login via LDAP and get a JWT | { "username" : "admin", "password" : "test" } |
| /users/login/basic | POST | Login via username/password and get a JWT | { "email" : "admin@admin.com", "password" : "test" } |
| /users/create | POST | Creates a new user in the database | { "email" : "admin@admin.com", "password" : "test", "register_pin" : "pin1234" } |
| /webhooks/devices | POST | Handles POST requests for device events from the JPS | See JPS webhook docs |
| /webhooks/servers | POST | Handles POST requests for server events from the JPS | See JPS webhook docs |
| /devices | GET | Gets all devices in the server | N/A |
| /devices/csv | GET | Gets all devices and writes them to a csv file. It will then return the server URL of this file. | N/A |
| /devices/computers | GET | Gets all computers in the server | N/A |
| /devices/mobiledevices | GET | Gets all mobiledevices in the server | N/A |
| /devices/tvs | GET | Gets all tvs in the server | N/A |
| /devices/count/(mobile/computer) | GET | Gets a count of the mobile devices or computers in the server | N/A |
| /devices/paged/(mobile/computer) | POST | Gets all mobile devices or computers paginated. Also supports searching. | Conforms to datables [standard described here.](https://datatables.net/manual/server-side) |
| /devices/server/:orgName | GET | Gets all devices for the org server specified | N/A |
| /devices/(mobile/computer)/:id | GET | Gets the most recent expanded inventory record from NoSQL storage by Scout Device Id | N/A |
| /devices/live/(mobile/computer)/:id | GET | Gets the entire device record live from the JPS API | N/A |
| /servers/add | POST | Adds a JPS Server to the DB | { "url" : "https://jamfcloud.com", "username" : "admin", "password" : "test", "cron_string" : "\* \* \* \* \*" } |
| /servers/access | POST | Gets emergency server access to the JPS server | { "url" : "https://jamfcloud.com" } |
| /servers/ | GET | Returns all of the servers in the Database | N/A |
| /servers/delete/id | DELETE | Deletes a server by id | N/A |


# Webhook Setup
Scout now supports just in time updates for use with webhooks in the JPS. To set them up you'll need to navigate to Settings -> Global and add a new webhook for each event you would like to listen for. The URL to enter in the JPS is:

- http://scouturl:3000/webhooks/(devices/servers)/JSSID

You can find the JSSId in the database table. This is required to properly link devices to the server they are in. The supported commands are:

- Add a new device : MobileDeviceEnrolled, ComputerAdded

- Update existing : ComputerCheckIn, ComputerInventoryComplete, ComputerPolicyFinished, ComputerPushCapabilityChanged,  MobileDeviceCommandCompleted, MobileDevicePushSent

- Archive Existing : MobileDeviceUnenrolled

# Complete Step by Step Installation (This is what the installer does)

1. Clone or download the repository
2. Install node.js and npm on either ubuntu or red hat
3. Install MySQL and create the scout database. import the scout.sql file.
4. Install Mongo or find a host for it - the scout db will be automatically created
5. In the /api directory run 'npm install'. This will install of the web server's dependencies.
6. In the root of the /api directory create a new .env file. (touch .env)
7. Use the sample.env file to populate your settings. 
8. Navigate to /app/js and create a new file called 'server-url.js'.
9. Add a single line to the server-url.js file of 'window.server_host = "http://localhost:3000";' (or whatever else you set the host to, it must match the .env file)
10. In the root of the /api directory run 'npm start' to start your server. This will need to remain running.
12. Optional: Add webhoooks to your JPS (Described above)
13. Recommended: Set this up as a production server by adding a HTTPS cert, and proxy the connection behind an Apache server

 # Software Used
 - node.js, mysql, mongo and express for the server
 - SBAdmin2, jQuery and jQuery Cron for the front end 
