const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { check, validationResult } = require('express-validator');
const XLSX = require('xlsx');

const Mailer = require('../../Services/mailerV2');
const { formatNowDateTimeUTC, formatNowDateTimeUTCUnit } = require('../../dateTimeUtils');
const {
    fileExistsAsync,
    xlToJsonAsync,
    unlinkAsync,
    setTimeInterval,
    shortenURLAsync,
    sendSMSWrapper,
    reverseTransliterateWrapper,
    delete_rows,
    formate_Coloumns

} = require('../helperFns');
const { uploadDirPath, languagesAndShortCode } = require('../constants');

// checks if leasing service dir is there or not. If not, It will create the dir.
const leasingServiceDirPath = path.join(uploadDirPath, "leasingService");
if (!fs.existsSync(leasingServiceDirPath)) {
    fs.mkdirSync(leasingServiceDirPath);
}
// checks if Excel dir under leasing service  is there or not. If not, It will create the dir.
const leasingServiceExcelDirPath = path.join(leasingServiceDirPath, "Excel");
if (!fs.existsSync(leasingServiceExcelDirPath)) {
    fs.mkdirSync(leasingServiceExcelDirPath);
}
// checks if Json dir under leasing service  is there or not. If not, It will create the dir.
const leasingServiceJSONDirPath = path.join(leasingServiceDirPath, "Json");
if (!fs.existsSync(leasingServiceJSONDirPath)) {
    fs.mkdirSync(leasingServiceJSONDirPath);
}

const _sendSMSWrapper = (config, logger, corporate, categoryId, subCategoryId) => {
    const { isSMSSent } = config.getLPAapis();
    if (typeof isSMSSent === "boolean" && isSMSSent) {
        return sendSMSWrapper(config, logger, corporate, categoryId, subCategoryId);
    }
    else {
        return async ({ message, phoneNumber }) => {
            logger.debug("Sent SMS: " + phoneNumber + ": " + message);
            return {
                status: true,
                message: "Success"
            }
        }
    }
}


/**
 * @classdesc A Leasing service batch processes class
 */
