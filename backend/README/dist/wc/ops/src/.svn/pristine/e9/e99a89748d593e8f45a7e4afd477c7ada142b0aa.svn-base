const cron = require('node-cron');

const { formatDateTimeUTC } = require('../../dateTimeUtils');
const FormService = require('./formService');


/**
 * @classdesc A Leasing professional batch processes class
 */
class LeasingProfessionalBatchProcess {
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
        this.formService = new FormService(logger, config);
        /**
        * @private Please don't reference and assign any value to this property 
        */
        this._controlLPAFlow = true;
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
        this.app.get(
            "/ServiceManagement/LeasingProfessional/test",
            (req, res) => res.send("HELLO WORLD!!!")
        );

        /**
        * @api {get} /ServiceManagement/LeasingProfessional/getBatchProcessInfo Get all batch process info.
        * @apiName GetBatchProcessInfo
        * @apiGroup LeasingProfessional
        *
        * @apiSuccess {Boolean} status Status of the response.
        * @apiSuccess {Object[]} res List of batch process info.
        *
        *
        * @apiError (200) {Boolean} status Status of the response.
        * @apiError (200) {String} error Failure message.
        */
        this.app.get(
            "/ServiceManagement/LeasingProfessional/getBatchProcessInfo",
            this.getBatchProcessInfo.bind(this)
        );

        /**
         * @api {post} /ServiceManagement/LeasingProfessional/ControlLPAFlow Control LeasingProfessional Batch process.
         * @apiName ControlLPAFlow
         * @apiGroup LeasingProfessional
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
            "/ServiceManagement/LeasingProfessional/ControlLPAFlow",
            this.controlProcessFlow.bind(this)
        );
    }

    /**
    * @description Initializes all cron processes.
    */
    initCronJobs() {
        const { isBatchProcessRequired } = this.config.getLeasingApis();

        if (typeof isBatchProcessRequired === "boolean" && isBatchProcessRequired) {
            this.batchProcess();
        }
    }

    /**
  * @description Gets Info of batch processes from DB.
  * @param {object} req - A Express request object. 
  * @param {object} res - A Express response object.
  */
    async getBatchProcessInfo(req, res) {
        try {
            const leasingProfessionalBatchProcessInfoCollectionName = "LeasingProfessionalBatchProcessInFo";
            const leasingProfessionalBatchProcessInfoCollection = this.connection.db.collection(leasingProfessionalBatchProcessInfoCollectionName);

            const leasingProfessionalBatchProcessInfos = await leasingProfessionalBatchProcessInfoCollection.find({}).toArray();

            res.send({
                status: true,
                res: leasingProfessionalBatchProcessInfos
            });
        } catch (error) {
            this.logger.error(`Failed getting batch process info...${error}`);
            res.send({
                status: false,
                error: "Something went wrong in the server."
            });
        }
    }

    /**
   * @description Control LeasingProfessional  Flow
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
                res.send({ status: true, message: "Batch process of Leasing Professional enables." });
            } else {
                this.controlLPAFlow = false;
                res.send({ status: true, message: "Batch process of Leasing Professional disabled." });
            }

        } catch (error) {
            this.logger.error(`Failed control Leasing Professional process flow ...${error}`);
            res.send({ status: false, message: "Something went wrong in the server" });
        }
    }

    /**
    * @description Batch process relating to Leasing Batch Process Info and Leasing Professional Analytics
    */
    batchProcess() {
        const { RunTime: scheduleTime } = this.config.getLeasingApis();
        let isProcessing = false;
        cron.schedule(scheduleTime, async () => {
            if (this.controlLPAFlow) {
                try {
                    if (!isProcessing) {
                        isProcessing = true;
                        this.logger.info("Started batch process relating to Leasing Batch Process Info and Leasing Professional Analytics");
                        let startDate = "2019/09/25 00:00:00"; // since at start we have to submit all records to starhub we choose this date
                        const yesterday = formatDateTimeUTC(new Date(new Date().getTime() - 24 * 60 * 60 * 1000));
                        const leasingProfessionalBatchProcessInfoCollection = this.connection.db.collection("LeasingProfessionalBatchProcessInFo");
                        const leasingProfessionalAnalyticsCollection = this.connection.db.collection("LeasingProfessionalAnalytics");
                        const analyticsQuery = {
                            createdOn: {
                                $gte: startDate,
                                $lte: yesterday
                            },
                            completeConversation: false
                        };
                        const [batchProcessInfo] = await leasingProfessionalBatchProcessInfoCollection
                            .find({})
                            .limit(1)
                            .sort({ endDate: -1 })
                            .toArray();

                        if (batchProcessInfo) {
                            startDate = batchProcessInfo.endDate;
                        }

                        const leasingProfessionalAnalytics = await leasingProfessionalAnalyticsCollection.find(analyticsQuery).toArray();

                        if (leasingProfessionalAnalytics.length > 0) {
                            const formStatusResponse = await this.formService.getFormStatus();
                            if (formStatusResponse.status) {
                                const { formDetails } = formStatusResponse;
                                for (const ticket of leasingProfessionalAnalytics) {
                                    const formData = this.formService.generateFormData(
                                        ticket.ticketID,
                                        ticket.createdOn,
                                        ticket.CapturedMobileNo,
                                        ticket.completeConversation,
                                        ticket.QuestionAndAnswers
                                    );
                                    const submitFormResponse = await this.formService.submitForm(
                                        formDetails.portalId,
                                        formDetails.formId,
                                        formData
                                    );
                                    if (submitFormResponse.status) {
                                        this.logger.debug("Leasing Professionals With TicketID " + JSON.stringify(ticket.ticketID) + "Is Added to HubSpot...")
                                        await leasingProfessionalBatchProcessInfoCollection.insertOne({
                                            Corporate: "ALL",
                                            startDate: startDate,
                                            endDate: yesterday
                                        });
                                        this.logger.info(`BatchProcessed Info For start date ${startDate} and end date ${yesterday} add to DB`);
                                    }
                                }
                            }
                        }
                        isProcessing = false;
                        this.logger.info("Finished batch process relating to Leasing Batch Process Info and Leasing Professional Analytics");
                    }
                } catch (error) {
                    this.logger.error(`Failed cron job for batch process...${error}`);
                }
            }
        });
    }
}

module.exports = LeasingProfessionalBatchProcess;