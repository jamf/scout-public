#!/bin/bash

# Functions ==============================================

# return 1 if global command line program installed, else 0
# example
# echo "node: $(program_is_installed node)"
function program_is_installed {
  # set to 1 initially
  local return_=1
  # set to 0 if not found
  type $1 >/dev/null 2>&1 || { local return_=0; }
  # return value
  echo "$return_"
}

# display a message in red with a cross by it
# example
# echo echo_fail "No"
function echo_fail {
  # echo first argument in red
  printf "\e[31m✘ ${1}"
  # reset colours back to normal
  printf "\033\e[0m"
}

# display a message in green with a tick by it
# example
# echo echo_fail "Yes"
function echo_pass {
  # echo first argument in green
  printf "\e[32m✔ ${1}"
  # reset colours back to normal
  printf "\033\e[0m"
}

# echo pass or fail
# example
# echo echo_if 1 "Passed"
# echo echo_if 0 "Failed"
function echo_if {
  if [ $1 == 1 ]; then
    echo_pass $2
  else
    echo_fail $2
  fi
}

# ================== Functions

# command line programs

echo "  ___              _   ";
echo " / __| __ ___ _  _| |_ ";
echo " \__ \/ _/ _ \ || |  _|";
echo " |___/\__\___/\_,_|\__|";
echo "                       ";
echo "Thank you for downloading scout. This script will check dependencies and then install the application."
echo "Written by Jacob Schultz"
echo "Available at: github.com/jacobschultz/scout"
echo ""
echo "Checking Requirements..."
echo "node    $(echo_if $(program_is_installed node))"
echo "mysql    $(echo_if $(program_is_installed mysql))"
node_is_installed=$(program_is_installed node)
mysql_is_installed=$(program_is_installed mysql)
#exit if one isn't installed
if [ $node_is_installed -eq 0 ]
then
	echo 'Error: please install node.js to continue'
	exit
fi
if [ $mysql_is_installed -eq 0 ]
then
	echo 'Error: please install MySQL Server to continue'
	exit
fi

echo "---------------------------------------------------------------"
echo "Server Keys Setup"
echo "---------------------------------------------------------------"

echo "Please provide an Encryption Key (MUST RE-ENTER ALL SERVERS IF CHANGED - PICK A STRONG PASSWORD): "
read -s enc_key
echo "Please provide a JWT Key (Can be changed): "
read -s jwt_key
echo "Please enter the hostname and port you will be hosting this at (Example: http://localhost:3000 - no trailing slash - this will write a file to app/js/server-url.js with the host name. It MUST also be updated here if it's changed in the .env file in the future.):"
read host_name

#write host name file for webapp
cat > ./app/js/server-url.js <<EOF
window.server_host = "$host_name";
EOF

echo "---------------------------------------------------------------"
echo "MySQL Setup (Default database is 'scout', this can be changed after install)"
echo "---------------------------------------------------------------"

echo "Please provide your MySQL Host: "
read mysql_host
echo "Please provide your MySQL User: "
read mysql_user
echo "Please provide your MySQL Password: "
read -s mysql_password

echo "Would you like to use LDAP? (y/n)"
read is_ldap
if [ $is_ldap == "y" ]
then
	echo "---------------------------------------------------------------"
	echo "LDAP Setup"
	echo "---------------------------------------------------------------"

	echo "Please provide your LDAP URL (Example: ldap://ldap.server.com:389): "
	read ldap_url
	echo "Please provide your LDAP Domain Starting at ou= (Example: ou=Users,o=randomkey,dc=jumpcloud,dc=com)"
	read ldap_domain
else
	echo "---------------------------------------------------------------"
	echo "User Pin Setup - Since you opted not to use LDAP, a pin to register new users must be set. You should only share this with those who you would like to be able to register for an account. It can also be changed in your .env file and must be entered when registering for a new account."
	echo "---------------------------------------------------------------"
	echo "Enter your alphanumeric register pin:"
	read pin
fi

echo "---------------------------------------------------------------"
echo "Your settings will now be written to a .env file located at the root of the API Directory. If you'd like to edit them in the future, simply change them in this file. Your database will also be imported. To edit this env file enter 'nano .env' at the root /api directory. You'll need to restart the server for this to take effect. If you change your encryption key, you must reenter servers."
echo "---------------------------------------------------------------"

#write settings to file
cat > ./api/.env <<EOF
JWT_KEY=$jwt_key
ENC_KEY=$enc_key
LDAP_URL=$ldap_url
LDAP_STR=$ldap_domain
SCOUT_URL=$host_name
MYSQL_HOST=$mysql_host
MYSQL_USER=$mysql_user
MYSQL_PASS=$mysql_password
MYSQL_DB=scout
REG_PIN=$pin
EOF

echo "---------------------------------------------------------------"
echo ".env file has been written, now prompting for MySQL Password to create database..."
#create database
mysql -u ${mysql_user} -p ${mysql_password} -e "CREATE DATABASE scout /*\!40100 DEFAULT CHARACTER SET utf8 */;"
echo "Prompting password again to import database file.."
#import database
mysql -u ${mysql_user} -p ${mysql_password} scout < scout.sql
echo "Database has been imported, installing server modules"
(cd api && npm install)
echo "Modules installed, starting server.."
(cd api && npm start)