class LeasingServicesBatchProcess {
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
        this.app = app;
        this.unit = config.getLPAapis().Unit;
        this.webServerURL = config.getMockwebserverURL();
        this.isLPAAddSFTPRunning = false;
        this.isLPADailyProcessRunning = false;
        this.mailer = new Mailer({
            mailEnabled: this.config.mailEnabled(),
            SMTPServer: this.config.mailSMTPServer(),
            SMTPServerPort: this.config.mailSMTPServerPort(),
            secure: false,
            mailUsername: this.config.mailUsername(),
            mailPassword: this.config.mailPassword(),
            mailFromAddress: this.config.mailFromAddress()
        }, logger);
        const { corporate } = config.getLPAapis();
        this.sendSMS = _sendSMSWrapper(config, logger, corporate, "NAUSHAD_CATEGORY", "LEASING_SERVICE_REQUEST");
        this.reverseTransliterate = reverseTransliterateWrapper(config, logger);
        this.SFTPFilename = "Contact+Level+Details.xlsx";
        this.UploadResidenceSFTPFilename = "UploadResidenceSFTPData.xlsx";
        /**
         * @private Please don't reference and assign any value to this property 
         */
        this._controlLPAFlow = true;
        this.isSMSSent = config.getLPAapis();
    }

    /**
     * @param {boolean} value 
     */
    set controlLPAFlow(value) {
        if (typeof value === 'boolean') {
            this._controlLPAFlow = value;
        }
    }

    get controlLPAFlow() {
        return this._controlLPAFlow;
    }

    async init() {
        this.initAPIs();
        this.initCronJobs();

    }


    /**
     * @description Initializes all APIs.
     */
    initAPIs() {
        /**
         * @api {post} /ServiceManagement/LeasingServices/UploadSFTPData Uploads SFTP data excel file.
         * @apiName UploadSFTPExcel
         * @apiGroup LeasingServices
         *
         * @apiParam (multipart/form-data) {File} file SFTP excel file
         * 
         * @apiSuccess {Boolean} status Status of the response.
         * @apiSuccess {String} message Success message.
         *
         *
         * @apiError (200) {Boolean} status Status of the response.
         * @apiError (200) {String} message Failure message.
         */
        this.app.post(
            "/ServiceManagement/LeasingServices/UploadSFTPData",
            this.uploadExcel.bind(this)
        );
        /**
         * @api {post} /ServiceManagement/LeasingServices/UploadResidenceSFTPData Uploads SFTP data excel file.
         * @apiName UploadResidenceSFTPData
         * @apiGroup LeasingServices
         *
         * @apiParam (multipart/form-data) {File} file SFTP excel file
         * 
         * @apiSuccess {Boolean} status Status of the response.
         * @apiSuccess {String} message Success message.
         *
         *
         * @apiError (200) {Boolean} status Status of the response.
         * @apiError (200) {String} message Failure message.
         */
        this.app.post(
            "/ServiceManagement/LeasingServices/UploadResidenceSFTPData",
            this.UploadResidenceSFTPData.bind(this)
        );
        /**
         * @api {post} /ServiceManagement/LeasingServices/ControlLPAFlow Control LeasingServices process.
         * @apiName ControlLPAFlow
         * @apiGroup LeasingServices
         *
         * @apiParam {Boolean} controlLPAFlow To control flow
         *
         * @apiSuccess {Boolean} status Status of the response.
         * @apiSuccess {String} message Success message.
         *
         *
         * @apiError (200) {Boolean} status Status of the response.
         * @apiError (200) {String} message Failure message.
         */
        this.app.post(
            "/ServiceManagement/LeasingServices/ControlLPAFlow",
            this.controlProcessFlow.bind(this)
        );
    }

    /**
     * @description Initializes all cron processes.
     */
    initCronJobs() {
        const { isDailyRunRequired } = this.config.getLPAapis();

        // if (typeof isSMSSent === "boolean" && isSMSSent) {
        //     this.sendDailyMessage();
        // }

        if (typeof isDailyRunRequired === "boolean" && isDailyRunRequired) {
            this.dailyProcess();
        }
    }
    delay(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time)
        });
    }
    /**
    * @description Upload a excel file.
    * @param {object} req - A Express request object. 
    * @param {object} res - A Express response object.
    */
    async uploadExcel(req, res) {
        try {
            if (this.isLPAAddSFTPRunning) {
                return res.send({ status: false, message: "upload in progress..." });
            }
            if (!req.files || !req.files.file) {
                return res.send({ status: false, message: "No files were uploaded." })
            }
            const { file } = req.files;
            if (!file.name.endsWith(".csv")) {
                return res.send({ status: false, message: "Please upload a .csv" });
            }
            const { AgencyName } = req.body;
            const filename = this.SFTPFilename;

            await file.mv(path.join(leasingServiceExcelDirPath, "Contact+Level+Details.csv"));
            res.send({ status: true, message: "Uploaded successfully" });

            //Read HTML
            const workbook = XLSX.readFile(path.join(leasingServiceExcelDirPath, "Contact+Level+Details.csv"));

            XLSX.writeFile(workbook, path.join(leasingServiceExcelDirPath, filename), {
                bookType: "xlsx"
            })
            const workbook1 = XLSX.readFile(path.join(leasingServiceExcelDirPath, "Contact+Level+Details.xlsx"));
            let worksheet = workbook1.Sheets["Sheet1"]
            formate_Coloumns(worksheet, "J", "MM/DD/YYYY")
            formate_Coloumns(worksheet, "k", "MM/DD/YYYY")
            XLSX.writeFile(workbook, path.join(leasingServiceExcelDirPath, filename), {
                bookType: "xlsx"
            })
            await unlinkAsync(path.join(leasingServiceExcelDirPath, "Contact+Level+Details.csv"));
            // await file.mv(path.join(leasingServiceExcelDirPath, "Contact+Level+Details.html"));
            // res.send({ status: true, message: "Uploaded successfully" });

            // //Read HTML
            // const workbook = XLSX.readFile(path.join(leasingServiceExcelDirPath, "Contact+Level+Details.html"));
            // console.log("leasingServiceExcelDirPath....", leasingServiceExcelDirPath)
            // // Save as XLSX
            // XLSX.writeFile(workbook, path.join(leasingServiceExcelDirPath, "out.xlsx"), {
            //     bookType: "xlsx"
            // })

            // // Convert Sheet2 of XLSX to HTML
            // const workbook2 = XLSX.readFile(path.join(leasingServiceExcelDirPath, "out.xlsx"))
            // const sheet2 = XLSX.utils.sheet_to_html(workbook2.Sheets["Sheet2"])
            // fs.writeFileSync(path.join(leasingServiceExcelDirPath, "out2.html"), sheet2);

            // // Convert HTML to Final XLSX
            // const workbook3 = XLSX.readFile(path.join(leasingServiceExcelDirPath, "out2.html"));
            // XLSX.writeFile(workbook, path.join(leasingServiceExcelDirPath, filename), {
            //     bookType: "xlsx"
            // })
            // await unlinkAsync(path.join(leasingServiceExcelDirPath, "Contact+Level+Details.html"));
            // await unlinkAsync(path.join(leasingServiceExcelDirPath, "out2.html"));
            // await unlinkAsync(path.join(leasingServiceExcelDirPath, "out.xlsx"));
            await this.delay(20000)
            await this.addSFTPRecordsToDB(AgencyName)
            await this.delay(20000)
            const xlsxFilepath = path.join(leasingServiceExcelDirPath, this.SFTPFilename);
            await unlinkAsync(xlsxFilepath);
        } catch (error) {
            this.logger.error(`Uploading a excel file failed...${error}`);
            res.send({ status: false, message: "Unable to upload" });
        }
    }
    /**
       * @description Upload a excel file.
       * @param {object} req - A Express request object. 
       * @param {object} res - A Express response object.
       */
    async UploadResidenceSFTPData(req, res) {
        try {
            const leasingCollection = this.connection.db.collection('LPAResidenceCollection');
            if (!req.files || !req.files.file) {
                return res.send({ status: false, message: "No files were uploaded." })
            }
            const { file } = req.files;
            if (!file.name.endsWith(".xlsx")) {
                return res.send({ status: false, message: "Please upload a .xlsx" });
            }

            const filename = this.UploadResidenceSFTPFilename;


            await file.mv(path.join(leasingServiceExcelDirPath, filename));
            const xlsxFilepath = path.join(leasingServiceExcelDirPath, this.UploadResidenceSFTPFilename);
            const jsonFilepath = path.join(leasingServiceJSONDirPath, "Residenceoutput.json");
            const isFile = await fileExistsAsync(xlsxFilepath);
            if (isFile) {
                const result = await xlToJsonAsync(xlsxFilepath, jsonFilepath);

                for (const row of result) {
                    const isValidCustomerData = this.validateResidenceSFTPData(row);

                    if (isValidCustomerData) {

                        const customer = await leasingCollection.findOne({
                            AgencyName: row.AgencyName

                        });

                        if (!customer || customer === null) {
                            const val = await leasingCollection.insertOne(row)

                        }
                    }
                }
                res.send({ status: true, message: "Uploaded successfully" });
            }

        } catch (error) {
            this.logger.error(`Uploading a excel file failed...${error}`);
            res.send({ status: false, message: "Unable to upload" });
        }
    }

    /**
     * @description Control LeasingServices  Flow
     * @param {object} req - A Express request object. 
     * @param {object} res - A Express response object.
     */
    async controlProcessFlow(req, res) {
        try {
            await check("controlLPAFlow", "Please provide a valid controlLPAFlow value")
                .isBoolean()
                .toBoolean()
                .run(req)

            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                const [error] = errors.array();
                return res.send({
                    status: false,
                    message: error.msg
                });
            }

            if (req.body.controlLPAFlow) {
                this.controlLPAFlow = true;
                res.send({ status: true, message: "Batch process of leasing services enables." });
            } else {
                this.controlLPAFlow = false;
                res.send({ status: true, message: "Batch process of leasing services disabled." });
            }

        } catch (error) {
            this.logger.error(`Failed control leasing services process flow ...${error}`);
            res.send({ status: false, message: "Something went wrong in the server" });
        }
    }
    phoneNumber(number) {
        if (typeof number != "string") return
        number = number.replace("(", "");
        number = number.replace(")", "");
        number = number.replace(" ", "");
        number = number.replace("-", "");
        if (number.startsWith("+") || number.startsWith("00")) {
            return number
        } else {
            return "+1" + number
        }

    }

    async sendDailyMessage() {
        try {
            const { message } = this.config.getLPAapis().OnBoardSMS;
            const leasingCollection = this.connection.db.collection('LPACustomersCollection');
            const customers = await leasingCollection.find().toArray();
            const today = formatNowDateTimeUTC();

            for (let customer of customers) {
                if (customer.languageSMS.isSMSSent === true) return
                const msgObject = {
                    name: customer.customerName,
                    apartment: customer.apartmentInfo.apartmentName
                };

                const messageText = this.replaceDetailsInMsg(message, msgObject);
                const sentSMSResponse = await this.sendSMS({
                    phoneNumber: this.phoneNumber(customer.phoneNumber),
                    message: messageText
                });
                let myquery = { phoneNumber: customer.phoneNumber };
                let newvalues = {
                    $set: {
                        OnBoardSMSDate: today,
                        languageSMS: {
                            isSMSSent: true,
                            SMSSentDate: today
                        }
                    }
                };

                if (sentSMSResponse.status) {
                    const updateobj = await leasingCollection.updateOne(myquery, newvalues)
                    if (updateobj.nModified === 0) {
                        this.logger.info(`Failled to update send welcome SMS in DB ${customer.phoneNumber} "${messageText}"`);
                    }
                    this.logger.info(`Successfully to send welcome SMS to ${customer.phoneNumber} "${messageText}"`);
                    await this.delay(20000)
                } else {
                    this.logger.debug(`Unable to send welcome SMS to ${customer.phoneNumber}`);
                }
            }

        } catch (error) {
            this.logger.error(`Failed to send Daily Message...${error}`);
        }
    }
    async addSFTPRecordsToDB(AgencyName) {
        this.logger.debug(`addSFTPRecordsToDB.........AgencyName..${AgencyName}`);
        try {
            const leasingCollection = this.connection.db.collection('LPACustomersCollection');
            const leasingResidenceCollection = this.connection.db.collection('LPAResidenceCollection');
            const xlsxFilepath = path.join(leasingServiceExcelDirPath, this.SFTPFilename);
            const jsonFilepath = path.join(leasingServiceJSONDirPath, "output.json");
            const isFile = await fileExistsAsync(xlsxFilepath);
            if (isFile) {
                const residence = await leasingResidenceCollection.findOne({
                    AgencyName: AgencyName
                });
                const result = await xlToJsonAsync(xlsxFilepath, jsonFilepath);
                const today = formatNowDateTimeUTC();
                for (const row of result) {
                    const isValidCustomerData = this.validateCustomerSFTPData(row);
                    if (isValidCustomerData) {
                        const customer = await leasingCollection.findOne({
                            $or: [{ phoneNumber: row['Cell Phone'] }, { phoneNumber: row['Home Phone'] }],
                            contractEndDate: { $gt: today }
                        });
                        if (!customer || customer === null) {
                            const customerObj = this.generateNewCustomerStructure(row, residence);
                            await leasingCollection.insertOne(customerObj);
                        }
                    }
                }

                const customers = await leasingCollection.find().toArray();

                for (const customer of customers) {

                    const chatwootCallCenters = result.filter((result) => result['Cell Phone'] === customer.phoneNumber || result['Home Phone'] === customer.phoneNumber);
                    if (!chatwootCallCenters) {
                        await leasingCollection.remove({
                            phoneNumber: customer.phoneNumber,
                            contractEndDate: customer.contractEndDate
                        })
                    }
                }


            }
            await unlinkAsync(jsonFilepath);
        } catch (error) {
            this.logger.error(`Failed to add customers from SFTP file...${error}`);
        }

    }
    /**
     * @description Daily Process to run relating Leasing customer and service request
     */
    dailyProcess() {
        const { DailyRunTime: scheduleTime } = this.config.getLPAapis();
        const dailyProcessCron = async () => {
            try {
                if (this.isLPADailyProcessRunning) return;
                if (this.controlLPAFlow) {
                    this.logger.info("Started daily batch process");
                    this.isLPADailyProcessRunning = true;
                    await this.sendDailyMessage();
                    await this.sendReviewLinkSMSs();
                    await this.sendGoogleReviewLinkSMSs();
                    await this.sendSanglistLinkSMSs();
                    await this.sendServiceRequestsEmailToLeasingManagers();
                    await this.sendEscalatedServiceRequestsToLeasingSupervisors();
                    await this.sendContractRenewalSMSs();
                    this.logger.info("Finished daily batch process");
                    this.isLPADailyProcessRunning = false;
                }
            } catch (error) {
                this.logger.error(`Failed cron job for daily process...${error}`);
            }
        };
        cron.schedule(scheduleTime, dailyProcessCron);
    }


    /**
     * @description Send Feedback review links to customers
     */
    async sendReviewLinkSMSs() {
        //this.logger.info("Started sending review SMSs...");
        const today = formatNowDateTimeUTCUnit(this.unit);
        const typeOfReviews = this.config.getLPAapis().CustomerReview.ReviewConfig;
        const queriesAndReviews = [];
        for (let i = 0; i < typeOfReviews.length; i++) {
            // build query object for each type of reviews
            const query = {
                CustomerAddedDate: {
                    $lt: setTimeInterval(this.unit, typeOfReviews[i].interval, true)
                },
                contractEndDate: { $gt: today },
                [`reviews.${[typeOfReviews[i].reviewId]}.isSMSSent`]: false,
                [`reviews.${[typeOfReviews[i].reviewId]}.SMSSentDate`]: "",

            };
            if (i < (typeOfReviews.length - 1)) {
                query.CustomerAddedDate.$gte = setTimeInterval(this.unit, typeOfReviews[i + 1].interval, true);
            }
            const review = typeOfReviews[i];
            queriesAndReviews.push({ query, review });
        }

        const leasingCustomersCollection = this.connection.db.collection('LPACustomersCollection');

        for (const { query, review } of queriesAndReviews) {
            const customers = await leasingCustomersCollection.find(query).toArray();
            for (const customer of customers) {
                if (review.toSend) {
                    let msgText = this.extractMessage(review.message, customer.languageChoosen);
                    const longURL = `${this.webServerURL}?pageId=${review.pageId}&phoneNumber=${customer.phoneNumber}&Type=${review.reviewId}`;
                    let shortURL = "";
                    try {
                        shortURL = await shortenURLAsync(longURL);
                        shortURL = shortURL ? shortURL : longURL;
                    } catch (error) {
                        this.logger.debug(`Failed to shorten URL ${longURL}...${JSON.stringify(error)}`);
                        shortURL = longURL;
                    }

                    const msgObject = {
                        name: customer.customerName,
                        apartment: customer.apartmentInfo.apartmentName,
                        url: shortURL
                    };

                    const languageShortCode = this.getLanguageShortCode(customer.languageChoosen);
                    const [nameReverseTransliterationResponse, apartmentReverseTransliterationResponse] = await Promise.all([
                        this.reverseTransliterate({
                            text: msgObject.name,
                            destinationLang: languageShortCode,
                            value: 'name',
                            isNumber: false
                        }),
                        this.reverseTransliterate({
                            text: msgObject.apartment,
                            destinationLang: languageShortCode,
                            value: 'apartment',
                            isNumber: false
                        })
                    ]);

                    if (nameReverseTransliterationResponse.status) {
                        msgObject.name = nameReverseTransliterationResponse.res;
                    }
                    if (apartmentReverseTransliterationResponse.status) {
                        msgObject.apartment = apartmentReverseTransliterationResponse.res;
                    }

                    const messageText = this.replaceDetailsInMsg(msgText, msgObject);

                    const sentSMSResponse = await this.sendSMS({
                        phoneNumber: this.phoneNumber(customer.phoneNumber),
                        message: messageText
                    });
                    if (sentSMSResponse.status) {
                        const queryObj = {
                            phoneNumber: customer.phoneNumber,
                            contractEndDate: { $gt: today }
                        };
                        const updateObj = {
                            [`reviews.${review.reviewId}.isSMSSent`]: true,
                            [`reviews.${review.reviewId}.SMSSentDate`]: today
                        };
                        const updateLeasingCustomer = await leasingCustomersCollection.updateOne(queryObj, { $set: updateObj });
                        if (!updateLeasingCustomer.result || updateLeasingCustomer.result.n === 0) {
                            this.logger.debug(`Unable to update review ${review.reviewId} for customer with phone number ${customer.phoneNumber}`);
                        } else {
                            this.logger.info(`Successfully updated and sent a review type ${review.reviewId} SMS to "${customer.phoneNumber}" message "${messageText}"`);
                        }
                    }
                } else {
                    const queryObj = {
                        phoneNumber: customer.phoneNumber,
                        contractEndDate: { $gt: today }
                    };
                    const updateObj = {
                        [`reviews.${review.reviewId}.isSMSSent`]: true,
                        [`reviews.${review.reviewId}.SMSSentDate`]: today
                    };
                    const updateLeasingCustomer = await leasingCustomersCollection.updateOne(queryObj, { $set: updateObj });
                    if (!updateLeasingCustomer.result || updateLeasingCustomer.result.n === 0) {
                        this.logger.debug(`Unable to update review ${review.reviewId} for customer with phone number ${customer.phoneNumber}`);
                    } else {
                        this.logger.info(`Successfully updated and sent a review type ${review.reviewId} SMS to "${customer.phoneNumber}" message`);
                    }
                }
            }
        }
        //this.logger.info("Finished sending review SMSs...");
    }


    /**
   * @description Sends Google Review reminder SMS to customer
   */
    async sendGoogleReviewLinkSMSs() {
        //this.logger.info("Started sending Google Review reminder SMSs...");
        const { message } = this.config.getLPAapis().GoogleReview;
        const { pageURL } = this.config.getLPAapis().GoogleReview;
        const typeOfReviews = this.config.getLPAapis().GoogleReview.ReviewConfig;
        const today = formatNowDateTimeUTCUnit(this.unit);
        const queriesAndReviews = [];
        for (let i = 0; i < typeOfReviews.length; i++) {
            const query = {
                CustomerAddedDate: {
                    $lt: setTimeInterval(this.unit, typeOfReviews[i].interval, true)
                },
                contractEndDate: { $gt: today },
                "googleReview.isDone": false,
                [`googleReview.reviewReminders.${typeOfReviews[i].reviewId}.isSMSSent`]: false,
                [`googleReview.reviewReminders.${typeOfReviews[i].reviewId}.SMSSentDate`]: ""
            };
            if (i < (typeOfReviews.length - 1)) {
                query.CustomerAddedDate.$gte = setTimeInterval(this.unit, typeOfReviews[i + 1].interval, true);
            }
            queriesAndReviews.push({ query, review: typeOfReviews[i] });
        }

        const leasingCustomersCollection = this.connection.db.collection('LPACustomersCollection');

        for (const { query, review } of queriesAndReviews) {
            const customers = await leasingCustomersCollection.find(query).toArray();
            for (const customer of customers) {
                if (review.toSend) {
                    let msgText = this.extractMessage(message, customer.languageChoosen);

                    const longURL = `${this.config.getImageUrl() + pageURL}?phoneNumber=${customer.phoneNumber}&Type=${review.reviewId}`
                    let shortURL = "";
                    try {
                        shortURL = await shortenURLAsync(longURL);
                        shortURL = shortURL ? shortURL : longURL;
                    } catch (error) {
                        this.logger.debug(`Failed to shorten URL ${longURL}...${JSON.stringify(error)}`);
                        shortURL = longURL;
                    }

                    const msgObject = {
                        name: customer.customerName,
                        url: shortURL
                    };

                    const languageShortCode = this.getLanguageShortCode(customer.languageChoosen);

                    const nameReverseTransliterationResponse = await this.reverseTransliterate({
                        text: msgObject.name,
                        destinationLang: languageShortCode,
                        value: 'name',
                        isNumber: false
                    })

                    if (nameReverseTransliterationResponse.status) {
                        msgObject.name = nameReverseTransliterationResponse.res;
                    }


                    const messageText = this.replaceDetailsInMsg(msgText, msgObject);

                    const sentSMSResponse = await this.sendSMS({
                        phoneNumber: this.phoneNumber(customer.phoneNumber),
                        message: messageText,
                    });

                    if (sentSMSResponse.status) {
                        const queryObj = {
                            phoneNumber: customer.phoneNumber,
                            contractEndDate: { $gt: today }
                        };
                        const updateObj = {
                            [`googleReview.reviewReminders.${review.reviewId}.isSMSSent`]: true,
                            [`googleReview.reviewReminders.${review.reviewId}.SMSSentDate`]: today
                        };
                        const updateLeasingCustomer = await leasingCustomersCollection.updateOne(queryObj, { $set: updateObj });
                        if (!updateLeasingCustomer.result || updateLeasingCustomer.result.n === 0) {
                            this.logger.debug(`Unable to update review ${review.reviewId} for customer with phone number ${customer.phoneNumber}`);
                        } else {
                            this.logger.info(`Successfully updated and sent a review type ${review.reviewId} SMS to ${customer.phoneNumber} with message "${messageText}"`);
                        }
                    }
                } else {
                    const queryObj = {
                        phoneNumber: customer.phoneNumber,
                        contractEndDate: { $gt: today }
                    };
                    const updateObj = {
                        [`googleReview.reviewReminders.${review.reviewId}.isSMSSent`]: true,
                        [`googleReview.reviewReminders.${review.reviewId}.SMSSentDate`]: today
                    };
                    const updateLeasingCustomer = await leasingCustomersCollection.updateOne(queryObj, { $set: updateObj });
                    if (!updateLeasingCustomer.result || updateLeasingCustomer.result.n === 0) {
                        this.logger.debug(`Unable to update review ${review.reviewId} for customer with phone number ${customer.phoneNumber}`);
                    } else {
                        this.logger.info(`Successfully updated and sent a review type ${review.reviewId} SMS to ${customer.phoneNumber} with message`);
                    }
                }
            }
        }
        //this.logger.info("Finished sending Google Review reminder SMSs...");
    }


    /**
    * @description Sends Snag list SMSs to customer
    */
    async sendSanglistLinkSMSs() {
        //this.logger.info("Started sending snag list SMSs...");
        const { message } = this.config.getLPAapis().SnaglistSMS;
        const typeOfReviews = this.config.getLPAapis().SnaglistSMS.ReviewConfig;
        const today = formatNowDateTimeUTCUnit(this.unit);
        const queriesAndReviews = [];
        for (let i = 0; i < typeOfReviews.length; i++) {
            const query = {
                CustomerAddedDate: {
                    $lt: setTimeInterval(this.unit, typeOfReviews[i].interval, true)
                },
                contractEndDate: { $gt: today },
                "snagList.isDone": false,
                [`snagList.reviewReminders.${typeOfReviews[i].reviewId}.isSMSSent`]: false,
                [`snagList.reviewReminders.${typeOfReviews[i].reviewId}.SMSSentDate`]: ""
            };
            if (i < (typeOfReviews.length - 1)) {
                query.CustomerAddedDate.$gte = setTimeInterval(this.unit, typeOfReviews[i + 1].interval, true);
            }
            queriesAndReviews.push({ query, review: typeOfReviews[i] });
        }

        const leasingCustomersCollection = this.connection.db.collection('LPACustomersCollection');


        for (const { query, review } of queriesAndReviews) {
            const customers = await leasingCustomersCollection.find(query).toArray();
            for (const customer of customers) {
                let msgText = this.extractMessage(message, customer.languageChoosen);

                const longURL = `${this.webServerURL}?pageId=${review.pageId}&phoneNumber=${customer.phoneNumber}&Type=${review.reviewId}`
                let shortURL = "";
                try {
                    shortURL = await shortenURLAsync(longURL);
                    shortURL = shortURL ? shortURL : longURL;
                } catch (error) {
                    this.logger.debug(`Failed to shorten URL ${longURL}...${JSON.stringify(error)}`);
                    shortURL = longURL;
                }

                const msgObject = {
                    name: customer.customerName,
                    url: shortURL
                };

                const languageShortCode = this.getLanguageShortCode(customer.languageChoosen);

                const nameReverseTransliterationResponse = await this.reverseTransliterate({
                    text: msgObject.name,
                    destinationLang: languageShortCode,
                    value: 'name',
                    isNumber: false
                })

                if (nameReverseTransliterationResponse.status) {
                    msgObject.name = nameReverseTransliterationResponse.res;
                }

                const messageText = this.replaceDetailsInMsg(msgText, msgObject);

                const sentSMSResponse = await this.sendSMS({
                    phoneNumber: this.phoneNumber(customer.phoneNumber),
                    message: messageText
                });
                if (sentSMSResponse.status) {
                    const queryObj = {
                        phoneNumber: customer.phoneNumber,
                        contractEndDate: { $gt: today }
                    };
                    const updateObj = {
                        [`snagList.reviewReminders.${review.reviewId}.isSMSSent`]: true,
                        [`snagList.reviewReminders.${review.reviewId}.SMSSentDate`]: today
                    };
                    const updateLeasingCustomer = await leasingCustomersCollection.updateOne(queryObj, { $set: updateObj });
                    if (!updateLeasingCustomer.result || updateLeasingCustomer.result.n === 0) {
                        this.logger.debug(`Unable to update review ${review.reviewId} for customer with phone number ${customer.phoneNumber}`);
                    } else {
                        this.logger.info(`Successfully updated and sent a review type ${review.reviewId} SMS to  ${customer.phoneNumber} with "${messageText}"`);
                    }
                }
            }
        }
        //this.logger.info("Finished sending snag list SMSs...");
    }


    /**
     * @description Sends Contract renewal SMSs to customer
     */
    async sendContractRenewalSMSs() {
        //this.logger.info("Started sending contract renewal SMSs...");
        const { message } = this.config.getLPAapis().ContractRenewal;
        const { pageId } = this.config.getLPAapis().ContractRenewal;
        const { interval } = this.config.getLPAapis().ContractRenewal;
        const today = formatNowDateTimeUTCUnit(this.unit);
        const outputDate = setTimeInterval(this.unit, interval, false);
        const query = {
            "renewal.isSMSSent": false,
            contractEndDate: {
                $gt: today,
                $lte: outputDate
            }
        };

        const leasingCustomersCollection = this.connection.db.collection('LPACustomersCollection');
        const customers = await leasingCustomersCollection.find(query).toArray();

        for (const customer of customers) {
            let msgText = this.extractMessage(message, customer.languageChoosen);

            const longURL = this.webServerURL + "?pageId=" + pageId + "&phoneNumber=" + customer.phoneNumber;
            let shortURL = "";
            try {
                shortURL = await shortenURLAsync(longURL);
                shortURL = shortURL ? shortURL : longURL;
            } catch (error) {
                this.logger.debug(`Failed to shorten URL ${longURL}...${JSON.stringify(error)}`);
                shortURL = longURL;
            }

            const msgObject = {
                name: customer.customerName,
                apartment: customer.apartmentInfo.apartmentName,
                url: shortURL
            };

            const languageShortCode = this.getLanguageShortCode(customer.languageChoosen);
            const [nameReverseTransliterationResponse, apartmentReverseTransliterationResponse] = await Promise.all([
                this.reverseTransliterate({
                    text: msgObject.name,
                    destinationLang: languageShortCode,
                    value: 'name',
                    isNumber: false
                }),
                this.reverseTransliterate({
                    text: msgObject.apartment,
                    destinationLang: languageShortCode,
                    value: 'apartment',
                    isNumber: false
                })
            ]);

            if (nameReverseTransliterationResponse.status) {
                msgObject.name = nameReverseTransliterationResponse.res;
            }
            if (apartmentReverseTransliterationResponse.status) {
                msgObject.apartment = apartmentReverseTransliterationResponse.res;
            }

            const messageText = this.replaceDetailsInMsg(msgText, msgObject);
            const sentSMSResponse = await this.sendSMS({
                phoneNumber: this.phoneNumber(customer.phoneNumber),
                message: messageText
            });

            if (sentSMSResponse.status) {
                const queryObj = {
                    phoneNumber: customer.phoneNumber,
                    contractEndDate: { $gt: today }
                };
                const updateObj = {
                    "renewal.isSMSSent": true,
                    "renewal.SMSSentDate": today
                };
                const updateLeasingCustomer = await leasingCustomersCollection.updateOne(queryObj, { $set: updateObj });
                if (!updateLeasingCustomer.result || updateLeasingCustomer.result.n === 0) {
                    this.logger.debug(`Unable to update contract renewal for customer with phone number ${customer.phoneNumber}`);
                } else {
                    this.logger.info(`Successfully updated and sent a contract renewal "${messageText}" SMS to customer with phone number ${customer.phoneNumber}`);
                }
            }
        }
        //this.logger.info("Finished sending contract renewal SMSs...");
    }

    /**
   * @description Sends Email to Leasing Manager containing list of ticketId of new service requests
   */
    async sendServiceRequestsEmailToLeasingManagers() {
        //this.logger.info("Started sending new service request email to leasing manager...");
        try {
            const query = {
                "NotificationToManager.isSENT": false,
                "completeConversation": true,
                "status": "NEW"
            };
            const today = formatNowDateTimeUTCUnit(this.unit);
            const lpaServiceRequestCollection = this.connection.db.collection('LPAServiceRequestCollection');
            const serviceRequests = await lpaServiceRequestCollection.find(query).toArray();
            if (serviceRequests.length > 0) {
                const emailsAndTicketIdsObj = serviceRequests.reduce((acc, curr) => ({
                    ...acc,
                    [curr.manager.Email]: acc[curr.manager.Email] ? [...acc[curr.manager.Email], curr.ticketId] : [curr.ticketId]
                }), {});

                const emailsAndTicketIds = Object.keys(emailsAndTicketIdsObj).map(email => ({
                    email,
                    tickets: emailsAndTicketIdsObj[email]
                }));

                this.logger.info(`EmailToLeasingManagers tickets = ${JSON.stringify(emailsAndTicketIds)}`);
                const emailResponses = await Promise.all(
                    emailsAndTicketIds.map(emailAndTickets => this.sendServiceRequestsEmail({ ...emailAndTickets, subject: "SERVICE REQUEST FROM CUSTOMER(S)" }))
                );

                const ticketsToUpdate = [];
                for (let i = 0; i < emailResponses.length; i++) {
                    if (emailResponses[i].status) {
                        ticketsToUpdate.push(...emailsAndTicketIds[i].tickets);
                    } else {
                        this.logger.debug(`Failed to send email to leasing manager's email ${emailsAndTicketIds[i].email} regarding new service requests`);
                    }
                }
                await Promise.all(
                    ticketsToUpdate.map(ticketId => lpaServiceRequestCollection.updateOne(
                        {
                            ticketId
                        },
                        {
                            $set: {
                                "NotificationToManager.isSENT": true,
                                "NotificationToManager.date": today
                            }
                        }
                    ))
                );
            }
        } catch (error) {
            this.logger.error(`Failed to send service requests emails to Leasing Manager...${JSON.stringify(error)}`);
        } finally {
            // this.logger.info("Finished sending new service request email to leasing manager...");
        }
    }



    /**
     * @description Sends Email to Leasing Supervisor containing list of ticketId of escalated service requests
     */
    async sendEscalatedServiceRequestsToLeasingSupervisors() {
        //this.logger.info("Started sending escalated service request email to leasing supervisor...");
        try {
            const { interval } = this.config.getLPAapis().Escalate;
            const today = formatNowDateTimeUTCUnit(this.unit);
            const outputDate = setTimeInterval(this.unit, interval, true);
            const query = {
                "NotificationToSupervisor.isSENT": false,
                "status": "NEW",
                "createdOn": { $lt: outputDate }
            };

            const lpaServiceRequestCollection = this.connection.db.collection('LPAServiceRequestCollection');
            const serviceRequests = await lpaServiceRequestCollection.find(query).toArray();
            if (serviceRequests.length > 0) {

                const emailsAndTicketIdsObj = serviceRequests.reduce((acc, curr) => ({
                    ...acc,
                    [curr.supervisor.Email]: acc[curr.supervisor.Email] ? [...acc[curr.supervisor.Email], curr.ticketId] : [curr.ticketId]
                }), {});
                const emailsAndTicketIds = Object.keys(emailsAndTicketIdsObj).map(email => ({
                    email,
                    tickets: emailsAndTicketIdsObj[email]
                }));

                this.logger.info(`EmailToLeasingSupervisors tickets = ${JSON.stringify(emailsAndTicketIds)}`);
                const emailResponses = await Promise.all(
                    emailsAndTicketIds.map(emailAndTickets => this.sendServiceRequestsEmail({ ...emailAndTickets, subject: "ESCALATED SERVICE REQUEST FROM CUSTOMER(S)" }))
                );

                const ticketsToUpdate = [];
                for (let i = 0; i < emailResponses.length; i++) {
                    if (emailResponses[i].status) {
                        ticketsToUpdate.push(...emailsAndTicketIds[i].tickets);
                    } else {
                        this.logger.debug(`Failed to send email to leasing supervisor's email ${emailsAndTicketIds[i].email} regarding escalated service requests`);
                    }
                }

                await Promise.all(
                    ticketsToUpdate.map(ticketId => lpaServiceRequestCollection.updateOne(
                        {
                            ticketId
                        },
                        {
                            $set: {
                                "NotificationToSupervisor.isSENT": true,
                                "NotificationToSupervisor.date": today,
                                status: "ESCALATED"
                            }
                        }
                    ))
                );
            }
        } catch (error) {
            this.logger.error(`Failed to send service requests emails to Leasing Supervisor...${JSON.stringify(error)}`);
        } finally {
            // this.logger.info("Finished sending escalated service request email to leasing supervisor...");
        }
    }



    /**
     * @description Extract out the message text from message object depending on the language provided. If no language provide defaults to english
     * @param {object} messageObject - A message object contain key/value pair. with key being language and value being message 
     * @param {string} language - language 
     */
    extractMessage(messageObject, language) {
        if (!language) {
            language = "English";
        }
        let msgText = "";
        if (messageObject[language]) {
            msgText = messageObject[language];
        }
        return msgText;
    }

    /**
     * @description Gets the short code for the given language
     * @param {string} language - Name of the language
     */
    getLanguageShortCode(language) {
        let shortCode = "en";
        const languageObject = languagesAndShortCode.find(({ source }) => source === language);
        if (languageObject) {
            shortCode = languageObject.code
        }
        return shortCode;
    }

    /**
     * @description Replaces special XML like character with sentence object values.
     * @param {string} msg - Message text containing special XML like character 
     * @param {object} sentenceObj - Object containing key value pair, use to replace the special XML like character with correct value based on key
     * @returns {string} message text with replaced special XML like character 
     */
    replaceDetailsInMsg(msg, sentenceObj) {
        const regex = new RegExp(/\<\%(.*?)\>/, "ig")
        const result = msg.match(regex);
        if (result) {
            for (let i = 0; i < result.length; i++) {
                for (let key in sentenceObj) {
                    if (result[i].includes(key)) {
                        msg = msg.replace(result[i], sentenceObj[key])
                    }
                }
            }
        }
        return msg;
    }

    /**
     * @description Generate a email template and send email of list of service requests ticket id
     * @param {object} emailParams - Params required for sending email 
     * @param {string} emailParams.email - Email of the recipient
     * @param {string[]} emailParams.tickets - List of ticketId
     * @param {string} emailParams.subject - subject of the email
     */
    async sendServiceRequestsEmail({ email, tickets, subject }) {
        const { testCaseId } = this.config.getLPAapis();
        const { pageId } = this.config.getLPAapis().EmailToLM;
        const pageURL = `${this.webServerURL}?pageId=${pageId}&id=${testCaseId}`;

        const textFontSize = "font-size: 1.2rem;";
        const marginTop2Rem = "margin-top: 2rem;";
        const tableStyle =
            "font-family: Arial, Helvetica, sans-serif; border-collapse: collapse; width: 100%;";
        const thStyle =
            "border: 1px solid #ddd; padding: 8px;  padding-top: 12px; padding-bottom: 12px; text-align: left;background-color: #99cc00;color: white;";
        const tdStyle = "border: 1px solid #ddd; padding: 8px;";
        const aStyle = "color:  #99cc00;";

        const body = `
  <p style="${textFontSize}">Hi,</p>
  <p style="${textFontSize}${marginTop2Rem}">Greetings</p>
  <p  style="${textFontSize}">The following new tickets have been raised</p>
  <table style="${tableStyle}">
    <thead>
      <tr>
        <th style="${thStyle}width: 10%;">Sl No.</th>
        <th style="${thStyle}">Ticket Id</th>
      </tr>
    </thead>
    <tbody>
      ${tickets.map(
            (ticketId, i) => `
        <tr>
          <td  style="${tdStyle}">${i + 1}</td>
          <td  style="${tdStyle}">${ticketId}</td>
        </tr>
      `
        ).join('\n')}
    </tbody>
  </table>
  <p style="${textFontSize}">Please click on the below link to update the status of the tickets: <a href="${pageURL}" style="${aStyle}">Click Here</a></p>
  <p style="${textFontSize}">Regards,</p>
  <p style="${textFontSize}">NLPA Team.</p>
`;
        const emailResponse = await this.sendEmail(email, subject, body);
        return emailResponse;
    }

    /**
     * @description Send email
     * @param {string} email - Email of the recipient 
     * @param {string} subject - Subject of the email. 
     * @param {string} body - Main content of the email. 
     * @returns 
     */
    async sendEmail(email, subject, body) {
        return new Promise((resolve) => {
            this.mailer.send(email, subject, body, "", (response) => {
                resolve(response);
            });
        });
    }


    /**
     * @description Validate if the fields in data is valid or not
     * @param {object} data - customer object. 
     * @returns {boolean}
     */
    validateCustomerSFTPData(data) {
        if (!data['Unit #']) {
            //console.log("Unit #")
            return false;
        }
        if (!data['First Name']) {
            //console.log("First Name")
            return false;
        }
        if (!data['Last Name']) {
            //console.log("Last Name")
            return false;
        }
        if (!data['E-mail']) {
            //console.log("E-mail")
            return false;
        }
        if (!data['Cell Phone'] && !data['Home Phone']) {
            //console.log("Cell Phone")
            return false;
        }
        // if (!data['Home Phone']) {
        //     console.log("Home Phone")
        //     return false;
        // }
        if (!data['Lease End Date']) {
            //console.log("Lease End Date")
            return false;
        }
        // if (!data.AgencyName) {
        //     console.log("AgencyName")
        //     return false;
        // }
        // if (!data.apartmentOwnerNumber) {
        //     return false;
        // }
        // if (!data.apartmentOwnerEmail) {
        //     return false;
        // }
        // if (!data.managerNumber) {
        //     return false;
        // }
        // if (!data.managerEmail) {
        //     return false;
        // }
        // if (!data.supervisorNumber) {
        //     return false;
        // }
        // if (!data.supervisorEmail) {
        //     return false;
        // }
        return true;
    }
    validateResidenceSFTPData(data) {


        if (!data.AgencyName) {
            return false;
        }

        if (!data.apartmentOwnerEmail) {
            return false;
        }

        if (!data.managerEmail) {
            return false;
        }

        if (!data.supervisorEmail) {
            return false;
        }
        return true;
    }
    /**
     * @description Generate a customer object.
     * @param {object} data - customer object.
     * @returns 
     */
    generateNewCustomerStructure(data, residenceData) {
        const typeOfReviews = this.config.getLPAapis().CustomerReview.ReviewConfig;
        const typeOfGoogleReviews = this.config.getLPAapis().GoogleReview.ReviewConfig;
        const typeOfSnaglistReview = this.config.getLPAapis().SnaglistSMS.ReviewConfig;
        const today = formatNowDateTimeUTCUnit(this.unit);
        return {
            phoneNumber: data['Cell Phone'] || data['Home Phone'],
            contractEndDate: data['Lease End Date'],
            customerName: data['First Name'] + " " + data['Last Name'],
            customerEmail: data['E-mail'],
            apartmentInfo: {
                // apartmentNo: data.apartmentNo,
                // ownerNumber: data.apartmentOwnerNumber,
                apartmentName: residenceData.AgencyName,
                ownerEmail: residenceData.apartmentOwnerEmail
            },
            manager: {
                //Number: data.managerNumber,
                Email: residenceData.managerEmail
            },
            supervisor: {
                //Number: data.supervisorNumber,
                Email: residenceData.supervisorEmail
            },
            languageChoosen: "English",
            languageSMS: {
                isSMSSent: false,
                SMSSentDate: "",
                SMSRecivedDate: "",
                RecivedText: ""
            },
            youtubeSMS: {
                isSMSSent: false,
                SMSSentDate: ""
            },
            isCustomerReplayExpected: true,
            CustomerAddedDate: today,
            OnBoardSMSDate: "",
            reviews: typeOfReviews.reduce((acc, curr) => ({
                ...acc,
                [curr.reviewId]: {
                    isSMSSent: false,
                    SMSSentDate: "",
                    date: "",
                    comments: {}
                }
            }), {}),
            googleReview: {
                isDone: false,
                reviewReminders: typeOfGoogleReviews.reduce((acc, curr) => ({
                    ...acc,
                    [curr.reviewId]: {
                        isSMSSent: false,
                        SMSSentDate: ""
                    }
                }), {})
            },
            snagList: {
                isDone: false,
                data: {},
                reviewReminders: typeOfSnaglistReview.reduce((acc, curr) => ({
                    ...acc,
                    [curr.reviewId]: {
                        isSMSSent: false,
                        SMSSentDate: ""
                    }
                }), {})
            },
            serviceRequests: [],
            renewal: {
                isSMSSent: false,
                SMSSentDate: "",
                date: "",
                info: {}
            },
            statistics: {
                isyoutubeLinkClicked: false,
                isgooglereviewLinkClicked: false
            },
            rating: ""
        };
    }
}

module.exports = LeasingServicesBatchProcess;