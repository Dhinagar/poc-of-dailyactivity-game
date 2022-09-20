var mongoClient = require('mongodb').MongoClient;
var dateFormat = require('dateformat');
var dateTimeUtils = require('./dateTimeUtils.js');
var fs = require('fs');
var MAX_COLLECTION = 1;

var request = require('request');


var Connection = function (_config, _logger) {
    this.db = null;
    this.client = null;
    this.config = _config;
    this.logger = _logger;
    return this;
}

module.exports = Connection;

Connection.prototype.close = function (callback) {
    if (this.client) {
        this.logger.info("Closing connection to MongoDB");
        this.client.close();
    }
    callback();
}

Connection.prototype.connectDB = function (callback) {
    var self = this;

    //To make a continues collection create request
    function checkComplete(count, callback) {
        if (MAX_COLLECTION == count) {
            callback(true);
        }
    }

    var authString = "";
    if (this.config.mongoDBUserName() != "") {
        authString = encodeURIComponent(this.config.mongoDBUserName()) + ":" + encodeURIComponent(this.config.mongoDBPasswd()) + "@"
    }
    var url = "mongodb://" + authString + this.config.mongoIP() + ":27017/" + this.config.mongoDBName();

    //Connection Establishment
    mongoClient.connect(url, { useNewUrlParser: true }, function (err, database) {
        if (err) {
            callback(false);
            self.logger.debug("Error in connection....", err);
        } else {
            self.client = database;
            self.db = database.db(self.config.mongoDBName());
            var count = 0;
            //Collection :- Voice
            self.db.collection("Voice", { strict: true }, function (err, collection) {
                if (err) {
                    self.logger.debug("Error in connection of voice....", err);
                    self.db.createCollection("Voice", function (err, res) {
                        if (err) {
                            callback(false);
                            self.logger.debug("Error in creating collection of voice....", err);
                            return;
                        }
                        count++;
                        checkComplete(count, callback);
                    });
                    return
                }
                count++;
                checkComplete(count, callback);
            });
        }
    })
}
//submitVoiceRecording
Connection.prototype.submitVoiceRecording = function (req, callback) {
    var collection = this.db.collection("Voice");
    collection.insertOne(req, function (err, res) {
        if (err) {
            callback({
                status: false,
                message: "Failed to add voice recording",
                err: err
            });
        } else {
            callback({
                status: true,
                message: "voice recording added "
            });
        }
    })
}

Connection.prototype.getAllVoiceRecording = function (callback) {
    var collection = this.db.collection("Voice");
    collection.find({}).toArray(function (err, res) {
        callback(res);
    });
}


// ExecutionFlow
Connection.prototype.updateExecutionFlow = function (ticketID, description, callback) {
    var authData = this.config.MainServerAuthDetails();
    var auth = "Basic " + new Buffer(authData.userId + ":" + authData.token).toString("base64");

    var options = {
        url: this.config.serverUrl() + "/updateExecutionFlow",
        headers: {
            "Authorization": auth,
            "Content-Type": "application/json"
        },
        body: {
            email: "",
            ticketID: ticketID,
            description: description
        },
        json: true
    };
    request.post(options, function (err, res, body) {
        callback(body);
    });
}

// getConnection
Connection.prototype.getConnection = function (dbName, callback) {
    this.db.collection(dbName, { strict: true }, function (err, collection) {
        callback(err, collection)
    })
}


Connection.prototype.createCollection = function (dbName, callback) {
    this.db.createCollection(dbName, function (err, res) {
        callback(err, res);
    })
}

