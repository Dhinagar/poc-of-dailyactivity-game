const fs = require('fs');

class WhatsAppChat {
    constructor() {
        this.fs = fs;
    }

    mainDataPacketHandler(dataString = []) {
        let mainString = "";
        for(let i = 0; i < dataString.length; i++) {
            mainString += this.handleMessageObject(dataString[i]);
        }
        return mainString;
    }

    handleMessageObject(messageObj) {
        let str = "";
        if (messageObj.from === "USER") {
            str += `\nUSER\n============`;
            str += this.handleUser(messageObj.data);

        } else if (messageObj.from === 'BOT') {
            str += `\nBOT\n============`;
            str += this.handleBot(messageObj.data);
        } else if (messageObj.from === 'AGENT') {
            str += `\nAGENT(${messageObj.agentDetails.agentName})\n============`;
            str += this.handleAgent(messageObj.data);

        } else {
            throw new Error('from not defined');
        }
        return str + '\n';
    }

    handleUser(userMsgObj) {
        return `\n${userMsgObj.text}\n`
    }

    handleAgent(agentMsgObj) {
        return `\n${agentMsgObj.text}\n`
    }

    handleBot(botMsgObj) {
        return `\n${botMsgObj}\n`;
    }


}

module.exports = WhatsAppChat;