require("chai");
var assert = require("assert");
const auth = require("solid-auth-client");

const DataSync=require("../lib/datasync");

const Core = require("../lib/core");
const c = new Core(auth.fetch);

const MessageManager = require("../lib/messageManager");
const chat = new MessageManager(c);

describe("MessageManager Test", function () {

    it("getNewMessage", function() {
        var result=chat.getNewMessage("https://antoniete.solid.community/inbox/14532d20-594d-11e9-b3ac-bb6f656d2471.txt",  "/inbox/");
        assert(result, null);
  });
    

    it("storeMessage", function() {
        var result=chat.storeMessage("https://antoniete.solid.community/public/chat_Josejuanjo","Antoniete","holaa","https://josejuanjo.solid.community/inbox",new DataSync(auth.fecth),true);    
        assert(result, null);
    });


});