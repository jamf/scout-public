# How to Install Scout for Production Use

In the following guide we will walk through setting up scout to be used on a production server. This includes installing dependencies such as MySQL, Mongo, and Node.js. To finish up we will get our node server running, and proxy it through apache2. 

# Required Server Specs
  - RHEL 6.0 or higher
  - 2GB or more of RAM 
  
### Step One - Install Server Software Packages ###
1. Install the Web Server package that will proxy the connection to our node.js server.
```
yum install httpd
```
2. Start the web server: 
```
sudo systemctl start httpd.service
```

3. Install MySQL Server. Setup a database user. 
```
wget https://repo.mysql.com/mysql80-community-release-el6-10.noarch.rpm
yum install mysql-community-server
```
9. Install the mongo db. 
```
nano /etc/yum.repos.d/mongodb-org-4.0.repo
[mongodb-org-4.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/4.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-4.0.asc

sudo yum install -y mongodb-org
```
### Step Two - Installing and Configuring Node and Scout ###
1. Install the latest of node.js and some essential packages using the following commands: 
```
yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_8.x | sudo -E bash -

yum install nodejs
```
2. We now have node installed, so we can get the Scout server files using the following commands. This will clone the master branch which will feature the latest and greatest stable features. To get future updates and releases simply use the command 'git pull' in this directory. 

```
cd ~
git clone https://github.com/jacobschultz/scout-public.git
cd scout-public
```
3. Start by creating the scout mysql database and importing the .sql file to setup the tables using the following commands. 
```
mysql -u root -p
> CREATE database scout;
> exit;
mysql -u root -p scout < scout.sql
```
4. Run the scout installer and follow the onscreen instructions. The installer will install all of the node modules required for scout to run properly. 
```
yum install ruby
cd ~/scout-public 
sudo ruby installer.rb
```
5. After the installer finishes, start the server for the first time by entering the following command. You can verify the server is running by visiting yoursite:3000. 
```
npm start
```
6. After verifying the server is running, you can kill that process as we will be starting it with a utility called 'pm2' which will manage the server on our behalf. 

### Step Three - Setting up the Node -> Apache2 Proxy 
1. First we will install the pm2 utility and start the server using that. pm2 will start the node server in the background and manage automatically keeping the connection alive. 
```
sudo npm install -g pm2
cd ~/scout-public/api
pm2 start app.js
```

