
class HandleDataPacket {
    constructor() {
        this.primitiveTypes = ["TEXT", "HEADER1", "HEADER2", "HEADER3", "HEADER4", "HEADER5", "HEADER6", "PARA1", "PARA2", "PARA3", "PARA4", "PARA5", "PARA6", "FOOTER1", "FOOTER2", "FOOTER3", "HSEPERETOR", "VSEPERETOR", "CALL", "L1_AGENT", "IMAGE_TYPE1", "HORZ_IMAGES_TYPE1", "VERT_IMAGES_TYPE1", "POSTAL_ADDRESS", "ADDRESS", "TABLE", "HYPERLINK", "SENSE", "SENSE_SUGGESTION", "IMAGE_ARRAY", "VIDEO", "AUDIO", "PIE_CHART", "STACKED_BAR_CHART", "BAR_CHART", "LINE_CHART", "PHOTO", "SINGLE_OPTION", "VOICE"];
        this.nonPrimitiveTypes = ["CARD_TYPE1", "HORZ_CARDS_TYPE1", "VERT_CARDS_TYPE1", "OPTIONS", "FORM", "FILLED_FORM"];
    }

    handleBot(messageObj) {
        if (this.primitiveTypes.includes(messageObj.type)) {
            return this.handlePrimitiveType(messageObj);
        } else if (this.nonPrimitiveTypes.includes(messageObj.type)) {
            return this.handleNonPrimitiveType(messageObj);
        } else {
            return `\n${messageObj}`;
        }
    }

    handlePrimitiveType(messageData) {

        switch (messageData.type) {
            case "TEXT":
                return `${this.textType(messageData)}`;
            case 'HEADER1':
            case 'HEADER2':
            case 'HEADER3':
            case 'HEADER4':
            case 'HEADER5':
            case 'HEADER6':
                return `${this.header(messageData)}`;
            case 'IMAGE_TYPE1':
                return `${this.image_type(messageData)}`;
            case "HSEPARATOR":
                return `${this.vhseperator(messageData)}`;
            case "L1_AGENT":
                return `${this.l1AgentType(messageData)}`;
            case "PARA1":
            case "PARA2":
            case "PARA3":
            case "PARA4":
            case "PARA5":
            case "PARA6":
                return `${this.paraType(messageData)}`;
            case 'FOOTER1':
            case 'FOOTER2':
            case 'FOOTER3':
                return `${this.footerType(messageData)}`;
            case "VSEPERETOR":
                return `${this.vhseperator(messageData)}`;
            case "CALL":
                return `${this.callType(messageData)}`;
            case "HORZ_IMAGES_TYPE1":
                return `${this.horzVertzImageType(messageData)}`;
            case "VERT_IMAGES_TYPE1":
                return `${this.horzVertzImageType(messageData)}`;
            case "POSTAL_ADDRESS":
                return `${this.address(messageData)}`;
            case "ADDRESS":
                return `${this.address(messageData)}`;
            case "TABLE":
                return `${this.table(messageData)}`;
            case "HYPERLINK":
                return `${this.hyperLink(messageData)}`;
            case "SENSE":
                return `${this.senseType(messageData)}`;
            case "SENSE_SUGGESTION":
                return `${this.senseType(messageData)}`;
            case "IMAGE_ARRAY":
                return `${this.imageArrayType(messageData)}`;
            case "VIDEO":
                return `${this.audioVideoType(messageData)}`;
            case "AUDIO":
                return `${this.audioVideoType(messageData)}`;
            case "PIE_CHART":
                return `${this.chartType(messageData)}`;
            case "STACKED_BAR_CHART":
                return `${this.chartType(messageData)}`;
            case "BAR_CHART":
                return `${this.chartType(messageData)}`;
            case "LINE_CHART":
                return `${this.chartType(messageData)}`;
            case "PHOTO":
                return `${this.photo(messageData)}`;
            case "VOICE":
                return `${this.voice(messageData)}`;
            case "SINGLE_OPTION":
                return `${this.singleOption(messageData)}`;
            default:
                return "Unhandled FROM DATAPACKET";
        }
    }



    handleNonPrimitiveType(messageData) {

        switch (messageData.type) {
            case 'CARD_TYPE1':
                return `${this.cardType1(messageData.data)}`;
            case 'HORZ_CARDS_TYPE1':
            case 'VERT_CARDS_TYPE1':
                return `${this.horzCardsType1(messageData.data)}`;
            case "OPTIONS":
                return `${this.options(messageData.data)}`;
            case "FORM":
                return `${this.formType(messageData.data)}`;
            case "FILLED_FORM":
                return `${this.filledForm(messageData.data)}`;
            default:
                return "Unhandled non Datapacket";
        }

    }

