var SSHClient = require('ssh2').Client;
var FTPClient = require('ftp');

var FileTransfer = function (log) {
    this.logger = log;
}

module.exports = FileTransfer;

FileTransfer.prototype.upload = function (sites, fileBuffer, fileName) {
    let _this = this;
    function appendSeparator(folder) {
        if (!folder.endsWith("/")) {
            return folder + "/"
        }
        return folder
    }
    function uploadSFTPFile(details) {
        let myPromise = new Promise((resolve, reject) => {
            let conn = new SSHClient();
            conn.on('ready', () => {
                conn.sftp((err, sftp) => {
                    if (err) {
                        _this.logger.error(`Failed ssh connection for "${appendSeparator(details.location)}${fileName}" with sftp ${details.host}...${err}`);
                        resolve(err)
                        return;
                    }
                    sftp.writeFile(appendSeparator(details.location) + fileName, fileBuffer, (err) => {
                        if (err) {
                            _this.logger.error(`Failed sftp write file "${appendSeparator(details.location)}${fileName}" to sftp ${details.host} ...${err}`);
                            resolve(err)
                            return;
                        };
                        conn.end();
                        _this.logger.debug(`Successful sftp write file "${appendSeparator(details.location)}${fileName}" to sftp ${details.host}...`);
                        resolve(null);
                    });
                });
            }).on('error', (err) => {
                _this.logger.error(`Failed sftp connection for "${appendSeparator(details.location)}${fileName}" to ssh2 server ${details.host}... ${err}`);
                conn.end();
                resolve(null)
            }).connect({
                host: details.host,
                port: details.port,
                username: details.username,
                password: details.password
            });

        })
        return myPromise;
    }
    function uploadFTPFile(details) {
        let myPromise = new Promise((resolve, reject) => {
            let conn = new FTPClient();
            conn.on('ready', () => {
                conn.put(fileBuffer, appendSeparator(details.location) + fileName, (err) => {
                    if (err) {
                        _this.logger.error(`Failed ftp write file "${appendSeparator(details.location)}${fileName}" to sftp ${details.host} ...${err}`);
                        resolve(err)
                        return;
                    };
                    conn.end();
                    _this.logger.debug(`Successful ftp write file "${appendSeparator(details.location)}${fileName}" to sftp ${details.host}...`);
                    resolve(null);
                });
            })
            conn.on('error', (err) => {
                _this.logger.error(`Failed ftp connection for "${appendSeparator(details.location)}${fileName}" to ssh2 server ${details.host}... ${err}`);
                conn.end();
                resolve(null)
            })
            conn.connect({
                host: details.host,
                port: Number(details.port),
                user: details.username,
                password: details.password,
                secure: details.hasOwnProperty("secure") ? details.secure : false
            });
        })
        return myPromise;
    }

    async function uploadFile(details) {
        if (Number(details.port) == 21) {
            return await uploadFTPFile(details);
        }
        else {
            return await uploadSFTPFile(details);
        }
    }

    let myPromise = new Promise(async (resolve, reject) => {
        if (Array.isArray(sites)) {
            for (var i = 0; i < sites.length; i++) {
                let details = sites[i];
                if (details.host && details.port && details.username && details.password && details.hasOwnProperty("location")) {
                    await uploadFile(details);
                }
            }
        }
        else {
            await uploadFile(sites)
        }
        resolve(null);
    })
    return myPromise;;
}
