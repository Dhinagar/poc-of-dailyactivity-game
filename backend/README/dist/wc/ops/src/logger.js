/* ------------------------------------------------------------------------------------
	 Company Name:   ALMAwiz Technologies Pvt. Ltd.
	 Description:    This module handles the logging of the server.    
	 Author:         Trudeau Fernandes
	 Contact:        trudeau.fernandes@almawiz.com
	 Copyright:      ©2017 ALMAwiz Technologies, All Rights Reserved.
	------------------------------------------------------------------------------------ */
var dateTimeUtils = require('./dateTimeUtils.js');
var winston = require("winston");
require('winston-daily-rotate-file');

Logger = function (config) {
	var _this = this;
	this.config = config;
	this.logger = new (winston.Logger)({
		transports: [
			new winston.transports.DailyRotateFile({
				timestamp: function () {
					return dateTimeUtils.formatNowDateTime();
				},
				formatter: function (options) {
					// Return string will be passed to logger.
					return options.timestamp() + ' ' + options.level.toUpperCase() + ' '
						+ (undefined !== options.message ? options.message : '');
				},
				filename: './logs/log-',
				datePattern: 'yyyy-MM-dd.log',
				json: false,
				level: 'debug',
				maxSize: '5m',
				maxFiles: '30d',
			})
		]
	});
	return this;
}

module.exports = Logger;

Logger.prototype.error = function (msg) {
	this.logger.error(msg);
}

Logger.prototype.warn = function (msg) {
	this.logger.warn(msg);
}

Logger.prototype.info = function (msg) {
	this.logger.info(msg);
}

Logger.prototype.debug = function (...msg) {
	// console.log(...msg);
	this.logger.debug(...msg);
}

Logger.prototype.close = function () {
}

