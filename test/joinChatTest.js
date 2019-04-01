require("chai");
var assert = require('assert');
const auth = require('solid-auth-client');

const semanticChat=require("../lib/semanticchat");
const DataSync=require("../lib/datasync");

const Core = require('../lib/core');
const c = new Core(auth.fetch);

const JoinChat = require('../lib/joinChat');
const chat = new JoinChat(c);

describe('JoinChat Test', function () {
    
    it('joinExistingChat', function() {
     var result=chat.joinExistingChat("https://test3b.inrupt.net/public/chat_OtherTest#jtwuu2cu",1234,1234,"https://test3b.inrupt.net/profile/card#me",new DataSync(auth.fecth),"https://test3b.inrupt.net/public/chat_20190316.ttl");    
    assert(result, "Promise { <pending> }");
  });
    
 it('generate invitation ', function() {
    assert(chat.generateInvitation("https://test3b.inrupt.net/public",
      "https://testinges3b1.inrupt.net/public/16", "https://test3b.inrupt.net/profile/card#me", "https://test3b.inrupt.net/profile/card#me"), null);
  });
    
  it('getJoinRequest', function() {
    assert(chat.getJoinRequest("no",  "https://urlIncorrect.inrupt.net/profile/card#me"), null);
  });
    

     it('getStorageForChat', function() {
    var result=chat.getStorageForChat("https://test3b.inrupt.net/inbox/fdf1ee20-53a9-11e9-89e0-5336b442946f.txt","https://test3b.inrupt.net/public/chat_20190316.ttl");
    assert(result, "Promise { <pending> }");
  });
    
    
    
    it('generateResponseToInvitation1', function() {
        var result=chat.generateResponseToInvitation("https://test3b.inrupt.net/profile/card#me","https://test3b.inrupt.net/public/chat_OtherTest#jtwuu2cu",1234,1234,"no");    
        assert(result, "Promise { <pending> }");
    });
    
    it('generateResponseToInvitation2', function() {
        var result=chat.generateResponseToInvitation("https://test3b.inrupt.net/profile/card#me","https://test3b.inrupt.net/public/chat_OtherTest#jtwuu2cu",1234,1234,"");    
        assert(result, "Promise { <pending> }");
    });
    
});
  
  