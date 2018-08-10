var mysql = require('mysql');
var MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = process.env.ENC_KEY;

//Stores the MySQL Connection Pool
var state = {
  pool: null
}

//Stores the connection to mongoDB
var mongoDBO;

//Called at least once in the app or worker scripts
exports.connect = function(callback) {
  state.pool = mysql.createPool({
    host     : process.env.MYSQL_HOST,
    user     : process.env.MYSQL_USER,
    password : process.env.MYSQL_PASS,
    database : process.env.MYSQL_DB
  });
  callback();
}
//Returns the MySQL connection pool
exports.get = function() {
  return state.pool;
}
//handles connecting to the mongodb
exports.connectNoSQL = function(callback){
  MongoClient.connect(process.env.NOSQL_HOST, function(err, db) {
    mongoDBO = db.db(process.env.NOSQL_DB);
    callback();
  });
}
//Returns the NoSQL connection object
exports.getNoSQL = function (){
  return mongoDBO;
}

exports.encryptString = function(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

exports.decryptString = function(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

exports.getRandomString = function(length){
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
