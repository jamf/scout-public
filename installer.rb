#!/usr/bin/ruby
require 'io/console'

print "  ___              _   \n";
print " / __| __ ___ _  _| |_ \n";
print " \\__ \\/ _/ _ \\ || |  _|\n";
print " |___/\\__\\___/\\_,_|\\__|\n";
print "\n";

print "Thank you for downloading scout. This script will check dependencies and then install the application.\n"
print "Written by Jacob Schultz\n"
print "Available at: github.com/jacobschultz/scout-public\n"
print "\n"

print "Do you have a MySQL server setup and available to you? (y/n)\n"
mysql = gets.chomp
if (mysql != "y")
  print "Please run this installer again after installing MySQL.\n"
  exit
end

print "Please provide your MySQL Host: \n"
mysql_host = gets.chomp
print "Please provide your MySQL User: \n"
mysql_user = gets.chomp
print "Please provide your MySQL Password: \n"
mysql_password = STDIN.noecho(&:gets).chomp

print "Do you have a Mongo (NoSQL) server setup and available to you? (y/n)\n"
nosql = gets.chomp
if (nosql != "y")
  print "Please run this installer again after installing Mongo.\n"
  exit
end

print "Please enter your host including port for Mongo: (For example: mongodb://localhost:27017)"
nosql_host = gets.chomp
print "Please provide your Mongo Databse name (Default is 'scout')"
nosql_db_name = gets.chomp

print "---------------------------------------------------------------\n"
print "Server Config\n"
print "---------------------------------------------------------------\n"

print "Enter your server hostname:\n"
print "This will write a file to app/js/server-url.js with the host name. It MUST also be updated here if it's changed in the .env file in the future.\n"
hostname = gets.chomp
#Check if a full URL was provided
if (!hostname.include? "http")
  hostname = "http://" + hostname
end
#check if a port was provided
if (!hostname.include? ":")
  hostname = hostname + ":3000"
end

#write the file to app directory
open('./app/js/server-url.js', 'w') do |f|
  f.puts "window.server_host = \"" + hostname + "\";"
end

print "Please provide an Encryption Key (MUST RE-ENTER ALL JPS SERVERS IF CHANGED - PICK A STRONG PASSWORD): "
enc_key = STDIN.noecho(&:gets).chomp
echo "Please provide a JWT Key (Can be changed): "
jwt_key = STDIN.noecho(&:gets).chomp
