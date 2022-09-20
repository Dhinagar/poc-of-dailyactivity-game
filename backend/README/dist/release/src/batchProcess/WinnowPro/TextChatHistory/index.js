const WebChat = require('./WebChat/WebChat');
const FaceBookChat = require('./FaceBookChat/FaceBookChat');
const WhatsAppChat = require('./WhatsappChat/WhatsappChat');
const GoogleMessageChat = require('./GoogleMessagesChat/GoogleMessagesChat');


class WrapperChat {
    constructor() {
        this.webChathandler = new WebChat;
        this.faceChatHandler = new FaceBookChat;
        this.whatsappChatHandler = new WhatsAppChat;
        this.googleMessagesChatHandler = new GoogleMessageChat;
    }


    chatHistory(messageData = [], str = String) {
        if (str.toUpperCase() === "WEBCHAT") {
            return this.webChathandler.mainDataPacketHandler(messageData);
        }
        else if (str.toUpperCase() === "FACEBOOK") {
            return this.faceChatHandler.mainDataPacketHandler(messageData);
        }
        else if (str.toUpperCase() === "GOOGLE_MESSAGES") {
            return this.googleMessagesChatHandler.mainDataPacketHandler(messageData);
        }
        else if (str.toUpperCase() === "WHATSAPP") {
            return this.whatsappChatHandler.mainDataPacketHandler(messageData);
        }
        return "";
    }

}

module.exports = WrapperChat;