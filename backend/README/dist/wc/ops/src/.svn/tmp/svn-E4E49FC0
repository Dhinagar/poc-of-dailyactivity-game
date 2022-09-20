const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const _lodash = require('lodash');
const neatCsv = require('neat-csv');
const {
    check,
    validationResult
} = require('express-validator');
const isISO8601 = require('validator/lib/isISO8601');
const jwt = require('jsonwebtoken');
var Client = require('ssh2').Client;
const cron = require('node-cron');
const fetch = require('node-fetch');
const base64 = require('base-64');
const Excel = require('exceljs');
const Mailer = require('../../Services/mailerV2');
const moment = require('moment');
const WrapperChat = require('./TextChatHistory/index');


const {
    readFileAsync,
    xlToJsonAsync,
    unlinkAsync,
    getUTCFormattedDate,
    getPastDateTime,
    zeroPad
} = require('../helperFns');
const {
    uploadDirPath
} = require('../constants');
const FileTransfer = require('../../Services/fileTransfer');

// checks if winnowPro dir is there or not. If not, It will create the dir.
const winnowProDirPath = path.join(uploadDirPath, "winnowPro");
if (!fs.existsSync(winnowProDirPath)) {
    fs.mkdirSync(winnowProDirPath);
}


/**
 * @classdesc A WinnowPro batch processes class
 */
class WinnowProBatchProcess {
    /**
     * @param {object} logger - A logger object
     * @param {object} config - System config object
     * @param {object} connection - Database connection object
     * @param {object} app - A Express App instance.
     */
    constructor(logger, config, connection, app) {
        this.logger = logger;
        this.config = config;
        this.connection = connection;
        this.isVehicleProcessRunning = false;
        this.app = app;
        this.winnowProAPIs = this.config.getWinnowProApis();
        this.mailer = new Mailer(this.winnowProAPIs.mailerConfig, this.logger);
        this.fileTransfer = new FileTransfer(logger)
        const {
            WinnowProVehiclesStore,
            WinnowProColors,
            WinnowProMakes,
            WinnowProModels,
            WinnowProTrims,
            WinnowProBodyTypes,
            WinnowProVehicleTypes,
            WinnowProDriveTrain,
            WinnowProStockImages,
            WinnowProOffers,
            WinnowProBaseColors,
            WinnowProFeatures,
            WinnowProSynonyms,
            WinnowProDealerLogos,
            WinnowProAnalyticCollection,
            WinnowProModelVariancesCollection,
            WinnowProFuelTypesVariancesCollection,
            CorporateBatchConfigCollection
        } = config.collectionNames();
        this.WinnowProVehiclesStoreCollectionName = WinnowProVehiclesStore;
        this.WinnowProColorsCollectionName = WinnowProColors;
        this.WinnowProMakesCollectionName = WinnowProMakes;
        this.WinnowProModelsCollectionName = WinnowProModels;
        this.WinnowProTrimsCollectionName = WinnowProTrims;
        this.WinnowProBodyTypesCollectionName = WinnowProBodyTypes;
        this.WinnowProVehicleTypesCollectionName = WinnowProVehicleTypes;
        this.WinnowProDriveTrainCollectionName = WinnowProDriveTrain;
        this.WinnowProStockImagesCollectionName = WinnowProStockImages;
        this.WinnowProOffersCollectionName = WinnowProOffers;
        this.WinnowProBaseColorsCollectionName = WinnowProBaseColors;
        this.WinnowProFeaturesCollectionName = WinnowProFeatures;
        this.WinnowProSynonymsCollectionName = WinnowProSynonyms;
        this.WinnowProDealerLogoImagesCollectionName = WinnowProDealerLogos;
        this.WinnowProAnalyticCollection = WinnowProAnalyticCollection;
        this.WinnowProModelVariancesCollection = WinnowProModelVariancesCollection;
        this.WinnowProModelTrimsCollectionName = "WinnowProModelTrims";
        this.WinnowProFuelTypesVariancesCollectionName = WinnowProFuelTypesVariancesCollection;
        this.CorporateBatchConfigCollectionName = CorporateBatchConfigCollection;
        this.WinnowProRejectWordsCollectionName = "WinnowProRejectWords";
        this.wrapperChat = new WrapperChat()
        this.loggerPrefix = ":::WinnowPro:::";
    }

    async init() {
        this.initAPIs();
        this.initCronJob();
    }

    /**
     * @description Initializes all APIs.
     */
    initAPIs() {
        /**
        * @api {post} /ServiceManagement/WinnowPro/login login.
        * @apiName login
        * @apiGroup WinnowPro
        *
        * @apiParam {String} username username
        * @apiParam {String} password password
        *
        * @apiSuccess {Boolean} status Status of the response.
        * @apiSuccess {String} token token of the user who have logged in.
        *
        *
        * @apiError (200) {Boolean} status Status of the response.
        * @apiError (200) {String} message Failure message.
        */
        this.app.post(
            "/ServiceManagement/WinnowPro/login",
            this.login.bind(this)
        );

        /**
        * @api {post} /ServiceManagement/WinnowPro/uploadVehiclesXLSX upload the Vehicles XLSX.
        * @apiName uploadVehiclesXLSX
        * @apiGroup WinnowPro
        *
        * @apiParam {Object} file file
        *
        * @apiSuccess {Boolean} status Status of the response.
        * @apiSuccess {String} message Success message.
        *
        *
        * @apiError (200) {Boolean} status Status of the response.
        * @apiError (200) {String} message Failure message.
        */
        this.app.post(
            "/ServiceManagement/WinnowPro/uploadVehiclesXLSX",
            this.authenticateUser.bind(this),
            this.uploadVehiclesXLSX.bind(this)
        );

        /**
       * @api {get} /ServiceManagement/WinnowPro/downloadVehiclesData download the data of Vehicles.
       * @apiName downloadVehiclesData
       * @apiGroup WinnowPro
       *
       * @apiSuccess {Boolean} status Status of the response.
       * @apiSuccess {Object} data Success data.
       *
       *
       * @apiError (200) {Boolean} status Status of the response.
       * @apiError (200) {String} message Failure message.
       */
        this.app.get(
            "/ServiceManagement/WinnowPro/downloadVehiclesData",
            this.authenticateUser.bind(this),
            this.downloadVehiclesData.bind(this)
        );
        /**
         * @api {post} /ServiceManagement/WinnowPro/uploadStockImagesXLSX upload the Stock Images in XLSX formate.
         * @apiName uploadStockImagesXLSX
         * @apiGroup WinnowPro
         *
         * @apiParam {Object} file file
         * @apiSuccess {Boolean} status Status of the response.
         * @apiSuccess {String} message Success message.
         *
         *
         * @apiError (200) {Boolean} status Status of the response.
         * @apiError (200) {String} message Failure message.
         */
        this.app.post(
            "/ServiceManagement/WinnowPro/uploadStockImagesXLSX",
            this.authenticateUser.bind(this),
            this.uploadStockImagesXLSX.bind(this)
        );
        /**
          * @api {get} /ServiceManagement/WinnowPro/downloadStockImageData download the Stock Image Data
          * @apiName downloadStockImageData
          * @apiGroup WinnowPro
          *
          * @apiSuccess {Boolean} status Status of the response.
          * @apiSuccess {Object} data Success data.
          *
          *
          * @apiError (200) {Boolean} status Status of the response.
          * @apiError (200) {String} message Failure message.
          */
        this.app.get(
            "/ServiceManagement/WinnowPro/downloadStockImagesData",
            this.authenticateUser.bind(this),
            this.downloadStockImageData.bind(this)
        )

        /**
         * @api {post} /ServiceManagement/WinnowPro/uploadOffersXLSX upload the vehicle Offers in XLSX format
         * @apiName downloadStockImageData
         * @apiGroup WinnowPro
         * @apiParam {Object} file file
         * @apiSuccess {Boolean} status Status of the response.
         * @apiSuccess {String} message Success message.
         *
         *
         * @apiError (200) {Boolean} status Status of the response.
         * @apiError (200) {String} message Failure message.
         */
        this.app.post(
            "/ServiceManagement/WinnowPro/uploadOffersXLSX",
            this.authenticateUser.bind(this),
            this.uploadOffersXLSX.bind(this)
        );

        /**
        * @api {get} /ServiceManagement/WinnowPro/downloadOffersData download the Offers Data
        * @apiName downloadOffersData
        * @apiGroup WinnowPro
        *
        * @apiSuccess {Boolean} status Status of the response.
        * @apiSuccess {Object} data Success data.
        *
        *
        * @apiError (200) {Boolean} status Status of the response.
        * @apiError (200) {String} message Failure message.
        */
        this.app.get(
            "/ServiceManagement/WinnowPro/downloadOffersData",
            this.authenticateUser.bind(this),
            this.downloadOffersData.bind(this)
        );

        /**
        * @api {post} /ServiceManagement/WinnowPro/uploadBaseColorXLSX upload the vehicle Base Color in XLSX formate.
        * @apiName uploadBaseColorXLSX
        * @apiGroup WinnowPro
        * @apiParam {Object} file file
        * @apiSuccess {Boolean} status Status of the response.
        * @apiSuccess {String} message Success message.
        *
        *
        * @apiError (200) {Boolean} status Status of the response.
        * @apiError (200) {String} message Failure message.
        */
        this.app.post(
            "/ServiceManagement/WinnowPro/uploadBaseColorXLSX",
            this.authenticateUser.bind(this),
            this.uploadBaseColorXLSX.bind(this)
        );
        /**
          * @api {get} /ServiceManagement/WinnowPro/downloadBaseColorData download the Base Color Data
          * @apiName downloadBaseColorData
          * @apiGroup WinnowPro
          *
          * @apiSuccess {Boolean} status Status of the response.
          * @apiSuccess {Object} data Success data.
          *
          *
          * @apiError (200) {Boolean} status Status of the response.
          * @apiError (200) {String} message Failure message.
          */
        this.app.get(
            "/ServiceManagement/WinnowPro/downloadBaseColorData",
            this.authenticateUser.bind(this),
            this.downloadBaseColorData.bind(this)
        )
        /**
          * @api {post} /ServiceManagement/WinnowPro/uploadFeaturesXLSX upload the vehicle Features in XLSX formate.
          * @apiName uploadFeaturesXLSX
          * @apiGroup WinnowPro
          * @apiParam {Object} file file
          * @apiSuccess {Boolean} status Status of the response.
          * @apiSuccess {String} message Success message.
          *
          *
          * @apiError (200) {Boolean} status Status of the response.
          * @apiError (200) {String} message Failure message.
          */
        this.app.post(
            "/ServiceManagement/WinnowPro/uploadFeaturesXLSX",
            this.authenticateUser.bind(this),
            this.uploadFeaturesXLSX.bind(this)
        );
        /**
           * @api {get} /ServiceManagement/WinnowPro/downloadFeaturesData download the Features Data
           * @apiName downloadFeaturesData
           * @apiGroup WinnowPro
           *
           * @apiSuccess {Boolean} status Status of the response.
           * @apiSuccess {Object} data Success data.
           *
           *
           * @apiError (200) {Boolean} status Status of the response.
           * @apiError (200) {String} message Failure message.
           */
        this.app.get(
            "/ServiceManagement/WinnowPro/downloadFeaturesData",
            this.authenticateUser.bind(this),
            this.downloadFeaturesData.bind(this)
        );

        /**
            * @api {post} /ServiceManagement/WinnowPro/uploadFeaturesXLSX upload the vehicle Features in XLSX formate.
            * @apiName uploadFeaturesXLSX
            * @apiGroup WinnowPro
            * @apiParam {Object} file file
            * @apiSuccess {Boolean} status Status of the response.
            * @apiSuccess {String} message Success message.
            *
            *
            * @apiError (200) {Boolean} status Status of the response.
            * @apiError (200) {String} message Failure message.
            */
        this.app.post(
            "/ServiceManagement/WinnowPro/uploadDealerLogosXLSX",
            this.authenticateUser.bind(this),
            this.uploadDealerLogosXLSX.bind(this)
        );

        /**
           * @api {get} /ServiceManagement/WinnowPro/downloadDealerLogosData download the Dealer Logos Data
           * @apiName downloadDealerLogosData
           * @apiGroup WinnowPro
           *
           * @apiSuccess {Boolean} status Status of the response.
           * @apiSuccess {Object} data Success data.
           *
           *
           * @apiError (200) {Boolean} status Status of the response.
           * @apiError (200) {String} message Failure message.
           */
        this.app.get(
            "/ServiceManagement/WinnowPro/downloadDealerLogosData",
            this.authenticateUser.bind(this),
            this.downloadDealerLogosData.bind(this)
        );
        /**
           * @api {post} /ServiceManagement/WinnowPro/uploadSynonymsXLSX upload the Synonyms XLSX
           * @apiName uploadSynonymsXLSX
           * @apiGroup WinnowPro
           * @apiParam {Object} file file
           * @apiSuccess {Boolean} status Status of the response.
           * @apiSuccess {String} message Success message.
           *
           *
           * @apiError (200) {Boolean} status Status of the response.
           * @apiError (200) {String} message Failure message.
           */
        this.app.post(
            "/ServiceManagement/WinnowPro/uploadSynonymsXLSX",
            this.authenticateUser.bind(this),
            this.uploadSynonymsXLSX.bind(this)
        );

        /**
           * @api {get} /ServiceManagement/WinnowPro/downloadSynonymsData download the Synonyms Data
           * @apiName downloadSynonymsData
           * @apiGroup WinnowPro
           *
           * @apiSuccess {Boolean} status Status of the response.
           * @apiSuccess {Object} data Success data.
           *
           *
           * @apiError (200) {Boolean} status Status of the response.
           * @apiError (200) {String} message Failure message.
           */
        this.app.get(
            "/ServiceManagement/WinnowPro/downloadSynonymsData",
            this.authenticateUser.bind(this),
            this.downloadSynonymsData.bind(this)
        );


        /**
          * @api {post} /ServiceManagement/WinnowPro/uploadRejectWordsXLSX upload Reject Words in XLSX formate.
          * @apiName uploadRejectWordsXLSX
          * @apiGroup WinnowPro
          * @apiParam {Object} file file
          * @apiSuccess {Boolean} status Status of the response.
          * @apiSuccess {String} message Success message.
          *
          *
          * @apiError (200) {Boolean} status Status of the response.
          * @apiError (200) {String} message Failure message.
          */
        this.app.post(
            "/ServiceManagement/WinnowPro/uploadRejectWordsXLSX",
            this.authenticateUser.bind(this),
            this.uploadRejectWordsXLSX.bind(this)
        );

        /**
          * @api {get} /ServiceManagement/WinnowPro/downloadRejectWordsData download Reject Words Data.
          * @apiName downloadRejectWordsData
          * @apiGroup WinnowPro
          *
          * @apiSuccess {Boolean} status Status of the response.
          * @apiSuccess {Object} data Success data.
          *
          *
          * @apiError (200) {Boolean} status Status of the response.
          * @apiError (200) {String} message Failure message.
          */
        this.app.get(
            "/ServiceManagement/WinnowPro/downloadRejectWordsData",
            this.authenticateUser.bind(this),
            this.downloadRejectWordsData.bind(this)
        );


        /**
          * @api {post} /ServiceManagement/WinnowPro/triggerVehicleProcessCron trigger the Vehicle Process Cron job.
          * @apiName triggerVehicleProcessCron
          * @apiGroup WinnowPro
          * 
          * @apiSuccess {Boolean} status Status of the response.
          * @apiSuccess {String} message Success message.
          *
          *
          */
        this.app.post(
            "/ServiceManagement/WinnowPro/triggerVehicleProcessCron",
            this.authenticateUser.bind(this),
            this.triggerVehicleProcessCron.bind(this)
        );

        /**
         * @api {post} /ServiceManagement/WinnowPro/uploadModelVariances upload the Model Variances.
         * @apiName uploadModelVariances
         * @apiGroup WinnowPro
         * @apiParam {Object} file file
         * @apiSuccess {Boolean} status Status of the response.
         * @apiSuccess {String} message Success message.
         *
         *
         * @apiError (200) {Boolean} status Status of the response.
         * @apiError (200) {String} message Failure message.
         */
        this.app.post(
            "/ServiceManagement/WinnowPro/uploadModelVariances",
            this.authenticateUser.bind(this),
            this.uploadModelVariances.bind(this)
        );

        /**
         * @api {get} /ServiceManagement/WinnowPro/downloadModelVariance download the Model Variance.
         * @apiName downloadModelVariance
         * @apiGroup WinnowPro
         *
         * @apiSuccess {Boolean} status Status of the response.
         * @apiSuccess {Object} data Success data.
         *
         *
         * @apiError (200) {Boolean} status Status of the response.
         * @apiError (200) {String} message Failure message.
         */
        this.app.get(
            "/ServiceManagement/WinnowPro/downloadModelVariance",
            this.authenticateUser.bind(this),
            this.downloadModelVariance.bind(this)
        );
    }

