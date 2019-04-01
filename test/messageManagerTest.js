require("chai");
var assert = require('assert');
const auth = require('solid-auth-client');

const semanticChat=require("../lib/semanticchat");
const DataSync=require("../lib/datasync");

const Core = require('../lib/core');
const c = new Core(auth.fetch);

const MessageManager = require('../lib/messageManager');
const chat = new MessageManager(c);

describe('MessageManager Test', function () {

    it('getNewMessage', function() {
        var result=chat.getNewMessage("no",  "https://urlIncorrect.inrupt.net/profile/card#me");
        assert(result, null);
  });
    

    it('storeMessage', function() {
        var result=chat.storeMessage("https://test3b.inrupt.net/profile/card#me","userName",1234,"hola",1234,new DataSync(auth.fecth),true);    
        assert(result, null);
    });


});