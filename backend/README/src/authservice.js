
var Authservice = function (_logger, _config, _connection) {
    this.config = _config;
    this.logger = _logger;
    this.connection = _connection;
    return this;
}

module.exports = Authservice;

Authservice.prototype.validateAPIs = function (req, res, next) {
    var _this = this;
    let authdetails = _this.config.getauthdetails()
    let isAuthenticationNeeded = authdetails.isAuthenticationRequired
    // console.log(authdetails)
    _this.logger.debug("URL requested to MockBatchserver to access Data .." + req.url)
    if (!isAuthenticationNeeded) {
        next();
        return;
    } else {
        if (!isAuthenticationRequiredURL(authdetails, req.url)) {
            next();
            return;
        }
        if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
            return res.status(401).json({ status: false, message: 'Missing Authorization Header' });
        }

        // verify auth credentials
        const base64Credentials = req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');

        this.filterUsers(username, password, (response) => {
            // console.log("response", response)
            if (response.status) {
                _this.logger.debug("portal User req validated ...")
                this.Authenticate(req, res, next, username, password, response.result)
            } else {
                // console.log("coming here")
                this.getAdminUserPresent((Found) => {
                    // console.log("Found", Found)
                    if (!Found) {
                        if (authdetails.defaultAdmin.username == username && authdetails.defaultAdmin.password == password) {
                            next();
                            return;
                        } else {
                            this.Authenticate(req, res, next, username, password, null)
                        }
                    } else {
                        this.Authenticate(req, res, next, username, password, null)
                    }
                })
            }
        })
    }

    function isAuthenticationRequiredURL(details, url) {
        for (let key in details.business_cloud) {
            for (let i = 0; i < details.business_cloud[key].routes.length; i++) {
                if (url.includes(details.business_cloud[key].routes[i])) {
                    return true;
                }
            }
        }
        if (url.includes("/admin/")) {
            return true;
        }
        return false;
    }
}

Authservice.prototype.Authenticate = function (req, res, next, username, password, AccessDetails) {
    var _this = this;
    let authdetails = _this.config.getauthdetails()
    if (AccessDetails && AccessDetails.type == "ADMIN") {
        next();
        return;
    }

    for (let i = 0; i < authdetails.users.length; i++) {
        // _this.logger.debug("URL Headers Details .." + "username:" + username + "  " + "password:" + password)
        // console.log(authdetails.users[i].username, username, authdetails.users[i].password, password);
        if (authdetails.users[i].username == username && authdetails.users[i].password == password) {
            // console.log(authdetails.users[i].username, authdetails.users[i].password)
            if (authdetails.users[i].type == "SERVER") {
                let CORPORATE = []
                CORPORATE = authdetails.users[i].business_clouds
                // console.log("CORPORATE", CORPORATE.length)
                for (let i = 0; i < CORPORATE.length; i++) {
                    let key = CORPORATE[i]
                    let route = authdetails.business_cloud[key].routes
                    if (req.url.includes(route)) {
                        next();
                        return;
                    }
                }
            }
            return res.status(401).json({ status: false, message: 'Un Authorized' });
        }
    }

    if (AccessDetails) {
        for (let i = 0; i < AccessDetails.ACCESS.length; i++) {
            let key = AccessDetails.ACCESS[i]
            let route = authdetails.business_cloud[key].routes
            if (req.url.includes(route)) {
                next();
                return;
            }
        }
        return res.status(401).json({ status: false, message: 'Un Authorized' });
    }
    return res.status(401).json({ status: false, message: 'Un Authorized' });
}


Authservice.prototype.getUsers = function (callback) {
    var _this = this;
    this.connection.getConnection("usersCollection", (err, collection) => {
        if (err) {
            callback({ "status": false, "message": err })
        } else {
            collection.find({}).toArray((err, result) => {
                if (err) {
                    callback({ "status": false, "message": err })
                } else {
                    _this.logger.info(" Usercollection found ...")
                    callback({ "status": true, "result": result })
                }
            })
        }
    })
}

Authservice.prototype.filterUsers = function (username, password, callback) {
    var _this = this;
    this.connection.getConnection("usersCollection", (err, collection) => {
        var myquery = { "username": username, "password": password };
        collection.findOne(myquery, (err, result) => {
            if (err) {
                callback({ "status": false, "message": err })
            } else {
                if (!result) {
                    callback({ "status": false, "message": "Not found" })
                } else {
                    callback({ "status": true, "result": result })
                }
            }
        })
    })
}

Authservice.prototype.getAdminUserPresent = function (callback) {
    var _this = this
    this.connection.getConnection("usersCollection", (err, collection) => {
        var myquery = { "type": "ADMIN" };
        collection.findOne(myquery, (err, result) => {
            if (err) {
                callback(false);
            } else {
                if (!result) {
                    callback(false);
                } else {
                    callback(true);
                }
            }
        })
    })
}

Authservice.prototype.ValidatePortalUser = function (req, callback) {
    var _this = this
    // console.log(req)
    let authdetails = _this.config.getauthdetails()
    let Username = req.UserName
    let Password = req.Password
    // console.log(authdetails)
    // _this.logger.debug("validate portal User req ..." + "username:" + Username + "  " + "password:" + Password)
    this.getUsers((users) => {
        if (users.result.length > 0) {
            this.filterUsers(Username, Password, (response) => {
                if (response.status) {
                    _this.logger.debug("portal User req validated ...")
                    callback({ status: true, message: "Valid User", Type: response.result.type, Access: response.result.ACCESS, Pages: response.result.Pages })
                } else {
                    this.getAdminUserPresent((Found) => {
                        if (!Found) {
                            if (authdetails.defaultAdmin.username == Username && authdetails.defaultAdmin.password == Password) {
                                if (authdetails.defaultAdmin.type == "ADMIN") {
                                    callback({ status: true, message: "Valid User", Type: authdetails.defaultAdmin.type, Access: [], Pages: [] })
                                } else {
                                    callback({ status: false, message: "Inavild User" })
                                }
                            } else {
                                callback({ status: false, message: "Inavild User" })
                            }
                        } else {
                            callback({ status: false, message: "Inavild User" })
                        }
                    })
                }
            })
        } else {
            if (authdetails.defaultAdmin.username == Username && authdetails.defaultAdmin.password == Password) {
                if (authdetails.defaultAdmin.type == "ADMIN") {
                    callback({ status: true, message: "Valid User", Type: authdetails.defaultAdmin.type, Access: [], Pages: [] })
                } else {
                    callback({ status: false, message: "Inavild User" })
                }
            } else {
                callback({ status: false, message: "Inavild User" })
            }
        }
    })
}