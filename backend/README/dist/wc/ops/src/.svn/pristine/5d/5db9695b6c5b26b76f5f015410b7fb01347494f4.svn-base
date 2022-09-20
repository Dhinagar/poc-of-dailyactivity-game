const fetch = require('node-fetch');

const getFormFields = require('./formFields');

const contactProperties = [
    {
        "name": "createdon",
        "label": "Created On",
    },
    {
        "name": "q1",
        "label": "Before we get you registered, can you answer 3 quick questions?(Q1)",
    },
    {
        "name": "q2",
        "label": "Are you currently(Q2)",
    },
    {
        "name": "q3",
        "label": "How many years have you been a Leasing Professional?(Q3)",
    },
    {
        "name": "q4",
        "label": "What do you do in the industry?(Q4)",
    },
    {
        "name": "q5",
        "label": "Did you start as a Leasing Professional?(Q5)",
    },
    {
        "name": "q6",
        "label": "How many years did you stay in the role of Leasing Professional?(Q6)",
    },
    {
        "name": "q7",
        "label": "What attracts you to this industry?(Q7)",
    },
    {
        "name": "q8",
        "label": "Are you ready to grow your career and make more money?(Q8)",
    }
];

const questionHaspMap = {
    "Before we get you registered, can you answer 3 quick questions?": "q1",
    "Are you currently": "q2",
    "How many years have you been a Leasing Professional?": "q3",
    "What do you do in the industry?": "q4",
    "Did you start as a Leasing Professional?": "q5",
    "How many years did you stay in the role of Leasing Professional?": "q6",
    "What attracts you to this industry?": "q7",
    "Are you ready to grow your career and make more money?": "q8",
};


/**
 * @classdesc A FormService class using Hubspot Form APIs
 */
