
module.exports = ServerConfig;

function ServerConfig() {
	this.config = {};
}

ServerConfig.prototype.loadConfig = function (jsonStr) {
	try {
		this.config = JSON.parse(jsonStr);
		
	}
	catch (e) {
		this.config = {};
	}
}

ServerConfig.prototype.get = function (key, defaultVal) {
	try {
		if (this.config.hasOwnProperty(key)) {
			return this.config[key];
		}
	}
	catch (e) {
	}
	return defaultVal;
}


ServerConfig.prototype.serverPort = function () {
	return this.get("serverPort", 8081);
}

ServerConfig.prototype.isHttps = function () {
	return this.get("isHttps", false);
}

ServerConfig.prototype.mongoIP = function () {
	return this.get("mongoIP", "localhost");
}

ServerConfig.prototype.mongoDBName = function () {
	return this.get("mongoDBName", "MockDB_DEV");
}

ServerConfig.prototype.mongoDBUserName = function () {
	return this.get("mongoDBUserName", "");
}

ServerConfig.prototype.mongoDBPasswd = function () {
	return this.get("mongoDBPasswd", "");
}

ServerConfig.prototype.serverUrl = function () {
	return this.get("serverUrl", "");
}

ServerConfig.prototype.MainServerAuthDetails = function () {
	return this.get("MainServerAuthDetails", {});
}

ServerConfig.prototype.mailEnabled = function () {
	return this.get("mailEnabled", '')
}

ServerConfig.prototype.mailSMTPServer = function () {
	return this.get("mailSMTPServer", '')
}

ServerConfig.prototype.mailSMTPServerPort = function () {
	return this.get("mailSMTPServerPort", '')
}

ServerConfig.prototype.mailUsername = function () {
	return this.get("mailUsername", '')
}

ServerConfig.prototype.mailPassword = function () {
	return this.get("mailPassword", '')
}

ServerConfig.prototype.mailFromAddress = function () {
	return this.get("mailFromAddress", '')
}

ServerConfig.prototype.getauthdetails = function () {
	return this.get("auth", {})
}

ServerConfig.prototype.getImageUrl = function () {
	return this.get("imageUrl", "")
}

ServerConfig.prototype.getLeasingApis = function () {
	var ClientApi = this.get("ClientApis", {})
	if (ClientApi && ClientApi.hasOwnProperty("LeasingProfessional"))
		return ClientApi["LeasingProfessional"]
}

ServerConfig.prototype.getLPAapis = function () {
	var ClientApi = this.get("ClientApis", {})
	if (ClientApi && ClientApi.hasOwnProperty("LPA"))
		return ClientApi["LPA"]
}

ServerConfig.prototype.callCenterServerUrl = function () {
	return this.get("callCenterServerUrl", "");
}

ServerConfig.prototype.getCallCenterServerAuthDetails = function () {
	return this.get("CallcenterAuthDetails", {})
}

ServerConfig.prototype.insightengineUrl = function () {
	return this.get("InsightEngineUrl", "");
}

ServerConfig.prototype.getinsightengineAuthDetails = function () {
	return this.get("InsightEngineAuthDetails", {})
}

ServerConfig.prototype.getMockwebserverURL = function () {
	return this.get("MockWebServer", "")
}

ServerConfig.prototype.ignorePhoneNumberPrefix = function () {
	return this.getLPAapis()["ignorePhoneNumberPrefix"] || "";
}
ServerConfig.prototype.collectionNames = function () {
	return this.get("collectionNames") || {};
}

ServerConfig.prototype.getWinnowProApis = function () {
	const ClientApi = this.get("ClientApis", {})
	if (ClientApi && ClientApi.hasOwnProperty("WinnowPro"))
		return ClientApi["WinnowPro"]
}

ServerConfig.prototype.getFlags = function () {
	 const batchFlags = this.get('ClientApis', {});
	 if(batchFlags && batchFlags.hasOwnProperty("BatchProcessFlagConfig")) {
		 return batchFlags.BatchProcessFlagConfig["Flags"];
	 }
}

