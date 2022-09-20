const fs = require('fs');
const HandleDataPacket = require('../HandleDataPacket/HandleDataPacket');
class FaceBookChat {
    constructor() {
        this.handleDataPacket = new HandleDataPacket()
    }

    mainDataPacketHandler(dataString = []) {
        let mainString = "";
        for (let i = 0; i < dataString.length; i++) {
            mainString += this.handleMessageObject(dataString[i]);
        }
        return mainString;
    }

    handleMessageObject(messageObj) {
        let str = "";
        if (messageObj.from === "USER") {
            str += `\nUSER\n============`;
            str += this.handleUser(messageObj.data);
        } else if (messageObj.from === "BOT") {
            str += `\nBOT\n============`;
            str += this.handleBotMsg(messageObj.data);
        } else if (messageObj.from === "AGENT") {
            str += `\nAGENT(${messageObj.agentDetails.agentName})\n============`;
            str += this.handleAgent(messageObj.data);
        } else {
            throw new Error("Unhandled")
        }
        return str + '\n';
    }

    handleUser(userMsgObj) {
        return `\n${userMsgObj.text}\n`
    }

    handleAgent(agentMsgObj) {
        return `\n${agentMsgObj.text}\n`
    }

    handleBotMsg(botMsgObj) {
        let str = "";
        if (botMsgObj.attachment && botMsgObj.attachment.type && botMsgObj.dataPacket) {
            str += this.handleTypeAttachment(botMsgObj.attachment);
            str += this.handleDataPacket.handleBot(botMsgObj.dataPacket);
            return str;
        } else if (botMsgObj.attachment && botMsgObj.attachment.type && !botMsgObj.dataPacket) {
            str += this.handleTypeAttachment(botMsgObj.attachment);
        }
        else {
            str += `\n${botMsgObj.text}\n`
        }
        return str
    }

    handleTypeAttachment(attachmentData) {
        let handleTypeStr = ""
        switch (attachmentData.type) {
            case 'template':
                handleTypeStr += this.handleTemplete(attachmentData.payload);
                break;
            default:
                handleTypeStr += `Unhandled`;
                break;
        }
        return handleTypeStr;
    }

    handleTemplete(payloadData) {
        switch (payloadData.template_type) {
            case 'button':
                return this.buttonTemplete(payloadData);
            case 'generic':
                return this.genericTemplete(payloadData);
        }
    }

    buttonTemplete(buttonData) {
        let buttonTempleteStr = "";
        if (buttonData.title) {
            buttonTempleteStr += `${buttonData.title}\n`;
            buttonTempleteStr += `${this.buttonCreate(buttonData.buttons)}`
        } else if (buttonData.text) {
            buttonTempleteStr += `\n${buttonData.text}`;
            buttonTempleteStr += `${this.buttonCreate(buttonData.buttons)}`
        }
        return buttonTempleteStr;
    }

    buttonCreate(buttonData) {
        let buttonStr = "";
        buttonData.map(button => {
            if (button.title && button.url) {
                buttonStr += `\n[[${button.title}]]`;
                buttonStr += `\n${button.url}>>`
            } else if (button.text && button.url) {
                buttonStr += `\n[[${button.text}]]`;
                buttonStr += `\n${button.url}>>`
            } else {
                buttonStr += `\n[[${button.title}]]`;
            }
        })
        return buttonStr;
    }

    genericTemplete(genericPayload) {
        let genericStr = "";
        genericPayload.elements.map(element => {
            genericStr += `\n${element.title}`;
            if (element.subtitle) {
                genericStr += `\n${element.subtitle}`;
                genericStr += `\n${element.image_url}`
            } else if (element.image_url) {
                genericStr += `\n${element.image_url}`;
            }
            genericStr += `${this.buttonCreate(element.buttons)}\n`;
        });

        return `${genericStr}`;
    }

}

module.exports = FaceBookChat;