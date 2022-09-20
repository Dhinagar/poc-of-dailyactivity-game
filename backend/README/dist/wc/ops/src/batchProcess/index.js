const LeasingServiceBatchProcess = require('./LeasingServices');
const LeasingProfessionalBatchProcess = require('./LeasingProfessional');
const WinnowProBatchProcess = require('./WinnowPro');
const {
    buildCheckFunction,
    validationResult
} = require('express-validator');
const checkQuery = buildCheckFunction(['query', 'body', 'param']);
const _lodash = require('lodash');

class BatchProcess {
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
        this.batchProcessInstances = [
            new LeasingServiceBatchProcess(logger, config, connection, app),
            new LeasingProfessionalBatchProcess(logger, config, connection, app),
            new WinnowProBatchProcess(logger, config, connection, app)
        ];
        const {
            CorporateBatchConfigCollection
        } = config.collectionNames();
        this.CorporateBatchConfigCollectionName = CorporateBatchConfigCollection;
        this.flags = config.getFlags();

    }

    /**
     * @description It Initializes DB, APIs and cron jobs
     * @param {Function} cb - A callback function. 
     */
    init(cb) {
        Promise.all(this.batchProcessInstances.map(instance => instance.init())).then(cb);
        this.initAPIs();
    }

    initAPIs() {
        this.app.get("/allBatchFlags", this.getAllFlags.bind(this));

        this.app.get("/batchFlagsForCorporate", this.corporateFlags.bind(this));

        this.app.post("/addBatchFlagForCorporate", this.addBatchFlagForCorporate.bind(this));

        this.app.post("/deleteBatchFlagForCorporate", this.deleteBatchFlagForCorporate.bind(this));

        this.app.post("/editFlagConfig", this.editFlagConfig.bind(this));
    }


    async getAllFlags(req, res) {
        try {
            res.send({
                success: true,
                Flags: this.flags
            });

        } catch (error) {
            this.logger.error(`Flags loading Failed ${error}`);
            res.send({
                status: false,
                message: "Unable to load all flags."
            })
        }
    }

    async corporateFlags(req, res) {
        try {
            await checkQuery("corporate", "Please provide a valid corporate").notEmpty().run(req);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const [error] = errors.array();
                return res.send({
                    status: false,
                    error: error.msg
                });
            }
            const flagsCollection = this.connection.db.collection(this.CorporateBatchConfigCollectionName);
            let flagsForCorporate = await flagsCollection.findOne({
                corporate: req.query.corporate
            });
            if (_lodash.isEmpty(flagsForCorporate)) {
                return res.send({
                    status: false,
                    error: `No Flags found for corporate ${req.query.corporate}`
                });
            }
            const corporateFlagList = {
                corporate: req.query.corporate,
                flags: flagsForCorporate.flags,
                config: flagsForCorporate.config,
            }
            res.send({
                success: true,
                Flags: corporateFlagList
            })
           this.logger.info(`Corporate : ${req.query.corporate} : requested for Flags`)
        } catch (error) {
            this.logger.error(`Failed to corporate Flags : ${error}`);
            res.send({
                success: false,
                message: "Unable to get Flags for the Corporate."
            });
        }
    }

    async addBatchFlagForCorporate(req, res) {
        try {
            await checkQuery("corporate", "Please provide a valid corporate.").notEmpty().isString().run(req);
            await checkQuery("flag", "Please provide a valid flag").notEmpty().isString().run(req);
            await checkQuery("config", "Please provide a valid config.").notEmpty().isObject().run(req);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const [error] = errors.array();
                return res.send({
                    success: false,
                    message: error.msg
                });
            }

            if (!(_lodash.includes(this.flags, req.body["flag"]))) {
                return res.send({
                    success: false,
                    message: "Please provide a valid flag."
                });
            }

            const flagsCollection = this.connection.db.collection(this.CorporateBatchConfigCollectionName);
            const isCorporateExist = await flagsCollection.findOne({
                corporate: req.body["corporate"]
            });
            if (!isCorporateExist) {
                await flagsCollection.insertOne({
                    corporate: req.body["corporate"],
                    flags: [{ flag: req.body["flag"], config: req.body["config"] }]
                });

            } else {
                const flagsArrayForCorporate = isCorporateExist.flags.map(item => {
                    return item.flag;
                })
                if (_lodash.includes(flagsArrayForCorporate, req.body["flag"])) {
                    return res.send({
                        success: false,
                        message: `Corporate : ${req.body["flag"]} : Flag ${req.body["flag"]} already enabled.`
                    });
                }
                await flagsCollection.updateOne({
                    corporate: req.body["corporate"],
                }, {
                    $push: {
                        "flags": { flag: req.body["flag"], config: req.body["config"] }
                    }
                })
            }
            res.send({
                success: true,
                message: `Flag ${req.body["flag"]} is added to the Corporate`
            });
        } catch (error) {
            this.logger.error(`Failed to add Flags : ${error}`);
            res.send({
                success: false,
                message: "Unable to add flags for the corporate."
            });
        }
    }

    async deleteBatchFlagForCorporate(req, res) {
        try {
            await checkQuery("corporate", "Please provide a valid corporate.").notEmpty().isString().run(req);
            await checkQuery("flag", "Please provide a valid flag").notEmpty().isString().run(req);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const [error] = errors.array();
                return res.send({
                    success: false,
                    message: error.msg
                });
            }

            if (!(_lodash.includes(this.flags, req.body["flag"]))) {
                return res.send({
                    success: false,
                    message: "Please provide a valid flag."
                });
            }
            const flagsCollection = this.connection.db.collection(this.CorporateBatchConfigCollectionName);
            let isCorporateExist = await flagsCollection.findOne({
                corporate: req.body["corporate"],
            });
            if (!isCorporateExist) {
                return res.send({ success: false, message: "Corporate is not exists." });
            } else {
                const flagsArrayForCorporate = isCorporateExist.flags.map(item => {
                    return item.flag;
                });
                if ((_lodash.includes(flagsArrayForCorporate, req.body["flag"]))) {
                    await flagsCollection.deleteOne({ corporate: req.body["corporate"]});
                    const flags = isCorporateExist.flags.filter(item => {
                        if (item.flag !== req.body["flag"]) {
                            return item;
                        }
                    })
                    isCorporateExist.flags = flags;
                    await flagsCollection.insertOne(isCorporateExist);
                } else {
                    return res.send({ success: false, message: "Please provide a valid flag." })
                }
            }
            res.send({ success: true, message: `Flag ${req.body["flag"]} has deleted from the Corporate ${req.body["corporate"]}` });
        } catch (error) {
            thislogger.error(`Failed to delete flags : ${error}`);
            res.send({ success: false, message: `Unable to delete flags for the Corporate.` })
        }
    }

    async editFlagConfig(req, res) {
        try {
            await checkQuery("corporate", "Please provide a valid corporate.").notEmpty().isString().run(req);
            await checkQuery("flag", "Please provide a valid flag").notEmpty().isString().run(req);
            await checkQuery("config", "Please provide a valid config.").notEmpty().isObject().run(req);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const [error] = errors.array();
                return res.send({
                    success: false,
                    message: error.msg
                });
            }

            if (!(_lodash.includes(this.flags, req.body["flag"]))) {
                return res.send({
                    success: false,
                    message: "Please provide a valid flag."
                });
            }
            const flagsCollection = this.connection.db.collection(this.CorporateBatchConfigCollectionName);
            const isCorporateExist = await flagsCollection.findOne({
                corporate: req.body["corporate"],
            });
            if (!isCorporateExist) {
                return res.send({ status: false, error: `Corporate not found.` })
            }

            const corporateFlagsArray = isCorporateExist.flags.map(item => {
                return item.flag
            });
            if (_lodash.includes(corporateFlagsArray, req.body["flag"])) {
                await flagsCollection.deleteOne({ corporate: req.body["corporate"] });
                isCorporateExist.flags.map(item => {
                    if (item.flag === req.body["flag"]) {
                        item.config = req.body["config"]
                    }
                });
                await flagsCollection.insertOne(isCorporateExist)
            } else {
                return res.send({ status: false, message: "Please provide a valid flag" });
            }

            res.send({ success: true, message: `${req.body["flag"]} has updated config.` })
        } catch (error) {
           
            this.logger.error(`Unable to edit flag config : ${error}`)
        }
    }



}

module.exports = BatchProcess;