    async triggerVehicleProcessCron(req, res) {
        this.vehicleProcessCron();
        return res.send({
            status: true,
            message: "Triggerred Vehicle CRON"
        })
    }

    initCronJob() {
        const {
            isBatchProcessRequired,
            RunTime,
            isBatchProcessCreateLead,
            leadEmailSentRuntime,
            emailReportRunTime,
            emailChatReportRunTime
        } = this.config.getWinnowProApis();
        try {
            if (isBatchProcessRequired) {
                cron.schedule(RunTime, this.vehicleProcessCron.bind(this));
            }
            if (isBatchProcessCreateLead) {
                cron.schedule(leadEmailSentRuntime, this.getLeadDetailsProcess.bind(this));
            }
            if (emailReportRunTime) {
                //console.log("calling")
                cron.schedule(emailReportRunTime, this.sendMailToTheCorporate.bind(this));
            }
            if (emailChatReportRunTime) {
                //console.log("CALLING")
                cron.schedule(emailChatReportRunTime, this.sendChatMailToTheCorporate.bind(this))
            }
        } catch (error) {
            console.log(error);
        }

    }

    async sendChatMailToTheCorporate() {
        try {
            //console.log('Sending')
            let flagsCollection = this.connection.db.collection(this.CorporateBatchConfigCollectionName);
            flagsCollection = await flagsCollection.find({}).toArray();
            for (var i = 0; i < flagsCollection.length; i++) {
                for (var j = 0; j < flagsCollection[i].flags.length; j++) {
                    if (flagsCollection[i].flags[j].flag === "Email WinnowPro Chats") {
                        await this.sendWinnowProChatReport(flagsCollection[i].flags[j], flagsCollection[i].corporate);
                    }
                }
            }
        } catch (error) {
            //console.log(error);
            this.logger.error(`Unable to get flags :: ${error}`);
        }
    }

    async sendWinnowProChatReport(flagDetails, corporateName) {
        try {
            const analyticsCollection = this.connection.db.collection(this.WinnowProAnalyticCollection);
            const date = new Date();
            const unixCurrentDate = moment(date).unix();
            let startDate = (unixCurrentDate - (24 * 60 * 60));
            startDate = moment.unix(startDate).format("YYYY/MM/DD HH:mm:ss");
            startDate = new Date(startDate);
            startDate = getUTCFormattedDate(startDate);
            const startDateSplit = startDate.split(" ");
            const corporateAnalytics = await analyticsCollection.find({
                "ticketInfo.corporate": corporateName, createdOn: {
                    $gte: `${startDateSplit[0]} 00:00:00`
                }
            }).toArray();

            this.logger.info(`WinnowPro Chats Reports Batch process Started : ${corporateName}`);
            await this.generateAndSendChatEmail(corporateAnalytics, flagDetails);
            this.logger.info(`WinnowPro Chats Reports Batch process Finished : ${corporateName}`);
        } catch (error) {
            throw new Error(error);
        }
    }

    async generateAndSendChatEmail(corporateAnalytics, flagDetails) {
        try {
            if (corporateAnalytics.length === 0) {
                return;
            }
            for (var i = 0; i < corporateAnalytics.length; i++) {
                await this.getChatHistoryAndSendEmail(corporateAnalytics[i], flagDetails);
            }
        } catch (error) {
            throw new Error(error)
        }
    }
    async getChatHistoryAndSendEmail(analyticsData, flagDetails) {
        try {
            switch (analyticsData.ticketInfo.channelType) {
                case "Web/App":
                    const response = await this.fetchMessageData("/IFrameWebchat/getChatHistory", analyticsData.ticketInfo.ticketId, analyticsData.ticketInfo.corporate);
                    if (_lodash.isEmpty(response)) {
                        return;
                    }
                    let chatHistory = ""
                    chatHistory += this.wrapperChat.chatHistory(response.data.message_data, "WEBCHAT");
                    await this.createTXTFileAndSendEmail(chatHistory, response.data, flagDetails);
                    return;
                case "FACEBOOK":
                    const response2 = await this.fetchMessageData("/facebookChat/v2/getChatHistory", analyticsData.ticketInfo.ticketId, analyticsData.ticketInfo.corporate);
                    if (_lodash.isEmpty(response2)) {
                        return;
                    }
                    let chatHistory2 = ""
                    chatHistory2 += this.wrapperChat.chatHistory(response2.data.message_data, "FACEBOOK");
                    await this.createTXTFileAndSendEmail(chatHistory2, response2.data, flagDetails);
                    return;
                case "WHATSAPP":
                    const response3 = await this.fetchMessageData("/whatsApp/getChatHistory", analyticsData.ticketInfo.ticketId, analyticsData.ticketInfo.corporate);
                    if (_lodash.isEmpty(response3)) {
                        return;
                    }

                    let chatHistory3 = ""
                    chatHistory3 += this.wrapperChat.chatHistory(response3.data.message_data, "WHATSAPP");
                    await this.createTXTFileAndSendEmail(chatHistory3, response3.data, flagDetails);
                    return;
                case "GOOGLE_MESSAGES":
                    const response4 = await this.fetchMessageData("/googleMessagesChat/getChatHistory", analyticsData.ticketInfo.ticketId, analyticsData.ticketInfo.corporate);
                    if (_lodash.isEmpty(response4)) {
                        return;
                    }
                    let chatHistory4 = ""
                    chatHistory4 += this.wrapperChat.chatHistory(response4.data.message_data, "GOOGLE_MESSAGES");
                    await this.createTXTFileAndSendEmail(chatHistory4, response4.data, flagDetails);
                    return;
                default: return;
            }
        } catch (error) {
            // console.log(error)
            throw new Error(error)
        }
    }

