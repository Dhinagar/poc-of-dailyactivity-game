const fs = require('fs');
const HandleDataPacket = require('../HandleDataPacket/HandleDataPacket');
class GoogleMessageChat {
    constructor() {
        this.handleDataPacket = new HandleDataPacket()
    }

    mainDataPacketHandler(dataString) {
        let mainString = "";
        for (let item in dataString) {
            mainString += this.handleMessageObject(dataString[item]);
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
        if (botMsgObj.dataPacket) {
            str += this.handleGoogleMessage(botMsgObj);
            str += this.handleDataPacket.handleBot(botMsgObj.dataPacket);
            return str;
        } else if (botMsgObj.richCard || (botMsgObj.suggestions && botMsgObj.suggestions.length > 0)) {
            str += this.handleGoogleMessage(botMsgObj);
        }
        else {
            str += `\n${botMsgObj.text}\n`
        }
        return str
    }

    handleGoogleMessage(data) {
        let handleTypeStr = ""
        if (data.hasOwnProperty("richCard")) {
            if (data.richCard.hasOwnProperty("standaloneCard")) {
                let card = data.richCard.standaloneCard.cardContent;
                if (card.media) {
                    handleTypeStr += `\n${card.media.contentInfo.fileUrl}`;
                }
                if (card.title) {
                    handleTypeStr += `\n${card.title}`;
                }
                if (card.description) {
                    handleTypeStr += `\n${card.description}`;
                }
                if (card.suggestions) {
                    for (var i = 0; i < card.suggestions.length; i++) {
                        let element = card.suggestions[i];
                        handleTypeStr += `\n[[${element.reply ? element.reply.text : element.action ? element.action.text : ""}]]`;
                    }
                }
            }
            else if (data.richCard.hasOwnProperty("carouselCard")) {
                for (var i = 0; i < data.richCard.carouselCard.cardContents.length; i++) {
                    let card = data.richCard.carouselCard.cardContents[i];
                    if (card.media) {
                        handleTypeStr += `\n${card.media.contentInfo.fileUrl}`;
                    }
                    if (card.title) {
                        handleTypeStr += `\n${card.title}`;
                    }
                    if (card.description) {
                        handleTypeStr += `\n${card.description}`;
                    }
                    if (card.suggestions) {
                        for (var j = 0; j < card.suggestions.length; j++) {
                            let element = card.suggestions[j];
                            handleTypeStr += `\n[[${element.reply ? element.reply.text : element.action ? element.action.text : ""}]]`;
                        }
                    }
                }

            }
            handleTypeStr += `Unhandled`;
        }
        else {
            handleTypeStr += `${data.text}`;
            if (data.suggestions) {
                for (var i = 0; i < data.suggestions.length; i++) {
                    let element = data.suggestions[i];
                    handleTypeStr += `\n[[${element.reply ? element.reply.text : element.action ? element.action.text : ""}]]`;
                }
            }
        }
        return handleTypeStr;
    }
}

module.exports = GoogleMessageChat;