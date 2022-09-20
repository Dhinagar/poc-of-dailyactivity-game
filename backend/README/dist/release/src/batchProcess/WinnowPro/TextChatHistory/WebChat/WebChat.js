const fs = require('fs');
const HandleDataPacket = require('../HandleDataPacket/HandleDataPacket');
class WebChat {
    constructor() {
        this.fs = fs;
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

        } else if (messageObj.from === 'BOT') {
            str += `\nBOT\n============`;
            str += this.handleDataPacket.handleBot(messageObj.data);
        } else if (messageObj.from === "AGENT") {
            str += `\nAGENT (${messageObj.agentDetails.agentName})\n============`;
            str += this.handleAgent(messageObj.data);

        } else if (messageObj.from === null) {
            str += `\nBOT\n============`;
            str += this.handleMessageObj(messageObj);

        } else {
            throw new Error('from not defined');
        }
        return str + '\n';
    }

    handleMessageObj(messageObj) {
        return `\n${messageObj.data}\n`
    }

    handleUser(userMsgObj) {
        return `\n${userMsgObj.text}\n`
    }

    handleAgent(agentMsgObj) {
        return `\n${agentMsgObj.text}\n`;
    }

}

module.exports = WebChat;