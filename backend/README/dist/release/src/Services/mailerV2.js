
var mailer = require("nodemailer");

var logger = null;

var Mailer = function (config, log) {
	logger = log;
	var _this = this;
	this.config = config;
	// Use Smtp Protocol to send Email
	if (this.config.mailEnabled) {
		let mailConfig = {
			host: this.config.SMTPServer,
			port: this.config.SMTPServerPort,
			secure: this.config.secure,
			auth: {
				user: this.config.mailUsername,
				pass: this.config.mailPassword
			}
		}
		try {
			this.smtpTransport = mailer.createTransport(mailConfig);
		} catch (e) {
			logger.debug("Mailer createTransport error...." + e);
		}
	}
}

module.exports = Mailer;

Mailer.prototype.send = function (toList, subject, content, alt, callback) {
	var mail = {
		from: this.config.mailFromAddress,
		to: toList,
		subject: subject,
		text: alt,
		html: content
	}

	if (this.config.mailEnabled) {
		this.smtpTransport.sendMail(mail, function (error, response) {
			if (error) {
				logger.error(JSON.stringify(error));
				if (callback) {
					callback({ status: false, err: error });
				}
			} else {
				logger.debug("Message sent: " + JSON.stringify(response));
				if (callback) {
					callback({ status: true, message: 'success' });
				}
			}
		});
	} else {
		if (callback) {
			callback({ status: false, message: "mail not enabled" });
		}
	}

}

Mailer.prototype.close = function () {
	if (this.smtpTransport) {
		this.smtpTransport.close();
	}
}

Mailer.prototype.sendMailWithAttachment = function (info, callback) {
	var mailOptions = {
		from: this.config.mailFromAddress,
		to: info.to,
		subject: info.subject,
		text: info.text,
		attachments: [
			{
				fileName: info.fileName,
				filePath: info.filePath,
				contentType: "application/pdf"
			}
		]
	}
	if (this.config.mailEnabled) {
		this.smtpTransport.sendMail(mailOptions, function (error, response) {
			if (error) {
				callback(false);
			}
			else {
				callback(true);
			}
		});
		return;
	}
	callback(true);
}

Mailer.prototype.getPath = function (callback) {
	callback(__dirname + "/pdfs");
}

Mailer.prototype.sendEmailWithAttachment = function (info, buffer) {
	var myPromise = new Promise((resolve, reject) => {
		var mailOptions = {
			from: this.config.mailFromAddress,
			to: info.to,
			subject: info.subject,
			html: info.html ? info.html : "",
			attachments: [
				{
					filename: info.fileName,
					content: buffer,
				}
			]
		}
		if (this.config.mailEnabled) {
			this.smtpTransport.sendMail(mailOptions, function (error, response) {
				resolve({ error, response });
			});
			return;
		}
		resolve({ error: null, response: null });
	})
	return myPromise;
}