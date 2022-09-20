//Helper
var express = require('express');
var https = require('https');
var bodyParser = require('body-parser');
var cors = require('cors');
var fs = require('fs');
var async = require('async');
// var parser = require('parse-json');

var upload = require("express-fileupload");
var base64 = require('base-64');
var utf8 = require('utf8');

var Connection = require('./connection');
var Logger = require('./logger');
var ServerConfig = require('./serverconfig');
var Authservice = require('./authservice');

const BatchProcess = require('./batchProcess');


var LogDump = require('./LogDump');

var app = express();
var connection = null;
var logger = null;
var serverConfig = new ServerConfig();
var connection = null;
var generic = null;
var logDump = null;


app.use(bodyParser.json({ limit: '50mb', extended: true }))
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(upload());
app.use(express.static('mypublic'));

app.use(function (req, res, next) {
	req.rawBody = '';
	if (req.header('Content-Type') && req.header('Content-Type').endsWith("xml")) {
		req.setEncoding('utf8');

		req.on('data', function (chunk) {
			req.rawBody += chunk;
		});

		req.on('end', function () {
			next();
		});
	} else {
		next();
	}
});

//AlmaWiz
//XStu822e@77d


var MAX_MODULES = 14;

function moduleInitComplet(isHttps, host, port) {
	console.log("API Base url http" + (isHttps ? "s" : "") + "://" + host + ":" + port);
	logger.debug("API Base url http" + (isHttps ? "s" : "") + "://" + host + ":" + port);
}

var server;
//Server
fs.readFile('config.txt', 'utf8', function (err, contents) {
	if (!err) {
		serverConfig.loadConfig(contents);
	}
	logger = new Logger(serverConfig);
	if (serverConfig.isHttps()) {
		var options = {
			key: fs.readFileSync("security/privatekey.pem"),
			cert: fs.readFileSync("security/certificate.pem")
		};
		server = https.createServer(options, app);
		server.listen(serverConfig.serverPort(), startApp);
	}
	else {
		try {
			server = app.listen(serverConfig.serverPort(), startApp);
		} catch (e) {
			console.log(serverConfig.serverPort(), e)
		}
	}
});

function startApp() {
	var host = server.address().address;
	var port = server.address().port;
	var isHttps = serverConfig.isHttps();
	connection = new Connection(serverConfig, logger);
	// app.use(LoggerMiddleware);
	let Authentication = new Authservice(logger, serverConfig, connection);
	app.use((req, res, next) => {
		Authentication.validateAPIs(req, res, next)
	});


	// let instances = {
	// 	batchProcess: new BatchProcess(logger, serverConfig, connection, app)
	// }


	logDump = new LogDump(logger, serverConfig, app);
	logDump.init();

	connectDB(function (status) {
		var count = 0;
		if (!status) {
			console.log("Connection Failed");
			logger.info("Connection Failed");
		} else {
			let batchProcess = new BatchProcess(logger, serverConfig, connection, app)
			batchProcess.init(function () {
				moduleInitComplet(isHttps, host, port)
			})
			// MAX_MODULES = Object.keys(instances).length;
			// for (let key in instances) {
			// 	if ("initalizeDB" in instances[key].__proto__) {
			// 		instances[key].initalizeDB(function (res) {
			// 			count++;
			// 			checkComplete(count, isHttps, host, port, moduleInitComplet);
			// 		});
			// 	} else if ("init" in instances[key].__proto__) {
			// 		instances[key].init(function () {
			// 			count++;
			// 			checkComplete(count, isHttps, host, port, moduleInitComplet);
			// 		});
			// 	}
			// }
		}
	})
}

//APIs
app.get('/', function (req, res) {
	res.send("Un Authorize");
})

//******************** Voice *****************************
// app.post('/submitVoiceRecording', function (req, res) {
// 	connection.submitVoiceRecording(req, function (result) {
// 		res.end(JSON.stringify(result));
// 	});
// });

// app.get("/getAllVoiceRecording", function (req, res) {
// 	connection.getAllVoiceRecording(function (result) {
// 		res.end(JSON.stringify(result));
// 	})
// });

// app.post('/uploadVoice', function (req, res) {
// 	if (req.files) {
// 		var file = req.files.file;
// 		var filename = req.body.ticketId + "_" + req.body.voiceId + ".wav";
// 		if (!fs.exists('./mypublic/voice-recording')) {
// 			fs.mkdir("./mypublic/voice-recording/")
// 		}
// 		file.mv('./mypublic/voice-recording/' + filename, function (err) {
// 			if (err) {
// 				res.end("error occured");
// 			} else {
// 				res.end(JSON.stringify({
// 					voiceUrl: serverConfig.get('imageUrl', '') + "voice-recording/" + filename
// 				}));
// 			}
// 		});
// 	}
// });

// //ShutDown
// app.post('/shutdown', function (req, res) {
// 	res.end(JSON.stringify({
// 		status: true,
// 		message: "Initiated Shutdown..."
// 	}));
// 	shutDownServer();
// });

//Login
// app.post('/ValidatePortalUser', function (req, res) {
// 	let Authentication = new Authservice(logger, serverConfig, connection);
// 	Authentication.ValidatePortalUser(req.body, function (result) {
// 		res.end(JSON.stringify(result));
// 	});
// });

function shutDownServer() {
	shutdownInProgress = true;
	logger.info("MockBatch server going in for a shutdown...");
	cleanup(function () {
		process.exit();
	});
}

function exitHandler(options, err) {
	if (options.exit) console.log("Exiting...");
	if (err && err.stack) console.log("Error:", err.stack);
	if (options.shutdown) shutDownServer();
}

function cleanup(callback) {
	connection.close(function () {
		if (logger) {
			logger.close();
		}
		if (callback) {
			callback();
		}
	});
}

//Mongodb
function connectDB(callback) {
	connection.connectDB(function (status) {
		callback(status);
	});
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, { exit: true }));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { shutdown: true }));

//catches uncaught exceptions
process.on('uncaughtException', function (error) {
	try {
		logger.error('UncaughtException: ', error.message);
		logger.error(error.stack);
	}
	catch (e) {
		console.log("Uncaught Exception: ", error.message);
		console.log(error.stack);
	}
});

// function checkComplete(count, isHttps, host, port, callback) {
// 	// console.log(count, "", MAX_MODULES)
// 	if (MAX_MODULES == count) {
// 		callback(isHttps, host, port)
// 	}
// }