    async fetchMessageData(urlPrefix = "string", ticketId = "string", corporate = "string") {
        try {
            const { username, passsword } = this.config.getCallCenterServerAuthDetails();
            const callCenterURL = this.config.callCenterServerUrl();
            const setting = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${base64.encode(`${username}:${passsword}`)}`,
                },
                body: JSON.stringify({
                    "ticketId": ticketId,
                    "corporate": corporate
                })
            }
            const response = await fetch(callCenterURL + `${urlPrefix}`, setting);
            const jsonResponse = await response.json();
            if (jsonResponse.status === false) {
                return {};
            }
            return jsonResponse

        } catch (error) {
            //console.log(error)
            throw new Error(error)
        }
    }

    waitforme(milisec) {
        return new Promise(resolve => {
            setTimeout(() => { resolve('') }, milisec);
        })
    }
    async createTXTFileAndSendEmail(dataString, responseData, flagDetails) {
        try {
            //this.logger.info(`${JSON.stringify(responseData)} RESPONSE DATA FOR CHAT EMAIL`);
            let fileName = `${responseData.from}.txt`;
            await this.waitforme(1000);
            if (this.isSFTPServerAvailable(flagDetails.config)) {
                fileName = `${responseData.corporate} - ${responseData.ticket_id} - ` + fileName;
                await this.fileTransfer.upload(flagDetails.config.sFTP, dataString.toString("utf8"), fileName)
            }
            else {

                const info = {
                    fileName: fileName,
                    to: flagDetails.config.email && flagDetails.config.email.length !== 0 ? flagDetails.config.email : this.winnowProAPIs.emailForReport,
                    subject: `${responseData.corporate} - Winnow Pro Batch Report - ${responseData.ticket_id}`,
                    html: `<p style="border-radius : 2px; padding : 10px; -webkit-box-shadow: -5px 5px 5px 0 rgba(0,0,0,.25);
                    box-shadow: -5px 5px 5px 0 rgba(0,0,0,.25);">Hi, <br><br> Please find attached WinnowPro Chat Reports for <strong>${responseData.corporate}</strong> - From ${responseData.from}. <br><br> regards, <br> iNtelli-Assist</p>`
                }
                const dataStringBuffer = dataString.toString("utf8");
                let result = await this.mailer.sendEmailWithAttachment(info, dataStringBuffer);
                if (result.error) {
                    this.logger.error(`${responseData.corporate} : ${responseData.ticket_id} : Could not send chat report : ${JSON.stringify(result.error)}`)
                } else {
                    this.logger.info(`${responseData.corporate} : ${responseData.ticket_id}  Sent chat report : ${JSON.stringify(result.response)}`);
                }
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    async sendMailToTheCorporate() {
        try {
            let flagsCollection = this.connection.db.collection(this.CorporateBatchConfigCollectionName);
            flagsCollection = await flagsCollection.find({}).toArray();
            for (var i = 0; i < flagsCollection.length; i++) {
                for (var j = 0; j < flagsCollection[i].flags.length; j++) {
                    //this.logger.info(`${flag} Excel flagggg`);
                    if (flagsCollection[i].flags[j].flag === "Email WinnowPro Report") {
                        await this.sendWinnowProReport(flagsCollection[i].corporate, flagsCollection[i].flags[j]);
                    }
                }
            }
        } catch (error) {
            this.logger.error(`Unable to get flags :: ${error}`);
        }
    }

    async sendWinnowProReport(corporateName, flagDetails) {
        try {
            const analyticsCollection = this.connection.db.collection(this.WinnowProAnalyticCollection);
            const date = new Date();
            const unixCurrentDate = moment(date).unix();
            let startDate = (unixCurrentDate - (24 * 60 * 60));
            startDate = moment.unix(startDate).format("YYYY/MM/DD HH:mm:ss");
            startDate = new Date(startDate);
            startDate = getUTCFormattedDate(startDate);
            const startDateSplit = startDate.split(" ");
            const corporateAnalytics = await analyticsCollection.find({
                "ticketInfo.corporate": corporateName, createdOn: {
                    $gte: `${startDateSplit[0]} 00:00:00`
                }
            }).toArray();
            //console.log(corporateAnalytics, "CORPORATE ANALYTICS BATCH REPORT")
            this.logger.info(`Winnow Excel Report Batch Process Started : ${corporateName}`);
            await this.generateAndSendExcel(corporateAnalytics, corporateName, flagDetails);
            this.logger.info(`Winnow Excel Report Batch Process Finished : ${corporateName}`);
        } catch (error) {
            this.logger.error(`Unable to generate : ${error}`);
        }
    }


    async generateAndSendExcel(corporateAnalytics, corporateName, flagDetails) {
        try {
            let _this = this;
            if (corporateAnalytics.length === 0) {
                _this.logger.error(`Corporate ${corporateName} : ${corporateAnalytics.length} analytics.`)
                return;
            }
            let workbook = new Excel.Workbook();
            let workSheet = null;
            if (corporateAnalytics.length > 0) {
                workSheet = workbook.addWorksheet('WinnoPro Report');
            }

            workSheet.columns = [
                { header: 'Lead ID', key: 'leadID' },
                { header: 'Active Day', key: 'activeDay' },
                { header: 'Active Time', key: 'activeTime' },
                { header: 'Initial Action', key: 'initialAction' },
                { header: 'Welcome Message Drop-Off', key: 'welcomeMessageDropOff' },
                { header: 'Department', key: 'department' },
                { header: 'Name', key: 'name' },
                { header: 'Data Collection - name drop-off', key: 'nameDropOff' },
                { header: 'Phone', key: 'phone' },
                { header: 'Data Collection - phone drop-off', key: 'phoneDropOff' },
                { header: 'Email address', key: 'emailAddress' },
                { header: 'Data Collection - email drop-off', key: 'emailDropOff' },
                { header: 'Vehicle Type', key: 'vehicleType' },
                { header: '# of searches vehicle type', key: 'vehicleTypeCount' },
                { header: 'New search vehicle type drop-off', key: 'vehicleTypeDropOff' },
                { header: 'Body type', key: 'bodyType' },
                { header: '# of searches Body type', key: 'bodySearchCount' },
                { header: 'New search body type drop-off', key: 'newSearchBodyDropOff' },
                { header: 'Vehicle Model', key: 'vehicleModel' },
                { header: '# of searches vehicle model', key: 'modelSearchCount' },
                { header: 'New search vehicle model drop-off', key: 'newSearchModelDropOff' },
                { header: 'Make', key: 'make' },
                { header: 'year', key: 'year' },
                { header: 'NewSearch', key: 'newSearch' },
                { header: 'Vehicledetails', key: 'vehicleDetails' },
                { header: 'SelectCount', key: 'selectCount' },
                { header: '# of new searches', key: 'newSearchesCount' },
                { header: 'Personal info correction', key: 'personalInfoCorrection' },
                { header: 'Personal info correction drop-off', key: 'personalInfoCorrectionDropOff' },
                { header: '# of corrections of personal details', key: 'correctionsOfPersonalDetailsCount' },
                { header: 'Agent Attempted', key: 'agentAttempted' },
                { header: 'Agent Resolved', key: 'agentResolved' },
                { header: 'Platform', key: 'platform' },
                { header: 'CRM Lead Email', key: 'crmLeadEmail' },
                { header: 'CRM Trigger', key: 'crmTrigger' },
                { header: 'Display Device', key: 'displayDevice' },
            ];
            let data = [];
            corporateAnalytics.forEach(ele => {
                data.push({
                    leadID: ele.ticketInfo ? ele.ticketInfo.ticketId : "",
                    activeDay: this.separateTimeAndDate(ele.createdOn).day,
                    activeTime: this.separateTimeAndDate(ele.createdOn).time,
                    initialAction: ele.ticketInfo && ele.ticketInfo.hasOwnProperty('InitialAction') ? ele.ticketInfo.InitialAction : "",
                    welcomeMessageDropOff: ((ele.ticketInfo && ele.ticketInfo.hasOwnProperty('ServiceType') && ele.ticketInfo.ServiceType === "") && ele.analyticInfo && ele.analyticInfo.ServiceType && ele.analyticInfo.ServiceType.status === true) ? 'Yes' : "No",
                    department: (ele.ticketInfo && ele.ticketInfo.hasOwnProperty('ServiceType') && ele.ticketInfo.ServiceType !== "") ? ele.ticketInfo.ServiceType : "",
                    name: ele.ticketInfo && ele.ticketInfo.username ? ele.ticketInfo.username : "",
                    nameDropOff: ((ele.ticketInfo && ele.ticketInfo.hasOwnProperty('username') && ele.ticketInfo.username === "") && ele.analyticInfo && ele.analyticInfo.UserName.status === true) ? 'Yes' : "No",
                    phone: ele.ticketInfo && ele.ticketInfo.mobileNumber ? ele.ticketInfo.mobileNumber : "",
                    phoneDropOff: ((ele.ticketInfo && ele.ticketInfo.hasOwnProperty('mobileNumber') && ele.ticketInfo.mobileNumber === "") && ele.analyticInfo && ele.analyticInfo.MobileNumber.status === true) ? 'Yes' : "No",
                    emailAddress: (ele.ticketInfo && ele.ticketInfo.emailAddress) || "",
                    emailDropOff: ((ele.ticketInfo && ele.ticketInfo.hasOwnProperty('emailAddress') && ele.ticketInfo.emailAddress === "") && ele.analyticInfo && ele.analyticInfo.EmailAddress && ele.analyticInfo.EmailAddress.status === true) ? 'Yes' : "No",
                    vehicleType: (ele.ticketInfo && ele.ticketInfo.VehicleType) || "",
                    vehicleTypeCount: ele.ticketInfo && ele.ticketInfo.hasOwnProperty('NewSearchVehicleTypeCount') ? ele.ticketInfo.NewSearchVehicleTypeCount : "",
                    vehicleTypeDropOff: (ele.ticketInfo && ele.ticketInfo.vehicle_type === "" && ele.ticketInfo.NewSearch === true) ? "Yes" : "No",
                    bodyType: (ele.ticketInfo && ele.ticketInfo.body_type) || "",
                    bodySearchCount: ele.ticketInfo && ele.ticketInfo.hasOwnProperty('NewSearchBodyTypeCount') ? ele.ticketInfo.NewSearchBodyTypeCount : "",
                    newSearchBodyDropOff: (ele.ticketInfo && ele.ticketInfo.vehicle_type !== "" && ele.ticketInfo.body_type === "" && ele.ticketInfo.NewSearch === true) ? "Yes" : "No",
                    vehicleModel: (ele.ticketInfo && ele.ticketInfo.model) || "",
                    modelSearchCount: ele.ticketInfo && ele.ticketInfo.hasOwnProperty('NewSearchModelCount') ? ele.ticketInfo.NewSearchModelCount : "",
                    newSearchModelDropOff: (ele.ticketInfo && ele.ticketInfo.body_type !== "" && ele.ticketInfo.model === "" && ele.ticketInfo.NewSearch === true) ? "Yes" : "No",
                    make: (ele.ticketInfo && ele.ticketInfo.make) || "",
                    year: (ele.ticketInfo && ele.ticketInfo.year) || "",
                    newSearch: (ele.ticketInfo && ele.ticketInfo.hasOwnProperty('NewSearch')) ? (ele.ticketInfo.NewSearch === true ? "Yes" : "No") : "Nan",
                    vehicleDetails: ele.ticketInfo && ele.ticketInfo.hasOwnProperty('VehicleDetailsCount') ? ele.ticketInfo.VehicleDetailsCount : "",
                    selectCount: ele.ticketInfo && ele.ticketInfo.hasOwnProperty('SelectCount') ? ele.ticketInfo.SelectCount : "",
                    newSearchesCount: ele.ticketInfo && ele.ticketInfo.hasOwnProperty('NewSearchCount') ? ele.ticketInfo.NewSearchCount : "",
                    personalInfoCorrection: (ele.ticketInfo && ele.ticketInfo.PersonalInfoCorrection) || "",
                    personalInfoCorrectionDropOff: (ele.ticketInfo && ele.ticketInfo.PersonalInfoCorrection === true && (ele.ticketInfo.username === "" || ele.ticketInfo.mobileNumber === "" || ele.ticketInfo.emailAddress === "")) ? "Yes" : "No",
                    correctionsOfPersonalDetailsCount: ele.ticketInfo.PersonalInfoCorrectionCount,
                    agentAttempted: (ele.analyticInfo && ele.analyticInfo.l1Connect && ele.analyticInfo.l1Connect.status === true) ? 'Yes' : "No",
                    agentResolved: (ele.analyticInfo && ele.analyticInfo.l1Connect && ele.analyticInfo.l1Connect.status === true) ? ((ele.ticketInfo.AgentAvailable) ? 'Yes' : "No") : "None",
                    platform: (ele.ticketInfo && ele.ticketInfo.channelType) || "",
                    crmLeadEmail: ele.leadEmailSent || "",
                    crmTrigger: ele.leadEmailSent ? (ele.completeConversation ? "Confirm" : "Dropoff") : "None",
                    displayDevice: (ele.ticketInfo && ele.ticketInfo.displayDevice) ? ele.ticketInfo.displayDevice : "",
                })
            });
            data.forEach(item => {
                workSheet.addRow(item);
            });
            const buffer = await workbook.xlsx.writeBuffer();
            let fileName = `WinnowProReport.xlsx`;
            await this.waitforme(1000);
            if (_this.isSFTPServerAvailable(flagDetails.config)) {
                let dt = new Date();
                let timeStamp = `${dt.getUTCFullYear()}${zeroPad(dt.getUTCMonth() + 1)}${zeroPad(dt.getUTCDate())}_${zeroPad(dt.getUTCHours())}${zeroPad(dt.getUTCMinutes())}`
                fileName = `${corporateName} - ${timeStamp} - ` + fileName;
                await _this.fileTransfer.upload(flagDetails.config.sFTP, buffer, fileName)
            }
            else {
                const info = {
                    fileName: fileName,
                    to: flagDetails.config.email && flagDetails.config.email.length !== 0 ? flagDetails.config.email : this.winnowProAPIs.emailForReport,
                    subject: `${corporateName} - Winnow Pro Batch Report`,
                    html: `<p style="border-radius : 2px; padding : 10px; -webkit-box-shadow: -5px 5px 5px 0 rgba(0,0,0,.25);
                box-shadow: -5px 5px 5px 0 rgba(0,0,0,.25);">Hi, <br><br> Please find attached WinnowPro Reports for <strong>${corporateName}</strong>. <br><br> regards, <br> iNtelli-Assist</p>`
                }
                let result = await _this.mailer.sendEmailWithAttachment(info, buffer);
                if (result.error) {
                    this.logger.error(`${corporateName} failed to send email excel report : ${result.error} : Response ${result.response}`);
                } else {
                    this.logger.info(`${corporateName} sent email report : ${JSON.stringify(result.response)}`);
                }
            }
        } catch (error) {
            this.logger.error(`Unable to generate:: ${error}`);
        }
    }

    separateTimeAndDate(str = "string") {
        const dateAndTimeSplit = str.split(" ");
        return {
            day: dateAndTimeSplit[0],
            time: dateAndTimeSplit[1]
        }
    }

    isSFTPServerAvailable(flagDetails) {
        if (flagDetails.hasOwnProperty("sFTP")) {
            if (Array.isArray(flagDetails["sFTP"])) {
                for (var i = 0; i < flagDetails["sFTP"].length; i++) {
                    let details = flagDetails["sFTP"][i];
                    if (details.host && details.port && details.username && details.password && details.hasOwnProperty("location")) {
                        return true;
                    }
                }
                return false;
            }
            else {
                return flagDetails["sFTP"].host && flagDetails["sFTP"].port && flagDetails["sFTP"].username && flagDetails["sFTP"].password && flagDetails["sFTP"].hasOwnProperty("location");
            }
        }
        return false
    }

    async getLeadDetailsProcess() {
        try {
            const {
                spanTime
            } = this.config.getWinnowProApis();
            const eleCollection = this.connection.db.collection(this.WinnowProAnalyticCollection);
            const today = new Date();
            const UTCFormattedDate = getUTCFormattedDate(today);
            const startDate = getPastDateTime(UTCFormattedDate, Number(spanTime) * 2 + 5);
            const endDate = getPastDateTime(UTCFormattedDate, Number(spanTime));
            const leadEmailList = await eleCollection.find({
                leadEmailSent: {
                    $exists: false
                },
                modifiedOn: {
                    $gt: startDate,
                    $lte: endDate
                }
            }).toArray();
            leadEmailList.map(async (item) => {
                const {
                    reqId,
                    ticketInfo
                } = item;
                await this.createLead(reqId, ticketInfo);
            })
        } catch (error) {
            this.logger.error(`Cannot create lead with ${reqId}...${error}`);
        }
    }


    async vehicleProcessCron() {
        try {
            if (this.isVehicleProcessRunning) return;
            this.logger.info("Vehicle download process");
            this.isVehicleProcessRunning = true;
            let data = await this.downloadVehiclesJSON();
            if (data) {
                let vehicleJSON = JSON.parse(data);
                // fs.writeFileSync(winnowProDirPath + "/download.json", data);
                await this.processVehiclesJSON(vehicleJSON);
                this.logger.info("Vehicle process done");
            } else {
                this.logger.info("No Vehicle data found");
            }
            this.isVehicleProcessRunning = false;
        } catch (error) {
            this.logger.error(`Failed cron job for vehicle process...${error}`);
        }
    };

    async downloadVehiclesJSON() {
        const {
            vehiclesLocation,
            sftpCredentials
        } = this.config.getWinnowProApis();
        let myPromise = new Promise((resolve, reject) => {
            let conn = new Client();
            conn.on('ready', () => {
                conn.sftp((err, sftp) => {
                    if (err) {
                        this.logger.error(`Failed connection with sftp server...${err}`);
                        resolve(null)
                        return;
                    }
                    sftp.readFile(vehiclesLocation, (err, buffer) => {
                        if (err) {
                            this.logger.error(`Failed read file from sftp...${err}`);
                            resolve(null)
                            return;
                        };
                        conn.end();
                        resolve(buffer.toString());
                    });
                });
            }).on('error', (err) => {
                this.logger.error(`Failed connection to ssh2 server...${err}`);
                resolve(null)
            }).connect({
                host: sftpCredentials.host,
                port: sftpCredentials.port,
                username: sftpCredentials.username,
                password: sftpCredentials.password
            });

        })
        return myPromise;
    }

    /**
     * @description A authentication middleware
     * @param {object} req - Express's Request object 
     * @param {object} res - Express's Response object 
     * @param {Function} next - Express's Next function 
     */
    authenticateUser(req, res, next) {
        try {
            const {
                users,
                JWTSecret
            } = this.config.getWinnowProApis();
            const token = req.header("Authorization").replace("Bearer ", "")
            const decoded = jwt.verify(token, JWTSecret);
            let user = null;
            for (const currUser of users) {
                if (currUser.name === decoded.username) {
                    user = currUser;
                    break;
                }
            }
            if (!user) throw new Error("Invalid token")
            req.user = user;
            next();
        } catch (error) {
            return res.status(401).send({
                message: "Invalid token"
            })
        }
    }

    async login(req, res) {
        try {
            await check("username", "Please provide a username")
                .notEmpty()
                .run(req);
            await check("password", "Please provide a password")
                .notEmpty()
                .run(req);

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                const [error] = errors.array();
                return res.send({
                    status: false,
                    message: error.msg
                });
            }

            const {
                users,
                JWTSecret
            } = this.config.getWinnowProApis();

            const {
                username,
                password
            } = req.body;

            let user = null;
            for (const currUser of users) {
                if (currUser.name === username && currUser.password === password) {
                    user = currUser;
                    break;
                }
            }

            if (!user) {
                return res.send({
                    status: false,
                    message: "Invalid username/password"
                });
            }

            const token = jwt.sign({
                username
            }, JWTSecret, {
                expiresIn: "7d"
            })

            res.send({
                status: true,
                token
            });
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} login failed...${error}`);
            res.send({
                status: false,
                message: "Unable to login"
            });
        }
    }

    async readCSVAndUpdateWinnowProCollection(filepath, jsonFilepath) {
        try {
            const jsonData = await xlToJsonAsync(filepath, null);
            await this.processVehiclesJSON(jsonData);
            await unlinkAsync(filepath);
            this.logger.info(`${this.loggerPrefix} readCSVAndUpdateWinnowProCollection: done`)
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Failed to readCSVAndUpdateWinnowProCollection ...${error}`)

        }
    }

    async processVehiclesJSON(jsonData) {
        try {
            // const data = await readFileAsync(filepath);
            // const parsedCSV = await neatCsv(data);
            const collection = this.connection.db.collection(this.WinnowProVehiclesStoreCollectionName);
            const stockImagesCollection = this.connection.db.collection(this.WinnowProStockImagesCollectionName);
            const offersCollection = this.connection.db.collection(this.WinnowProOffersCollectionName);
            const baseColorsCollection = this.connection.db.collection(this.WinnowProBaseColorsCollectionName);
            const featuresCollection = this.connection.db.collection(this.WinnowProFeaturesCollectionName);
            const dealerImagesCollection = this.connection.db.collection(this.WinnowProDealerLogoImagesCollectionName);
            const noOfOffers = await offersCollection.find({}).count();

            const todayDate = new Date();

            const carsInfo = [];
            for (const vehicle of jsonData) {
                let {
                    dealer_id,
                    vin,
                    chrome_style_id,
                    stock,
                    make,
                    model,
                    trim,
                    vehicle_label,
                    year,
                    sincro_style_id,
                    retail_price,
                    discount_price,
                    internet_price,
                    invoice_price,
                    msrp,
                    sale_price,
                    amens_text,
                    body_style,
                    body_type,
                    vehicle_type,
                    cylinders,
                    date_created,
                    description,
                    displacement,
                    doors,
                    StockState,
                    drivetrain,
                    eng_config,
                    eng_power,
                    engine,
                    exterior,
                    fuel_type,
                    induction,
                    interior,
                    last_modified,
                    lot_date,
                    miles,
                    oem_ext_color_code,
                    oem_int_color_code,
                    oem_model_code,
                    option_codes,
                    photo_id,
                    photo_url,
                    speeds,
                    trans_text,
                    transmission,
                    warranty,
                    vehicle_url
                } = vehicle;

                // sanitize values
                let mappedValues = await this.getStoreMappedValues(make, model, trim);
                make = mappedValues.make;
                model = mappedValues.model;
                trim = mappedValues.trim;

                const body = {
                    dealer_id,
                    vin,
                    chrome_style_id,
                    stock,
                    make,
                    model,
                    trim,
                    vehicle_label,
                    year: Number.isFinite(Number(year)) ? Number(year) : year,
                    retail_price: Number.isFinite(Number(retail_price)) ? Number(retail_price) : retail_price,
                    discount_price: Number.isFinite(Number(discount_price)) ? Number(discount_price) : discount_price,
                    internet_price: Number.isFinite(Number(internet_price)) ? Number(internet_price) : internet_price,
                    invoice_price: Number.isFinite(Number(invoice_price)) ? Number(invoice_price) : invoice_price,
                    sale_price: Number.isFinite(Number(sale_price)) ? Number(sale_price) : sale_price,
                    body_style,
                    body_type: typeof body_type === "string" ? String(body_type).toUpperCase() : body_type,
                    vehicle_type: typeof vehicle_type === "string" ? String(vehicle_type).toUpperCase() : vehicle_type,
                    cylinders,
                    date_created,
                    description,
                    displacement,
                    doors: Number.isFinite(Number(doors)) ? Number(doors) : doors,
                    drivetrain,
                    eng_power,
                    exterior_color: exterior,
                    fuel_type,
                    induction,
                    interior_color: interior,
                    miles: Number.isFinite(Number(miles)) ? Number(miles) : miles,
                    vehicle_url,
                    speeds: Number.isFinite(Number(speeds)) ? Number(speeds) : speeds,
                    oem_int_color_code,
                    oem_ext_color_code,
                    msrp: Number.isFinite(Number(msrp)) ? Number(msrp) : msrp,
                    eng_config,
                    engine,
                    last_modified,
                    lot_date,
                    oem_model_code,
                    photo_id,
                    trans_text,
                    transmission,
                    warranty,
                    sincro_style_id,
                    offer_available: false,
                    StockState,
                    addedOn: getUTCFormattedDate(todayDate)
                }

                if (Array.isArray(amens_text)) {
                    body["amens_text"] = amens_text;
                } else {
                    body["amens_text"] = (typeof amens_text === "string" && amens_text.trim() !== "") ? amens_text.split("|") : [];
                }

                if (Array.isArray(option_codes)) {
                    body["option_codes"] = option_codes;
                } else {
                    body["option_codes"] = (typeof option_codes === "string" && option_codes.trim() !== "") ? option_codes.split(" ") : [];
                }

                if (Array.isArray(photo_url)) {
                    body["photo_url"] = photo_url;
                } else {
                    let photoUrls = [];
                    if (typeof photo_url === "string" && photo_url.trim() !== "") {
                        photoUrls = photo_url.split(" ");
                    }
                    body["photo_url"] = photoUrls;
                }

                const stockImage1 = await this.getStockImageMappedValues(
                    String(make), String(model), String(trim), String(exterior),
                    String(body_type)
                )
                let qry = {
                    make: {
                        $regex: "^" + escapeRegExp(stockImage1.make) + "$",
                        $options: 'i'
                    },
                    model: {
                        $regex: "^" + escapeRegExp(stockImage1.model) + "$",
                        $options: 'i'
                    },
                    body_type: {
                        $regex: "^" + escapeRegExp(stockImage1.body_type) + "$",
                        $options: 'i'
                    },
                    year: {
                        $regex: "^" + escapeRegExp(String(year)) + "$",
                        $options: 'i'
                    },
                    trim: {
                        $regex: "^" + escapeRegExp(stockImage1.trim) + "$",
                        $options: 'i'
                    },
                    color: {
                        $regex: "^" + escapeRegExp(stockImage1.color) + "$",
                        $options: 'i'
                    }
                };
                const stockImage = await stockImagesCollection.findOne(qry);
                if (stockImage) {
                    body["stock_url"] = stockImage.image_url;
                }
                if (!body.hasOwnProperty("stock_url")) {
                    qry = {
                        make: {
                            $regex: "^" + escapeRegExp(stockImage1.make) + "$",
                            $options: 'i'
                        },
                        model: {
                            $regex: "^" + escapeRegExp(stockImage1.model) + "$",
                            $options: 'i'
                        },
                        year: {
                            $regex: "^" + escapeRegExp(String(year)) + "$",
                            $options: 'i'
                        },
                        trim: {
                            $regex: "^" + escapeRegExp(stockImage1.trim) + "$",
                            $options: 'i'
                        },
                        color: {
                            $regex: "^" + escapeRegExp(stockImage1.color) + "$",
                            $options: 'i'
                        }
                    };
                    const stockImage = await stockImagesCollection.findOne(qry);
                    if (stockImage) {
                        body["stock_url"] = stockImage.image_url;
                    }
                }
                if (!body.hasOwnProperty("stock_url")) {
                    qry = {
                        make: {
                            $regex: "^" + escapeRegExp(stockImage1.make) + "$",
                            $options: 'i'
                        },
                        model: {
                            $regex: "^" + escapeRegExp(stockImage1.model) + "$",
                            $options: 'i'
                        },
                        body_type: {
                            $regex: "^" + escapeRegExp(stockImage1.body_type) + "$",
                            $options: 'i'
                        },
                        year: {
                            $regex: "^" + escapeRegExp(String(year)) + "$",
                            $options: 'i'
                        },
                        trim: {
                            $regex: "^" + escapeRegExp(stockImage1.trim) + "$",
                            $options: 'i'
                        }
                    };
                    const stockImage = await stockImagesCollection.findOne(qry);
                    if (stockImage) {
                        body["stock_url"] = stockImage.image_url;
                    }
                }
                if (!body.hasOwnProperty("stock_url")) {
                    qry = {
                        make: {
                            $regex: "^" + escapeRegExp(stockImage1.make) + "$",
                            $options: 'i'
                        },
                        model: {
                            $regex: "^" + escapeRegExp(stockImage1.model) + "$",
                            $options: 'i'
                        },
                        body_type: {
                            $regex: "^" + escapeRegExp(stockImage1.body_type) + "$",
                            $options: 'i'
                        },
                        color: {
                            $regex: "^" + escapeRegExp(stockImage1.color) + "$",
                            $options: 'i'
                        }
                    };
                    const stockImage = await stockImagesCollection.findOne(qry);
                    if (stockImage) {
                        body["stock_url"] = stockImage.image_url;
                    }
                }
                if (!body.hasOwnProperty("stock_url")) {
                    qry = {
                        make: {
                            $regex: "^" + escapeRegExp(stockImage1.make) + "$",
                            $options: 'i'
                        },
                        model: {
                            $regex: "^" + escapeRegExp(stockImage1.model) + "$",
                            $options: 'i'
                        },
                        body_type: {
                            $regex: "^" + escapeRegExp(stockImage1.body_type) + "$",
                            $options: 'i'
                        },
                        trim: {
                            $regex: "^" + escapeRegExp(stockImage1.trim) + "$",
                            $options: 'i'
                        }
                    };
                    const stockImage = await stockImagesCollection.findOne(qry);
                    if (stockImage) {
                        body["stock_url"] = stockImage.image_url;
                    }
                }
                if (!body.hasOwnProperty("stock_url")) {
                    qry = {
                        make: {
                            $regex: "^" + escapeRegExp(stockImage1.make) + "$",
                            $options: 'i'
                        },
                        model: {
                            $regex: "^" + escapeRegExp(stockImage1.model) + "$",
                            $options: 'i'
                        },
                        body_type: {
                            $regex: "^" + escapeRegExp(stockImage1.body_type) + "$",
                            $options: 'i'
                        },
                        year: {
                            $regex: "^" + escapeRegExp(String(year)) + "$",
                            $options: 'i'
                        }
                    };
                    const stockImage = await stockImagesCollection.findOne(qry);
                    if (stockImage) {
                        body["stock_url"] = stockImage.image_url;
                    }
                }
                if (!body.hasOwnProperty("stock_url")) {
                    let qry = {
                        dealer_id: {
                            $regex: "^" + escapeRegExp(String(dealer_id)) + "$",
                            $options: 'i'
                        }
                    };
                    const dealerImage = await dealerImagesCollection.findOne(qry);
                    if (dealerImage) {
                        body["stock_url"] = dealerImage.photo_url;
                    }
                }


                if (noOfOffers > 0) {
                    const offer = await offersCollection.findOne({
                        vin: {
                            $regex: "^" + escapeRegExp(String(vin)) + "$",
                            $options: 'i'
                        },
                        expiry_date: {
                            $gt: getUTCFormattedDate(new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()))
                        }
                    });
                    if (offer) {
                        body["offer_available"] = true;
                        body["offer"] = {
                            expiry_date: offer.expiry_date,
                            down_payment: offer.down_payment,
                            monthly_installment: offer.monthly_installment,
                            no_of_months: offer.no_of_months,
                            mileage_plan: offer.mileage_plan
                        }
                    }
                }

                if (body.exterior_color) {
                    const baseColor = await baseColorsCollection.findOne({
                        color: {
                            $regex: "^" + escapeRegExp(body.exterior_color) + "$",
                            $options: "i"
                        }
                    });
                    if (baseColor) {
                        body["exterior_base_color"] = baseColor.base_color;
                    }
                }

                {
                    // Fields not available in the vehicle store
                    body["summary"] = "";
                    body["mileage_city"] = ""
                    body["mileage_highway"] = "";
                    body["mileage_combined"] = "";
                    body["standard_chargetime"] = "";
                    body["quick_chargetime"] = "";
                }

                if (body.make && body.model && body.year && body.trim) {
                    const descNfeature = await featuresCollection.findOne({
                        make: {
                            $regex: "^" + escapeRegExp(await this.getMappedValue('features', 'make', String(body.make), true)) + "$",
                            $options: "i"
                        },
                        model: {
                            $regex: "^" + escapeRegExp(await this.getMappedValue('features', 'model', String(body.model), true)) + "$",
                            $options: "i"
                        },
                        year: {
                            $regex: "^" + escapeRegExp(String(body.year)) + "$",
                            $options: "i"
                        },
                        trim: {
                            $regex: "^" + escapeRegExp(await this.getMappedValue('features', 'trim', String(body.trim), true)) + "$",
                            $options: "i"
                        }
                    });
                    if (descNfeature) {
                        if (body["description"].trim() == "") {
                            body["description"] = descNfeature.description;
                        }
                        body["summary"] = descNfeature.sunnary;
                        if (body["fuel_type"].trim() == "") {
                            body["fuel_type"] = descNfeature.fuel_type;
                        }
                        if (body["drivetrain"] == "") {
                            body["drivetrain"] = await this.getMappedValue('features', 'drivetrain', String(descNfeature.drive_train), false);
                        }
                        body["mileage_city"] = descNfeature.mileage_city;
                        body["mileage_highway"] = descNfeature.mileage_highway;
                        body["mileage_combined"] = descNfeature.mileage_combined;
                        body["standard_chargetime"] = descNfeature.standard_chargetime;
                        body["quick_chargetime"] = descNfeature.quick_chargetime;
                        body["displacement"] = descNfeature.displacement;
                        body["horsepower_rpm"] = descNfeature.horsepower_rpm;
                        body["passengers"] = descNfeature.passengers;
                        body["speakers"] = descNfeature.speakers;
                        body["warranty"] = descNfeature.warranty;
                    }
                }

                carsInfo.push(body)
            }
            await collection.deleteMany({});

            if (carsInfo.length > 0) {
                await collection.insertMany(carsInfo);
            }
            const colorsCollection = this.connection.db.collection(this.WinnowProColorsCollectionName);
            const makesCollection = this.connection.db.collection(this.WinnowProMakesCollectionName);
            const modelsCollection = this.connection.db.collection(this.WinnowProModelsCollectionName);
            const trimsCollection = this.connection.db.collection(this.WinnowProTrimsCollectionName);
            const bodyTypesCollection = this.connection.db.collection(this.WinnowProBodyTypesCollectionName);
            const vehicleTypesCollection = this.connection.db.collection(this.WinnowProVehicleTypesCollectionName);
            const driveTrainCollection = this.connection.db.collection(this.WinnowProDriveTrainCollectionName);
            const modelTrimsCollection = this.connection.db.collection(this.WinnowProModelTrimsCollectionName);
            const fuelTypeCollection = this.connection.db.collection(this.WinnowProFuelTypesVariancesCollectionName);

            await colorsCollection.deleteMany({});
            await makesCollection.deleteMany({});
            await modelsCollection.deleteMany({});
            await trimsCollection.deleteMany({});
            await bodyTypesCollection.deleteMany({});
            await vehicleTypesCollection.deleteMany({});
            await driveTrainCollection.deleteMany({});
            await modelTrimsCollection.deleteMany({});
            await fuelTypeCollection.deleteMany({});

            for (const {
                make,
                model,
                trim,
                body_type,
                vehicle_type,
                exterior,
                interior,
                drivetrain,
                fuel_type
            } of carsInfo) {
                const promiseArr = [];
                if (interior) {
                    promiseArr.push(colorsCollection.updateOne({
                        color: interior
                    }, {
                        $set: {
                            color: interior
                        }
                    }, {
                        upsert: true
                    }))
                }
                if (make) {
                    promiseArr.push(makesCollection.updateOne({
                        make: {
                            $regex: "^" + make.trim() + "$",
                            $options: "ig"
                        }
                    }, {
                        $set: {
                            make
                        }
                    }, {
                        upsert: true
                    }));
                }
                if (model) {
                    promiseArr.push(modelsCollection.updateOne({
                        model: {
                            $regex: "^" + model.trim() + "$",
                            $options: "i"
                        }
                    }, {
                        $set: {
                            model
                        }
                    }, {
                        upsert: true
                    }));
                }
                if (trim) {
                    promiseArr.push(trimsCollection.updateOne({
                        trim: {
                            $regex: "^" + trim.trim() + "$",
                            $options: "ig"
                        }
                    }, {
                        $set: {
                            trim
                        }
                    }, {
                        upsert: true
                    }));
                }
                if (model && trim) {
                    promiseArr.push(modelTrimsCollection.updateOne({
                        model: {
                            $regex: "^" + model.trim() + "$",
                            $options: "ig"
                        },
                        trim: {
                            $regex: "^" + trim.trim() + "$",
                            $options: "ig"
                        }
                    }, {
                        $set: {
                            model,
                            trim
                        }
                    }, {
                        upsert: true
                    }));
                }
                if (body_type) {
                    promiseArr.push(bodyTypesCollection.updateOne({
                        body_type: {
                            $regex: "^" + body_type.trim() + "$",
                            $options: "ig"
                        }
                    }, {
                        $set: {
                            body_type
                        }
                    }, {
                        upsert: true
                    }));
                }
                if (vehicle_type) {
                    promiseArr.push(vehicleTypesCollection.updateOne({
                        vehicle_type: {
                            $regex: "^" + vehicle_type.trim() + "$",
                            $options: "ig"
                        }
                    }, {
                        $set: {
                            vehicle_type
                        }
                    }, {
                        upsert: true
                    }))
                }
                if (drivetrain) {
                    promiseArr.push(driveTrainCollection.updateOne({
                        drivetrain: {
                            $regex: "^" + drivetrain.trim() + "$",
                            $options: "ig"
                        }
                    }, {
                        $set: {
                            drivetrain
                        }
                    }, {
                        upsert: true
                    }))
                }
                if (fuel_type) {
                    promiseArr.push(fuelTypeCollection.updateOne({
                        fuel_type: {
                            $regex: "^" + fuel_type.trim() + "$",
                            $options: "ig"
                        }
                    }, {
                        $set: {
                            fuel_type
                        }
                    }, {
                        upsert: true
                    }))
                }
                await Promise.all(promiseArr);
                if (exterior) {
                    await colorsCollection.updateOne({
                        color: exterior
                    }, {
                        $set: {
                            color: exterior
                        }
                    }, {
                        upsert: true
                    });
                }
            }
            this.logger.info(`${this.loggerPrefix} processVehiclesJSON: insert count = ${carsInfo.length}`);
            await this.resetMockServer();
            //await unlinkAsync(jsonFilepath);
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Failed to processVehiclesJSON ...${error}`)
        }
    }

    async getStoreMappedValues(make, model, trim) {
        return {
            make: await this.getMappedValue('vehicleStore', 'make', make, false),
            model: await this.getMappedValue('vehicleStore', 'model', model, false),
            trim: await this.getMappedValue('vehicleStore', 'trim', trim, false),
        }
    }

    async getStockImageMappedValues(make, model, trim, color, body_type) {
        return {
            make: await this.getMappedValue('stockImages', 'make', make, true),
            model: await this.getMappedValue('stockImages', 'model', model, true),
            trim: await this.getMappedValue('stockImages', 'trim', trim, true),
            color: await this.getMappedValue('stockImages', 'color', color, true),
            body_type: await this.getMappedValue('stockImages', 'trim', body_type, true)
        }
    }

    escapeRegexSymbols(value) {
        let symbols = ['\\', '(', ')', '.', '+', '[', ']'];
        symbols.forEach(element => {
            value = value.replace(new RegExp("\\" + element, 'g'), "\\" + element);
        });
        return value;
    }

    async getMappedValue(provider, field, value, reverse) {
        const synonymCollection = this.connection.db.collection(this.WinnowProSynonymsCollectionName);

        let doc = null;
        if (synonymCollection) {
            if (!reverse) {
                doc = await synonymCollection.findOne({
                    provider: {
                        $regex: "^" + escapeRegExp(provider) + "$",
                        $options: 'i'
                    },
                    field: {
                        $regex: "^" + escapeRegExp(field) + "$",
                        $options: 'i'
                    },
                    value: {
                        $regex: "^" + escapeRegExp(value) + "$",
                        $options: 'i'
                    }
                });
            } else {
                doc = await synonymCollection.findOne({
                    provider: {
                        $regex: "^" + escapeRegExp(provider) + "$",
                        $options: 'i'
                    },
                    field: {
                        $regex: "^" + escapeRegExp(field) + "$",
                        $options: 'i'
                    },
                    mappedTo: {
                        $regex: "^" + escapeRegExp(value) + "$",
                        $options: 'i'
                    }
                });
            }
        }
        if (!doc) {
            return value;
        } else {
            if (!reverse) {
                return doc.mappedTo
            } else {
                return doc.value
            }
        }
    }

    /**
     * @description Upload a vehicles XLSX file.
     * @param {object} req - A Express request object. 
     * @param {object} res - A Express response object.
     */
    async uploadVehiclesXLSX(req, res) {
        try {
            if (!req.files || !req.files.file) {
                return res.send({
                    status: false,
                    message: "No files were uploaded."
                })
            }
            const {
                file
            } = req.files;
            let inFilename = file.name.toLowerCase();
            if (!(inFilename.endsWith(".xlsx") || inFilename.endsWith(".xls"))) {
                return res.send({
                    status: false,
                    message: "Please upload a .xlsx"
                });
            }

            const randomHash = crypto.randomBytes(16).toString('hex');
            const filename = randomHash + file.name;
            const filepath = path.join(winnowProDirPath, filename);
            const jsonFilepath = path.join(winnowProDirPath, randomHash + "output.json");
            await file.mv(filepath);

            res.send({
                status: true,
                message: "Uploaded successfully"
            });
            this.logger.info(`${this.loggerPrefix} Successfully saved ${filename} to ${winnowProDirPath}`);
            this.readCSVAndUpdateWinnowProCollection(filepath, jsonFilepath);
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Uploading a vehicle XLSX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to upload"
            });
        }
    }

    /**
     * @description download a vehicles XLSX file.
     * @param {object} req - A Express request object. 
     * @param {object} res - A Express response object.
     */

    async downloadVehiclesData(req, res) {
        try {

            const collection = this.connection.db.collection(this.WinnowProVehiclesStoreCollectionName);
            const data = await collection.find({}).toArray()
            if (!data || data.length === 0) {
                return res.status(404).send({ "success": false, "message": "file does not exists" })
            } else {
                return res.status(200).send({ "success": true, "data": data })
            }
        } catch (error) {

            this.logger.error(`${this.loggerPrefix} download a vehicle XLSX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to download"
            });
        }
    }

    /**
     * @description Upload a stock images XLSX file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */
    async uploadStockImagesXLSX(req, res) {
        try {
            if (!req.files || !req.files.file) {
                return res.send({
                    status: false,
                    message: "No files were uploaded."
                })
            }
            const {
                file
            } = req.files;
            let inFilename = file.name.toLowerCase();
            if (!(inFilename.endsWith(".xlsx") || inFilename.endsWith(".xls"))) {
                return res.send({
                    status: false,
                    message: "Please upload a .xlsx"
                });
            }


            const randomHash = crypto.randomBytes(16).toString('hex');
            const filename = randomHash + file.name;
            const filepath = path.join(winnowProDirPath, filename);
            await file.mv(filepath);
            this.logger.info(`${this.loggerPrefix} Successfully saved ${filename} to ${winnowProDirPath}`);
            const jsonFilepath = path.join(winnowProDirPath, randomHash + "output.json");
            const result = await xlToJsonAsync(filepath, null);
            if (!this.stockImagesHasAllFields(result)) {
                return res.send({
                    status: false,
                    message: "Invalid Stock Images .xlsx"
                });
            }
            await this.handleStockImagesJSON(result);
            await unlinkAsync(filepath);
            //await unlinkAsync(jsonFilepath);
            res.send({
                status: true,
                message: "Successfully updated stock images"
            });
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Uploading a stock image XLSX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to upload"
            });
        }
    }

    /**
     * @description download a stock images XLSX file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */
    async downloadStockImageData(req, res) {
        try {
            const collection = this.connection.db.collection(this.WinnowProStockImagesCollectionName);
            const data = await collection.find({}).toArray()
            if (!data || data.length === 0) {
                return res.status(404).send({ "success": false, "message": "file does not exists" })
            } else {
                return res.status(200).send({ "success": true, "data": data })
            }
        } catch (err) {

            this.logger.error(`${this.loggerPrefix} downloading of stock image data file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to download"
            });
        }
    }

    stockImagesHasAllFields(data) {
        let keys = [
            "make", "model", "year", "body_type", "trim", "color", "image_url", "image_right", "image_left"
        ]
        return this.validateDataFields(data, keys)
    }

    async handleStockImagesJSON(data) {
        const collection = this.connection.db.collection(this.WinnowProStockImagesCollectionName);
        const vehiclesStoreCollection = this.connection.db.collection(this.WinnowProVehiclesStoreCollectionName);

        await collection.deleteMany({});
        for (const {
            make,
            model,
            year,
            body_type,
            trim,
            color,
            image_url
        } of data) {
            if (make && model && year && trim && color && image_url) {
                await collection.updateOne({
                    make: {
                        $regex: escapeRegExp(make),
                        $options: 'i'
                    },
                    model: {
                        $regex: escapeRegExp(model),
                        $options: 'i'
                    },
                    year: {
                        $regex: escapeRegExp(year),
                        $options: 'i'
                    },
                    body_type: {
                        $regex: escapeRegExp(body_type),
                        $options: 'i'
                    },
                    trim: {
                        $regex: escapeRegExp(trim),
                        $options: 'i'
                    },
                    color: {
                        $regex: escapeRegExp(color),
                        $options: 'i'
                    }
                }, {
                    $set: {
                        make,
                        model,
                        year,
                        body_type,
                        trim,
                        color,
                        image_url
                    }
                }, {
                    upsert: true
                });
                // await vehiclesStoreCollection.updateMany(
                //     {
                //         make: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'make', make, false)), $options: 'i' },
                //         model: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'model', model, false)), $options: 'i' },
                //         year: { $regex: escapeRegExp(year), $options: 'i' },
                //         trim: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'trim', trim, false)), $options: 'i' },
                //         color: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'color', color, false)), $options: 'i' },
                //     },
                //     {
                //         $set: { stock_url: image_url }
                //     }
                // );
                // await vehiclesStoreCollection.updateMany(
                //     {
                //         make: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'make', make, false)), $options: 'i' },
                //         model: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'model', model, false)), $options: 'i' },
                //         trim: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'trim', trim, false)), $options: 'i' },
                //         color: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'color', color, false)), $options: 'i' },
                //         stock_url: { $exists: false }
                //     },
                //     {
                //         $set: { stock_url: image_url }
                //     }
                // );
                // await vehiclesStoreCollection.updateMany(
                //     {
                //         make: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'make', make, false)), $options: 'i' },
                //         model: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'model', model, false)), $options: 'i' },
                //         year: { $regex: escapeRegExp(year), $options: 'i' },
                //         trim: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'trim', trim, false)), $options: 'i' },
                //         stock_url: { $exists: false }
                //     },
                //     {
                //         $set: { stock_url: image_url }
                //     }
                // );
                // await vehiclesStoreCollection.updateMany(
                //     {
                //         make: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'make', make, false)), $options: 'i' },
                //         model: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'model', model, false)), $options: 'i' },
                //         color: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'color', color, false)), $options: 'i' },
                //         stock_url: { $exists: false }
                //     },
                //     {
                //         $set: { stock_url: image_url }
                //     }
                // );
                // await vehiclesStoreCollection.updateMany(
                //     {
                //         make: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'make', make, false)), $options: 'i' },
                //         model: { $regex: escapeRegExp(await this.getMappedValue('stockImages', 'model', model, false)), $options: 'i' },
                //         year: { $regex: escapeRegExp(year), $options: 'i' },
                //         stock_url: { $exists: false }
                //     },
                //     {
                //         $set: { stock_url: image_url }
                //     }
                // );
            }
        }

    }

    /**
     * @description Upload a Dealer Logo images XLSX file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */
    async uploadDealerLogosXLSX(req, res) {
        try {
            if (!req.files || !req.files.file) {
                return res.send({
                    status: false,
                    message: "No files were uploaded."
                })
            }
            const {
                file
            } = req.files;
            let inFilename = file.name.toLowerCase();
            if (!(inFilename.endsWith(".xlsx") || inFilename.endsWith(".xls"))) {
                return res.send({
                    status: false,
                    message: "Please upload a .xlsx"
                });
            }


            const randomHash = crypto.randomBytes(16).toString('hex');
            const filename = randomHash + file.name;
            const filepath = path.join(winnowProDirPath, filename);
            await file.mv(filepath);
            this.logger.info(`${this.loggerPrefix} Successfully saved ${filename} to ${winnowProDirPath}`);
            const jsonFilepath = path.join(winnowProDirPath, randomHash + "output.json");
            const result = await xlToJsonAsync(filepath, null);
            if (!this.dealerLogoImagesHasAllFields(result)) {
                return res.send({
                    status: false,
                    message: "Invalid Dealer Logo Images .xlsx"
                });
            }
            await this.handleDealerLogoImagesJSON(result);
            await unlinkAsync(filepath);
            //await unlinkAsync(jsonFilepath);
            res.send({
                status: true,
                message: "Successfully updated Dealer Logo images"
            });
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Uploading a dealer image XLSX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to upload"
            });
        }
    }

    /**
     * @description download a Dealer Logo images XLSX file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */
    async downloadDealerLogosData(req, res) {
        try {
            const collection = this.connection.db.collection(this.WinnowProDealerLogoImagesCollectionName);
            const data = await collection.find({}).toArray()
            if (!data || data.length === 0) {
                return res.status(404).send({ "success": false, "message": "file does not exists" })
            } else {
                return res.status(200).send({ "success": true, "data": data })
            }
        } catch (error) {

            this.logger.error(`${this.loggerPrefix} download a dealer image XLSX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to download"
            });
        }
    }

    dealerLogoImagesHasAllFields(data) {
        let keys = [
            "dealer_id", "photo_url"
        ]
        return this.validateDataFields(data, keys)
    }

    async handleDealerLogoImagesJSON(data) {
        const collection = this.connection.db.collection(this.WinnowProDealerLogoImagesCollectionName);
        const vehiclesStoreCollection = this.connection.db.collection(this.WinnowProVehiclesStoreCollectionName);

        await collection.deleteMany({});
        for (const {
            dealer_id,
            photo_url
        } of data) {
            if (dealer_id && photo_url) {
                await collection.updateOne({
                    dealer_id: {
                        $regex: escapeRegExp(dealer_id),
                        $options: 'i'
                    },
                }, {
                    $set: {
                        dealer_id,
                        photo_url
                    }
                }, {
                    upsert: true
                });
                // await vehiclesStoreCollection.updateMany(
                //     {
                //         dealer_id: { $regex: escapeRegExp(dealer_id), $options: 'i' },
                //         photo_url: { $size: 0 }
                //     },
                //     {
                //         $set: { photo_url: [photo_url] }
                //     }
                // );
            }
        }

    }

    /**
     * @description Upload a offers XLSX file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */
    async uploadOffersXLSX(req, res) {
        try {

            if (!req.files || !req.files.file) {
                return res.send({
                    status: false,
                    message: "No files were uploaded."
                })
            }
            const {
                file
            } = req.files;
            let inFilename = file.name.toLowerCase();
            if (!(inFilename.endsWith(".xlsx") || inFilename.endsWith(".xls"))) {
                return res.send({
                    status: false,
                    message: "Please upload a .xlsx"
                });
            }


            const randomHash = crypto.randomBytes(16).toString('hex');
            const filename = randomHash + file.name;
            const filepath = path.join(winnowProDirPath, filename);
            await file.mv(filepath);
            this.logger.info(`${this.loggerPrefix} Successfully saved ${filename} to ${winnowProDirPath}`);
            const jsonFilepath = path.join(winnowProDirPath, randomHash + "output.json");
            const result = await xlToJsonAsync(filepath, null);
            await this.handleOffersJSON(result)
            await unlinkAsync(filepath);
            //await unlinkAsync(jsonFilepath);
            res.send({
                status: true,
                message: "Successfully updated offers"
            });
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Uploading a offers XLSX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to upload"
            });
        }
    }

    /**
     * @description Upload a offers XLSX file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */

    async downloadOffersData(req, res) {
        try {
            const collection = this.connection.db.collection(this.WinnowProOffersCollectionName);
            const data = await collection.find({}).toArray()
            if (!data || data.length === 0) {
                return res.status(404).send({ "success": false, "message": "file does not exists" })
            } else {
                return res.status(200).send({ "success": true, "data": data })
            }
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} downloading of a offers XLSX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to download"
            });
        }
    }

    async handleOffersJSON(data) {
        const collection = this.connection.db.collection(this.WinnowProOffersCollectionName);

        await collection.deleteMany({});

        const offers = [];

        for (const {
            year,
            make,
            model,
            vin,
            down_payment,
            monthly_installment,
            no_of_months,
            mileage_plan,
            expiry_date
        } of data) {
            if (vin && typeof expiry_date === "string" && isISO8601(expiry_date)) {
                const body = {
                    vin,
                    expiry_date: getUTCFormattedDate(new Date(expiry_date))
                };
                if (make) body["make"] = make;
                if (model) body["model"] = model;
                if (year) body["year"] = year;
                if (down_payment) body["down_payment"] = down_payment;
                if (monthly_installment) body["monthly_installment"] = monthly_installment;
                if (no_of_months) body["no_of_months"] = no_of_months;
                if (mileage_plan) body["mileage_plan"] = mileage_plan;

                offers.push(body);
            }
        }
        if (offers.length > 0) {
            await collection.insertMany(offers);
        }
    }

    /**
     * @description Upload a base color XLSX file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */
    async uploadBaseColorXLSX(req, res) {
        try {
            if (!req.files || !req.files.file) {
                return res.send({
                    status: false,
                    message: "No files were uploaded."
                })
            }
            const {
                file
            } = req.files;
            let inFilename = file.name.toLowerCase();
            if (!(inFilename.endsWith(".xlsx") || inFilename.endsWith(".xls"))) {
                return res.send({
                    status: false,
                    message: "Please upload a .xlsx"
                });
            }


            const randomHash = crypto.randomBytes(16).toString('hex');
            const filename = randomHash + file.name;
            const filepath = path.join(winnowProDirPath, filename);
            await file.mv(filepath);
            this.logger.info(`${this.loggerPrefix} Successfully saved ${filename} to ${winnowProDirPath}`);
            const jsonFilepath = path.join(winnowProDirPath, randomHash + "output.json");
            const result = await xlToJsonAsync(filepath, null);
            if (!this.baseColorHasAllFields(result)) {
                return res.send({
                    status: false,
                    message: "Invalid Base Colors .xlsx"
                });
            }
            await this.handleBaseColorJSON(result);
            await unlinkAsync(filepath);
            //await unlinkAsync(jsonFilepath);
            res.send({
                status: true,
                message: "Successfully updated base colors"
            });
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Uploading a stock base color XLSX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to upload"
            });
        }
    }

    /**
     * @description download a base color data file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */
    async downloadBaseColorData(req, res) {
        try {
            const collection = this.connection.db.collection(this.WinnowProBaseColorsCollectionName);
            const baseColorCollection = await collection.find({}).toArray()
            if (!baseColorCollection || baseColorCollection.length === 0) {
                return res.status(404).send({ "success": false, "message": "file does not exists" })
            } else {
                return res.status(200).send({ "success": true, "data": baseColorCollection })
            }
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} downloading a stock base color XLSX file failed...${error}`);
            console.log(error)
            res.status(500).send({
                status: false,
                message: "Unable to download"
            });
        }
    }

    baseColorHasAllFields(data) {
        let keys = ["color", "base_color"]
        return this.validateDataFields(data, keys)
    }

    async handleBaseColorJSON(data) {
        const collection = this.connection.db.collection(this.WinnowProBaseColorsCollectionName);
        const vehiclesStoreCollection = this.connection.db.collection(this.WinnowProVehiclesStoreCollectionName);

        await collection.deleteMany({});
        for (const {
            color,
            base_color
        } of data) {
            if (color && base_color) {
                await collection.updateOne({
                    color: {
                        $regex: escapeRegExp(color),
                        $options: 'i'
                    }
                }, {
                    $set: {
                        color,
                        base_color
                    }
                }, {
                    upsert: true
                });
                // await vehiclesStoreCollection.updateMany(
                //     {
                //         exterior_color: { $regex: escapeRegExp(color), $options: 'i' }
                //     },
                //     {
                //         $set: { exterior_base_color: base_color }
                //     }
                // );
            }
        }

    }

    /**
     * @description Upload a features XLSX file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */
    async uploadFeaturesXLSX(req, res) {
        try {
            if (!req.files || !req.files.file) {
                return res.send({
                    status: false,
                    message: "No files were uploaded."
                })
            }
            const {
                file
            } = req.files;
            let inFilename = file.name.toLowerCase();
            if (!(inFilename.endsWith(".xlsx") || inFilename.endsWith(".xls"))) {
                return res.send({
                    status: false,
                    message: "Please upload a .xlsx"
                });
            }

            const randomHash = crypto.randomBytes(16).toString('hex');
            const filename = randomHash + file.name;
            const filepath = path.join(winnowProDirPath, filename);
            await file.mv(filepath);
            this.logger.info(`${this.loggerPrefix} Successfully saved ${filename} to ${winnowProDirPath}`);
            const jsonFilepath = path.join(winnowProDirPath, randomHash + "output.json");
            const result = await xlToJsonAsync(filepath, null);
            if (!this.featuresHasAllFields(result)) {
                return res.send({
                    status: false,
                    message: "Invalid Features .xlsx"
                });
            }
            await this.handleFeaturesJSON(result);
            await unlinkAsync(filepath);
            //await unlinkAsync(jsonFilepath);
            res.send({
                status: true,
                message: "Successfully updated features"
            });
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Uploading a feature XLSX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to upload"
            });
        }
    }

    /**
     * @description download a features XLSX file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */

    async downloadFeaturesData(req, res) {
        try {
            const collection = this.connection.db.collection(this.WinnowProFeaturesCollectionName);
            const data = await collection.find({}).toArray()
            if (!data || data.length === 0) {
                return res.status(404).send({ "success": false, "message": "file does not exists" })
            } else {
                return res.status(200).send({ "success": true, "data": data })
            }
        } catch (error) {

            this.logger.error(`${this.loggerPrefix} downloading a feature XLSX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to download"
            });
        }
    }

    featuresHasAllFields(data) {
        let keys = ["make", "model", "year", "trim",
            "summary",
            "description",
            "fuel_type",
            "drive_train",
            "mileage_range_city",
            "mileage_range_highway",
            "mileage_range_combined",
            "level_II_standard_chargetime",
            "level_III_quick_chargetime",
            "displacement",
            "horsepower_rpm",
            "passengers",
            "speakers",
            "warranty1", "warranty2", "warranty3", "warranty4", "warranty5", "warranty6", "url"
        ]
        return this.validateDataFields(data, keys);
    }

    async handleFeaturesJSON(data) {
        const collection = this.connection.db.collection(this.WinnowProFeaturesCollectionName);
        const vehiclesStoreCollection = this.connection.db.collection(this.WinnowProVehiclesStoreCollectionName);

        await collection.deleteMany({});
        for (const row of data) {
            let {
                make,
                model,
                year,
                trim,
                summary,
                description,
                fuel_type,
                drive_train,
                mileage_range_city,
                mileage_range_highway,
                mileage_range_combined,
                level_II_standard_chargetime,
                level_III_quick_chargetime,
                displacement,
                horsepower_rpm,
                passengers,
                speakers,
                warranty1,
                warranty2,
                warranty3,
                warranty4,
                warranty5,
                warranty6,
                url
            } = row;
            if (make && model && year && trim) {
                let res = await collection.updateOne({
                    make: {
                        $regex: escapeRegExp(make),
                        $options: 'i'
                    },
                    model: {
                        $regex: escapeRegExp(model),
                        $options: 'i'
                    },
                    year: {
                        $regex: escapeRegExp(year),
                        $options: 'i'
                    },
                    trim: {
                        $regex: escapeRegExp(trim),
                        $options: 'i'
                    }
                }, {
                    $set: {
                        make,
                        model,
                        year,
                        trim,
                        summary,
                        description,
                        drive_train,
                        mileage_city: mileage_range_city,
                        mileage_highway: mileage_range_highway,
                        mileage_combined: mileage_range_combined,
                        standard_chargetime: level_II_standard_chargetime,
                        quick_chargetime: level_III_quick_chargetime,
                        displacement,
                        horsepower_rpm,
                        passengers,
                        speakers,
                        warranty1,
                        warranty2,
                        warranty3,
                        warranty4,
                        warranty5,
                        warranty6
                    }
                }, {
                    upsert: true
                });

                // res = await vehiclesStoreCollection.updateMany(
                //     {
                //         make: { $regex: escapeRegExp(await this.getMappedValue('features', 'make', make, false)), $options: 'i' },
                //         model: { $regex: escapeRegExp(await this.getMappedValue('features', 'model', model, false)), $options: 'i' },
                //         year: Number(year),
                //         trim: { $regex: escapeRegExp(await this.getMappedValue('features', 'trim', trim, false)), $options: 'i' },
                //         description: ""
                //     },
                //     {
                //         $set: { description: description }
                //     }
                // );

                // res = await vehiclesStoreCollection.updateMany(
                //     {
                //         make: { $regex: escapeRegExp(await this.getMappedValue('features', 'make', make, false)), $options: 'i' },
                //         model: { $regex: escapeRegExp(await this.getMappedValue('features', 'model', model, false)), $options: 'i' },
                //         year: Number(year),
                //         trim: { $regex: escapeRegExp(await this.getMappedValue('features', 'trim', trim, false)), $options: 'i' },
                //         displacement: ""
                //     },
                //     {
                //         $set: { displacement: displacement }
                //     }
                // );

                // res = await vehiclesStoreCollection.updateMany(
                //     {
                //         make: { $regex: escapeRegExp(await this.getMappedValue('features', 'make', make, false)), $options: 'i' },
                //         model: { $regex: escapeRegExp(await this.getMappedValue('features', 'model', model, false)), $options: 'i' },
                //         year: Number(year),
                //         trim: { $regex: escapeRegExp(await this.getMappedValue('features', 'trim', trim, false)), $options: 'i' },
                //         fuel_type: ""
                //     },
                //     {
                //         $set: { fuel_type: fuel_type }
                //     }
                // );

                // res = await vehiclesStoreCollection.updateMany(
                //     {
                //         make: { $regex: escapeRegExp(await this.getMappedValue('features', 'make', make, false)), $options: 'i' },
                //         model: { $regex: escapeRegExp(await this.getMappedValue('features', 'model', model, false)), $options: 'i' },
                //         year: Number(year),
                //         trim: { $regex: escapeRegExp(await this.getMappedValue('features', 'trim', trim, false)), $options: 'i' },
                //         drivetrain: ""
                //     },
                //     {
                //         $set: { drivetrain: String(await this.getMappedValue('features', 'drivetrain', drive_train, false)) }
                //     }
                // );

                // res = await vehiclesStoreCollection.updateMany(
                //     {
                //         make: { $regex: escapeRegExp(await this.getMappedValue('features', 'make', make, false)), $options: 'i' },
                //         model: { $regex: escapeRegExp(await this.getMappedValue('features', 'model', model, false)), $options: 'i' },
                //         year: Number(year),
                //         trim: { $regex: escapeRegExp(await this.getMappedValue('features', 'trim', trim, false)), $options: 'i' }
                //     },
                //     {
                //         $set: {
                //             summary,
                //             mileage_city: mileage_range_city,
                //             mileage_highway: mileage_range_highway,
                //             mileage_combined: mileage_range_combined,
                //             standard_chargetime: level_II_standard_chargetime,
                //             quick_chargetime: level_III_quick_chargetime,
                //             horsepower_rpm,
                //             passengers,
                //             speakers,
                //             warranty1,
                //             warranty2,
                //             warranty3,
                //             warranty4,
                //             warranty5,
                //             warranty6
                //         }
                //     }
                // );
            }
        }
    }

    validateDataFields(data, fields) {
        if (data.length > 0) {
            let hasEmpty = false;
            let result = true;
            Object.keys(data[0]).forEach(element => {
                if (element == "") {
                    hasEmpty = true;
                    return;
                }
                if (result) {
                    result = fields.includes(element);
                }
            });
            if (result) {
                result = (Object.keys(data[0]).length == (hasEmpty ? fields.length + 1 : fields.length));
            }
            return result;
        }
        return false;
    }

    /**
     * @description Upload a Synonyms XLSX file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */
    async uploadSynonymsXLSX(req, res) {
        try {
            if (!req.files || !req.files.file) {
                return res.send({
                    status: false,
                    message: "No files were uploaded."
                })
            }
            const {
                file
            } = req.files;
            let inFilename = file.name.toLowerCase();
            if (!(inFilename.endsWith(".xlsx") || inFilename.endsWith(".xls"))) {
                return res.send({
                    status: false,
                    message: "Please upload a .xlsx"
                });
            }


            const randomHash = crypto.randomBytes(16).toString('hex');
            const filename = randomHash + file.name;
            const filepath = path.join(winnowProDirPath, filename);
            await file.mv(filepath);
            this.logger.info(`${this.loggerPrefix} Successfully saved ${filename} to ${winnowProDirPath}`);
            const jsonFilepath = path.join(winnowProDirPath, randomHash + "output.json");
            const result = await xlToJsonAsync(filepath, null);
            if (!this.synonymsHasAllFields(result)) {
                return res.send({
                    status: false,
                    message: "Invalid Synonyms .xlsx"
                });
            }
            await this.handleSynonymsJSON(result);
            await unlinkAsync(filepath);
            //await unlinkAsync(jsonFilepath);
            res.send({
                status: true,
                message: "Successfully updated Synonyms"
            });
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Uploading a Synonym XSLX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to upload"
            });
        }
    }

    /**
     * @description Upload a Synonyms XLSX file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */
    async downloadSynonymsData(req, res) {
        try {
            const collection = this.connection.db.collection(this.WinnowProSynonymsCollectionName);
            const data = await collection.find({}).toArray();
            if (!data || data.length === 0) {
                return res.status(404).send({ "success": false, "message": "file does not exists" })
            } else {
                return res.status(200).send({ "success": true, "data": data })
            }
        } catch (error) {

            this.logger.error(`${this.loggerPrefix} download of a Synonym XSLX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to download"
            });
        }
    }
    synonymsHasAllFields(data) {
        let keys = ["provider", "field", "value", "mappedTo"]
        return this.validateDataFields(data, keys);
    }

    /**
     * @description Upload a Reject Words XLSX file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */
    async uploadRejectWordsXLSX(req, res) {
        try {
            if (!req.files || !req.files.file) {
                return res.send({
                    status: false,
                    message: "No files were uploaded."
                })
            }
            const {
                file
            } = req.files;
            let inFilename = file.name.toLowerCase();
            if (!(inFilename.endsWith(".xlsx") || inFilename.endsWith(".xls"))) {
                return res.send({
                    status: false,
                    message: "Please upload a .xlsx"
                });
            }


            const randomHash = crypto.randomBytes(16).toString('hex');
            const filename = randomHash + file.name;
            const filepath = path.join(winnowProDirPath, filename);
            await file.mv(filepath);
            this.logger.info(`${this.loggerPrefix} Successfully saved ${filename} to ${winnowProDirPath}`);
            const jsonFilepath = path.join(winnowProDirPath, randomHash + "output.json");
            const result = await xlToJsonAsync(filepath, null);
            if (!this.rejectWordsHasAllFields(result)) {
                return res.send({
                    status: false,
                    message: "Invalid Synonyms .xlsx"
                });
            }
            await this.handleRejectWordsJSON(result);
            await unlinkAsync(filepath);
            //await unlinkAsync(jsonFilepath);
            res.send({
                status: true,
                message: "Successfully updated Reject Words"
            });
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Uploading a Reject Words XSLX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to upload"
            });
        }
    }

    async downloadRejectWordsData(req, res) {
        try {
            const collection = this.connection.db.collection(this.WinnowProRejectWordsCollectionName);
            const data = await collection.find({}).toArray();
            if (!data || data.length === 0) {
                return res.status(404).send({ "success": false, "message": "file does not exists" })
            } else {
                return res.status(200).send({ "success": true, "data": data })
            }
        } catch (error) {

            this.logger.error(`${this.loggerPrefix} download of a Reject Words XSLX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to download"
            });
        }




    }

    rejectWordsHasAllFields(data) {
        let keys = ["field", "value"]
        return this.validateDataFields(data, keys);
    }

    async handleRejectWordsJSON(data) {
        const collection = this.connection.db.collection(this.WinnowProRejectWordsCollectionName);

        await collection.deleteMany({});
        for (const {
            field,
            value
        } of data) {
            if (field && value) {
                await collection.updateOne({
                    field: {
                        $regex: escapeRegExp(field),
                        $options: 'i'
                    },
                    value: {
                        $regex: escapeRegExp(value),
                        $options: 'i'
                    }
                }, {
                    $set: {
                        field,
                        value
                    }
                }, {
                    upsert: true
                });
            }
        }
    }

    modelVariancesHasAllFields(data) {
        let keys = ["attribute", "value", "Variances"]
        return this.validateDataFields(data, keys);
    }

    /**
     * @description Create Lead to the Mock Server.
     * @param {string} reqId - Request ID.
     * @param {string} ticketInfo - TicketInfo details.
     */
    async createLead(reqId, ticketInfo) {
        const {
            mockServerCredentials
        } = this.config.getWinnowProApis();
        const url = this.config.getImageUrl() + "/ServiceManagement/WinnowPro/createLeadByReqId";
        try {
            const options = {
                method: "POST",
                body: JSON.stringify({
                    reqId: reqId
                }),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${base64.encode(mockServerCredentials.username + ':' + mockServerCredentials.password)}`
                }
            };

            const response = await fetch(url, options);
            if (response.status >= 400) {
                this.logger.error(`Failed to Create Lead for reqID ${reqId}`);
                return {
                    status: false,
                    message: "Failed to Create Lead"
                }
            }
            const responseData = await response.json();
            if (!responseData.status) {
                this.logger.error(`Failed to create lead...${JSON.stringify(responseData)}`);
                return;
            }
            // logger.info(`Successfully sent SMS to ${phoneNumber}`);
            this.logger.info(`SuccessFully called createLeadByReqId with reqId ${reqId} for email [${ticketInfo.emailAddress}] & mobile no. [${ticketInfo.mobileNumber}]`);
        } catch (error) {
            this.logger.error(`Failed to create lead with ${reqId}: ${error}`);
        }
    }

    /**
     * @description Reset Entities Cache of Mock Server.
     */
    async resetMockServer() {
        const {
            mockServerCredentials
        } = this.config.getWinnowProApis();
        const url = this.config.getImageUrl() + "/ServiceManagement/WinnowPro/resetEntitiesCache";
        try {
            const options = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${base64.encode(mockServerCredentials.username + ':' + mockServerCredentials.password)}`
                }
            };

            const response = await fetch(url, options);
            // console.log(response);
            if (response.status >= 400) {
                this.logger.error(`Failed to reset Cache`);
            }
            this.logger.info(`SuccessFully called resetEntitiesCache of MockServer`);
        } catch (error) {
            this.logger.error(`Failed to call resetEntitiesCache of MockServer`);
        }
    }

    async handleSynonymsJSON(data) {
        const collection = this.connection.db.collection(this.WinnowProSynonymsCollectionName);

        await collection.deleteMany({});
        for (const {
            provider,
            field,
            value,
            mappedTo
        } of data) {
            if (provider && field && value && mappedTo) {
                await collection.updateOne({
                    provider: {
                        $regex: escapeRegExp(provider),
                        $options: 'i'
                    },
                    field: {
                        $regex: escapeRegExp(field),
                        $options: 'i'
                    },
                    value: {
                        $regex: escapeRegExp(value),
                        $options: 'i'
                    }
                }, {
                    $set: {
                        provider,
                        field,
                        value,
                        mappedTo
                    }
                }, {
                    upsert: true
                });
            }
        }

    }

    async handleModelVariancesJSON(data) {
        const collection = this.connection.db.collection(this.WinnowProModelVariancesCollection);

        await collection.deleteMany({});
        for (let {
            Variances,
            value,
            attribute
        } of data) {
            Variances = Variances.split(",")
            if (Variances.length > 0 && value && attribute) {
                await collection.updateOne({
                    attribute: {
                        $regex: escapeRegExp(attribute),
                        $options: 'i'
                    },
                    value: {
                        $regex: escapeRegExp(value),
                        $options: 'i'
                    }
                }, {
                    $set: {
                        Variances,
                        attribute,
                        value
                    }
                }, {
                    upsert: true
                });
            }
        }

    }
    /**
     * @description Upload a Synonyms XLSX file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */
    async uploadModelVariances(req, res) {
        try {
            if (!req.files || !req.files.file) {
                return res.send({
                    status: false,
                    message: "No files were uploaded."
                })
            }
            const {
                file
            } = req.files;
            let inFilename = file.name.toLowerCase();
            if (!(inFilename.endsWith(".xlsx") || inFilename.endsWith(".xls"))) {
                return res.send({
                    status: false,
                    message: "Please upload a .xlsx"
                });
            }


            const randomHash = crypto.randomBytes(16).toString('hex');
            const filename = randomHash + file.name;
            const filepath = path.join(winnowProDirPath, filename);
            await file.mv(filepath);
            this.logger.info(`${this.loggerPrefix} Successfully saved ${filename} to ${winnowProDirPath}`);
            const jsonFilepath = path.join(winnowProDirPath, randomHash + "output.json");
            const result = await xlToJsonAsync(filepath, jsonFilepath);
            if (!this.modelVariancesHasAllFields(result)) {
                return res.send({
                    status: false,
                    message: "Invalid ModelVariances .xlsx"
                });
            }
            await this.handleModelVariancesJSON(result);
            await unlinkAsync(filepath);
            //await unlinkAsync(jsonFilepath);
            res.send({
                status: true,
                message: "Successfully updated ModelVariances"
            });
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Uploading a ModelVariances XSLX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to upload"
            });
        }
    }
    /**
     * @description Upload a Synonyms XLSX file.
     * @param {object} req - A Express request object.
     * @param {object} res - A Express response object.
     */
    async downloadModelVariance(req, res) {
        try {
            const collection = this.connection.db.collection(this.WinnowProModelVariancesCollection);
            const data = await collection.find({}).toArray()
            if (!data || data.length === 0) {
                return res.status(404).send({ "success": false, "message": "file does not exists" })
            } else {
                return res.status(200).send({ "success": true, "data": data })
            }
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} download of a ModelVariances XSLX file failed...${error}`);
            res.send({
                status: false,
                message: "Unable to download"
            });
        }
    }
}

function escapeRegExp(string) {
    return string.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

module.exports = WinnowProBatchProcess