const getFormFields = (formName, followUpId = "") => {
    const dateNow = new Date();
    const timeNow = dateNow.getTime();
    return {
        "name": formName,
        "action": "",
        "method": "",
        "cssClass": "",
        "redirect": "",
        "submitText": "Submit",
        "followUpId": followUpId,
        "notifyRecipients": "",
        "leadNurturingCampaignId": "",
        "formFieldGroups": [
            {
                "fields": [
                    {
                        "name": "address",
                        "label": "Ticket Id",
                        "type": "string",
                        "fieldType": "text",
                        "description": "",
                        "groupName": "",
                        "displayOrder": 0,
                        "required": false,
                        "selectedOptions": [],
                        "options": [],
                        "validation": {
                            "name": "",
                            "message": "",
                            "data": "",
                            "useDefaultBlockList": false
                        },
                        "enabled": true,
                        "hidden": false,
                        "defaultValue": "",
                        "isSmartField": false,
                        "unselectedLabel": "",
                        "placeholder": ""
                    }
                ],
                "default": true,
                "isSmartGroup": false
            },
            {
                "fields": [
                    {
                        "name": "createdon",
                        "label": "Created On",
                        "type": "string",
                        "fieldType": "text",
                        "description": "",
                        "groupName": "",
                        "displayOrder": 1,
                        "required": false,
                        "selectedOptions": [],
                        "options": [],
                        "validation": {
                            "name": "",
                            "message": "",
                            "data": "",
                            "useDefaultBlockList": false
                        },
                        "enabled": true,
                        "hidden": false,
                        "defaultValue": "",
                        "isSmartField": false,
                        "unselectedLabel": "",
                        "placeholder": ""
                    }
                ],
                "default": true,
                "isSmartGroup": false
            },
            {
                "fields": [
                    {
                        "name": "phone",
                        "label": "Phone Number",
                        "type": "string",
                        "fieldType": "text",
                        "description": "",
                        "groupName": "",
                        "displayOrder": 2,
                        "required": false,
                        "selectedOptions": [],
                        "options": [],
                        "validation": {
                            "name": "",
                            "message": "",
                            "data": "",
                            "useDefaultBlockList": false
                        },
                        "enabled": true,
                        "hidden": false,
                        "defaultValue": "",
                        "isSmartField": false,
                        "unselectedLabel": "",
                        "placeholder": ""
                    }
                ],
                "default": true,
                "isSmartGroup": false
            },
            {
                "fields": [
                    {
                        "name": "q1",
                        "label": "Before we get you registered, can you answer 3 quick questions?(Q1)",
                        "type": "string",
                        "fieldType": "text",
                        "description": "",
                        "groupName": "",
                        "displayOrder": 2,
                        "required": false,
                        "selectedOptions": [],
                        "options": [],
                        "validation": {
                            "name": "",
                            "message": "",
                            "data": "",
                            "useDefaultBlockList": false
                        },
                        "enabled": true,
                        "hidden": false,
                        "defaultValue": "",
                        "isSmartField": false,
                        "unselectedLabel": "",
                        "placeholder": ""
                    }
                ],
                "default": true,
                "isSmartGroup": false
            },
            {
                "fields": [
                    {
                        "name": "q2",
                        "label": "Are you currently(Q2)",
                        "type": "string",
                        "fieldType": "text",
                        "description": "",
                        "groupName": "",
                        "displayOrder": 2,
                        "required": false,
                        "selectedOptions": [],
                        "options": [],
                        "validation": {
                            "name": "",
                            "message": "",
                            "data": "",
                            "useDefaultBlockList": false
                        },
                        "enabled": true,
                        "hidden": false,
                        "defaultValue": "",
                        "isSmartField": false,
                        "unselectedLabel": "",
                        "placeholder": ""
                    }
                ],
                "default": true,
                "isSmartGroup": false
            },
            {
                "fields": [
                    {
                        "name": "q3",
                        "label": "How many years have you been a Leasing Professional?(Q3)",
                        "type": "string",
                        "fieldType": "text",
                        "description": "",
                        "groupName": "",
                        "displayOrder": 2,
                        "required": false,
                        "selectedOptions": [],
                        "options": [],
                        "validation": {
                            "name": "",
                            "message": "",
                            "data": "",
                            "useDefaultBlockList": false
                        },
                        "enabled": true,
                        "hidden": false,
                        "defaultValue": "",
                        "isSmartField": false,
                        "unselectedLabel": "",
                        "placeholder": ""
                    }
                ],
                "default": true,
                "isSmartGroup": false
            },
            {
                "fields": [
                    {
                        "name": "q4",
                        "label": "What do you do in the industry?(Q4)",
                        "type": "string",
                        "fieldType": "text",
                        "description": "",
                        "groupName": "",
                        "displayOrder": 2,
                        "required": false,
                        "selectedOptions": [],
                        "options": [],
                        "validation": {
                            "name": "",
                            "message": "",
                            "data": "",
                            "useDefaultBlockList": false
                        },
                        "enabled": true,
                        "hidden": false,
                        "defaultValue": "",
                        "isSmartField": false,
                        "unselectedLabel": "",
                        "placeholder": ""
                    }
                ],
                "default": true,
                "isSmartGroup": false
            },
            {
                "fields": [
                    {
                        "name": "q5",
                        "label": "Did you start as a Leasing Professional?(Q5)",
                        "type": "string",
                        "fieldType": "text",
                        "description": "",
                        "groupName": "",
                        "displayOrder": 2,
                        "required": false,
                        "selectedOptions": [],
                        "options": [],
                        "validation": {
                            "name": "",
                            "message": "",
                            "data": "",
                            "useDefaultBlockList": false
                        },
                        "enabled": true,
                        "hidden": false,
                        "defaultValue": "",
                        "isSmartField": false,
                        "unselectedLabel": "",
                        "placeholder": ""
                    }
                ],
                "default": true,
                "isSmartGroup": false
            },
            {
                "fields": [
                    {
                        "name": "q6",
                        "label": "How many years did you stay in the role of Leasing Professional?(Q6)",
                        "type": "string",
                        "fieldType": "text",
                        "description": "",
                        "groupName": "",
                        "displayOrder": 2,
                        "required": false,
                        "selectedOptions": [],
                        "options": [],
                        "validation": {
                            "name": "",
                            "message": "",
                            "data": "",
                            "useDefaultBlockList": false
                        },
                        "enabled": true,
                        "hidden": false,
                        "defaultValue": "",
                        "isSmartField": false,
                        "unselectedLabel": "",
                        "placeholder": ""
                    }
                ],
                "default": true,
                "isSmartGroup": false
            },
            {
                "fields": [
                    {
                        "name": "q7",
                        "label": "What attracts you to this industry?(Q7)",
                        "type": "string",
                        "fieldType": "text",
                        "description": "",
                        "groupName": "",
                        "displayOrder": 2,
                        "required": false,
                        "selectedOptions": [],
                        "options": [],
                        "validation": {
                            "name": "",
                            "message": "",
                            "data": "",
                            "useDefaultBlockList": false
                        },
                        "enabled": true,
                        "hidden": false,
                        "defaultValue": "",
                        "isSmartField": false,
                        "unselectedLabel": "",
                        "placeholder": ""
                    }
                ],
                "default": true,
                "isSmartGroup": false
            },
            {
                "fields": [
                    {
                        "name": "q8",
                        "label": "Are you ready to grow your career and make more money?(Q8)",
                        "type": "string",
                        "fieldType": "text",
                        "description": "",
                        "groupName": "",
                        "displayOrder": 2,
                        "required": false,
                        "selectedOptions": [],
                        "options": [],
                        "validation": {
                            "name": "",
                            "message": "",
                            "data": "",
                            "useDefaultBlockList": false
                        },
                        "enabled": true,
                        "hidden": false,
                        "defaultValue": "",
                        "isSmartField": false,
                        "unselectedLabel": "",
                        "placeholder": ""
                    }
                ],
                "default": true,
                "isSmartGroup": false
            },
            {
                "fields": [
                    {
                        "name": "company",
                        "label": "Complete Conversation",
                        "type": "string",
                        "fieldType": "text",
                        "description": "",
                        "groupName": "",
                        "displayOrder": 2,
                        "required": false,
                        "selectedOptions": [],
                        "options": [],
                        "validation": {
                            "name": "",
                            "message": "",
                            "data": "",
                            "useDefaultBlockList": false
                        },
                        "enabled": true,
                        "hidden": false,
                        "defaultValue": "",
                        "isSmartField": false,
                        "unselectedLabel": "",
                        "placeholder": ""
                    }
                ],
                "default": true,
                "isSmartGroup": false
            }
        ],
        "createdAt": timeNow,
        "updatedAt": timeNow,
        "performableHtml": "",
        "migratedFrom": "ld",
        "ignoreCurrentValues": false,
        "metaData": [],
        "deletable": true
    }
};

module.exports = getFormFields;