class FormService {
    /**
    * @param {object} logger - A logger object
    * @param {object} config - System config object
    */
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
    }

    /**
     * @property
     * @description returns base URL for Hubspot api
     */
    get baseURL() {
        return "https://api.hubapi.com";
    }

    /**
     * @property
     * @description returns a base URL for Hubspot api for public form submission
     */
    get publicBaseURL() {
        return "https://api.hsforms.com";
    }


    /**
     * @description Gets all forms from Hubspot forms
     */
    async getAllForms() {
        const { api_key: apiKey } = this.config.getLeasingApis();
        const url = `${this.baseURL}/forms/v2/forms?hapikey=${apiKey}`;
        try {
            const response = await fetch(url);
            if (response.status >= 400) {
                this.logger.error(`Failed to fetch all forms data from Hubspot...${JSON.stringify(response)}`);
                return { status: false, message: 'Failed to get all forms data.' };
            }
            const data = await response.json();
            return {
                status: true,
                forms: data
            }
        } catch (error) {
            this.logger.error(`Failed to fetch all forms data from Hubspot...${JSON.stringify(error)}`);
            return { status: false, message: 'Failed to get all forms data.' };
        }
    }


    /**
     *@description Create a form in Hubspot form 
     */
    async createForm() {
        const { api_key: apiKey, formName, followUpId = "" } = this.config.getLeasingApis();
        const url = `${this.baseURL}/forms/v2/forms?hapikey=${apiKey}`;
        try {
            const response = await fetch(
                url,
                {
                    method: "POST",
                    body: JSON.stringify(getFormFields(formName, followUpId)),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );


            if (response.status >= 400) {
                this.logger.error(`Failed to create form in Hubspot...${JSON.stringify(response)}`);
                return { status: false, message: 'Failed to create form.' };
            }
            const data = await response.json();
            return {
                status: true,
                formDetails: {
                    portalId: data.portalId,
                    formId: data.guid
                }
            }
        } catch (error) {
            this.logger.error(`Failed to create form in Hubspot...${JSON.stringify(error)}`);
            return { status: false, message: 'Failed to create form.' };
        }
    }

    /**
     * @description Check if a form is in Hubspot form. If not it will create a new form with new contact properties.
     */
    async getFormStatus() {
        const { formName } = this.config.getLeasingApis();
        const allFormsResponse = await this.getAllForms();
        if (!allFormsResponse.status) {
            return allFormsResponse
        }
        const allForms = allFormsResponse.forms;
        if (
            allForms.length > 0
        ) {
            const form = allForms.find(form => form.name === formName);
            if (!form) {
                const createFormResponse = await this.createForm();
                if (!createFormResponse.status) {
                    return createFormResponse;
                }
                await this.createContactProperties(contactProperties);
                return {
                    status: true,
                    formDetails: {
                        portalId: createFormResponse.formDetails.portalId,
                        formId: createFormResponse.formDetails.formId
                    }
                };
            }
            return {
                status: true,
                formDetails: {
                    portalId: form.portalId,
                    formId: form.guid
                }
            };
        } else {
            const createFormResponse = await this.createForm();
            if (!createFormResponse.status) {
                return createFormResponse;
            }
            await this.createContactProperties(contactProperties);
            return {
                status: true,
                formDetails: {
                    portalId: createFormResponse.formDetails.portalId,
                    formId: createFormResponse.formDetails.formId
                }
            };
        }
    }

    /**
     * @description Submits a form
     * @param {string} portalId - Portal Id of the form in Hubspot 
     * @param {string} formId - Form Id of the form in Hubspot
     * @param {object} formData - form data to be submitted 
     * @returns 
     */
    async submitForm(portalId, formId, formData) {
        const url = `${this.publicBaseURL}/submissions/v3/integration/submit/${portalId}/${formId}`;
        try {
            const response = await fetch(
                url,
                {
                    method: "POST",
                    body: JSON.stringify(formData),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );


            if (response.status >= 400) {
                this.logger.error(`Failed to submit form for portalId = ${portalId} and formId = ${formId}...${JSON.stringify(response)}`);
                return { status: false, message: 'Failed to submit form.' };
            }
            return {
                status: true,
                message: "Successfully submitted form"
            };
        } catch (error) {
            this.logger.error(`Failed to submit form...${JSON.stringify(error)}`);
            return { status: false, message: 'Failed to submit form.' };
        }
    }

    /**
     * @description Create a list of contact property in Hubspot.`
     * @param {object[]} contactProperties - List of contact properties. Containing name and label field.
     */
    async createContactProperties(contactProperties) {
        const { api_key: apiKey } = this.config.getLeasingApis();
        const url = `${this.baseURL}/properties/v1/contacts/properties?hapikey=${apiKey}`;
        for (const property of contactProperties) {
            try {
                const response = await fetch(
                    url,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            name: property.name,
                            label: property.label,
                            description: "A new property for you",
                            groupName: "contactinformation",
                            type: "string",
                            fieldType: "text",
                            formField: true,
                            displayOrder: 6,
                            options: []
                        }),
                    }
                );

                if (response.status >= 400) {
                    this.logger.error(`Failed to add property to contact in Hubspot...${JSON.stringify(response)}`);
                    return { status: false, message: 'Failed to add property to contact.' };
                }
            } catch (error) {
                this.logger.error(`Failed to add property to contact in Hubspot...${JSON.stringify(error)}`);
                return { status: false, message: 'Failed to add property to contact.' };
            }
        }
        return { status: true, message: 'Successfully added properties to contact.' };
    }

    /**
     * @description Generate a form data
     * @param {string} ticketId - Id of the ticket 
     * @param {string} createdOn - Created date of the ticket 
     * @param {string} phoneNumber - Phone number of the customer 
     * @param {any} completeConversation - complete conversation 
     * @param {object[]} questionAndAnswers - List containing question and answers 
     * @returns 
     */
    generateFormData(ticketId, createdOn, phoneNumber, completeConversation, questionAndAnswers) {
        const timeNow = new Date().getTime();

        const fields = [
            {
                "name": "address",
                "value": ticketId
            },
            {
                "name": "createdon",
                "value": createdOn
            },
            {
                "name": "phone",
                "value": phoneNumber
            },
            {
                "name": "company",
                "value": completeConversation
            }
        ];

        for (const questionAndAnswer of questionAndAnswers) {
            if ("Question Id" in questionAndAnswer) {
                if (
                    questionAndAnswer["Question Id"] !== "q9" &&
                    questionAndAnswer["Question Id"] !== "q10"
                ) {
                    const questionId = questionHaspMap[questionAndAnswer["Question"]];
                    if (questionId) {
                        fields.push({
                            name: questionId,
                            value: questionAndAnswer.correctAnswer
                        });
                    }
                }
            } else {
                if (
                    !questionAndAnswer["Question"].includes("email") &&
                    !questionAndAnswer["Question"].includes("mobile number")
                ) {
                    const questionId = questionHaspMap[questionAndAnswer["Question"]];
                    if (questionId) {
                        fields.push({
                            name: questionId,
                            value: questionAndAnswer.correctAnswer
                        });
                    }
                }
            }
        }

        return {
            submittedAt: timeNow,
            fields
        };
    }
}


module.exports = FormService;