    cardType1(messageData) {
        let cardStr = "";
        if (messageData.SECTIONS.length) {
            messageData.SECTIONS.map(section => {
                cardStr += this.handlePrimitiveType(section)
            })
        } else {
            cardStr += ""
        }
        if (messageData.BUTTONS.length) {
            messageData.BUTTONS.map(button => {
                cardStr += `\n[[${button.optionData.label}]]`
            })
        } else {
            cardStr += ""
        }
        return `${cardStr}`;
    }

    horzCardsType1(messageData) {

        let horzStr = "";
        horzStr += `\n${messageData.TITLE}`;
        horzStr += `\n${messageData.DESCRIPTION}`;
        messageData.CARDS.map(card => {
            horzStr += `\n${this.handleNonPrimitiveType(card)}`;
        })
        messageData.SECTIONS.map(section => {
            horzStr += `\n ${this.handlePrimitiveType(section)}`
        });
        messageData.BUTTONS.map(section => {
            horzStr += `\n[[${section.optionData.label}]]`
        });

        return horzStr;
    }

    options(optionsObj) {
        let optionStr = "";
        if (optionsObj.PACKET) {
            optionStr += `\n ${this.handlePrimitiveType(optionsObj.PACKET)}`
        }
        if (optionsObj.OPTIONS) {
            optionsObj.OPTIONS.map(button => {
                optionStr += `\n[[${button.optionData.label}]]`
            })
        }
        return optionStr;
    }

    filledForm(formData) {
        let formFilledStr = "";
        formData.FIELDS.map(field => {
            formFilledStr += `\n ${this.handlePrimitiveType(field)}`;
        })

        return formFilledStr;
    }



    textType(textObj) {

        return `\n${textObj.data}`
    }

    image_type(imgObj) {
        return `\n${imgObj.data.IMAGE}`
    }

    vhseperator(hsepObj) {

        return ``
    }

    header(headerObj) {

        return `\n${headerObj.data.TEXT}`;
    }

    l1AgentType(agentObj) {
        return `\n${agentObj.data.text}`;
    }

    paraType(paraObj) {

        return `\n${paraObj.data.TEXT}`;
    }

    footerType(footerObj) {

        return `\n${footerObj.data.TEXT}`;
    }

    table(tableObj) {

        let tableStr = "";
        tableObj.data.ROWS.map(row => {
            row.data.CELLS.map(cell => {
                tableStr += this.handlePrimitiveType(cell)
            })
        });
        return tableStr;
    }

    callType(callObj) {

        let callStr = `\n${callObj.data.TEXT}`;
        callStr += `Call Now`;
        return callStr;
    }

    horzVertzImageType(imgObj) {

        let horzVertzStr = "";
        imgObj.data.IMAGES.map((img, i) => {
            horzVertzStr += `\n ${img}`
        });
        return horzVertzStr;
    }

    formType(formObj) {

        let formStr = `\n ${formObj.data.TITLE}`;
        formStr += `\n Fill Form`;
        return formStr;
    }

    address(postalObj) {
        return `\n Door no ${postalObj.data.doorNo} \n Building ${postalObj.data.building} \n Locality ${postalObj.data.locality} \n City ${postalObj.data.city} \n State ${postalObj.data.state} \n Country ${postalObj.data.country}`
    }

    senseType(senseObj) {
        let senseStr = `\n ${senseObj.data.title}`;
        senseStr += `Views`;
        return senseStr;
    }

    chartType(chartObj) {
        let chartStr = `\n ${chartObj.data.TITLE}`;
        chartStr += `\n ${chartObj.data.DESCRIPTION}`;
        chartStr += `\n<[[Chart]]`;
        return chartStr;

    }

    hyperLink(hyperObj) {
        return `\n ${hyperObj.data.LABEL}`;
    }



    audioVideoType(audioObj) {
        let audioVideoStr = `\n${audioObj.data.title}`;
        audioVideoStr += `audio/video not supported`;
        audioVideoStr += `\n ${audioObj.data.description}`;
        return audioVideoStr;
    }

    imageArrayType(imgArr) {
        let imgArrStr = ""
        for (let key in imgArr) {
            imgArrStr += `\n ${imgArr[key].data.title}`
            imgArrStr += `\n ${imgArr[key].data.url}`;
            imgArrStr += `\n ${imgArr[key].data.description}`;
        }
        return imgArrStr;
    }

    photo(photoObj) {
        return `Photo Uploaded`
    }

    voice(voiceObj) {
        return `Voice Uploaded`;
    }

    singleOption(optionObj) {
        let optionStr = "";
        optionStr += `\n ${optionObj.LABEL}`;
        optionStr += `\n ${optionObj.VALUE}`;
        return optionStr;
    }

}


module.exports = HandleDataPacket;