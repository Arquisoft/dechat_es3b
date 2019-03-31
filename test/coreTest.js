require("chai");
var assert = require('assert');
const auth = require('solid-auth-client');

const semanticChat=require("../lib/semanticchat");
const DataSync=require("../lib/datasync");

const Core = require('../lib/core');
const chat = new Core(auth.fetch);

describe('Core test', function () {

it('getInboxUrl', function() {
    assert(chat.getInboxUrl(25), null);
  });
it('getFormattedName ', function() {
    assert(chat.getFormattedName("https://alba.inrupt.net/profile/card#me"), "alba");
  });
    
it('getFormattedName ', function() {
    assert(chat.getFormattedName("https://maarr.inrupt.net/profile/card#me"), "Mar Rodriguez");
  });
    
it('generateUniqueUrlForResource', function() {
    assert(chat.generateUniqueUrlForResource("baseUrlTest"), "baseUrlTest#");
  });
    
it('writePermission', function() {
    assert(chat.writePermission("https://alba.inrupt.net/profile/card#me",new DataSync(auth.fecth)), false);
  });
    
 it('generate invitation ', function() {
    assert(chat.generateInvitation("https://test3b.inrupt.net/public",
      "https://testinges3b1.inrupt.net/public/16", "https://test3b.inrupt.net/profile/card#me", "https://test3b.inrupt.net/profile/card#me"), null);
  });
    
  it('getJoinRequest', function() {
    assert(chat.getJoinRequest("no",  "https://urlIncorrect.inrupt.net/profile/card#me"), null);
  });
    
    //Warning 
it('setUpNewChat', function() {
    var result=chat.setUpNewChat("https://test3b.inrupt.net/profile/card#me",  1234, 1234, "Test",new DataSync(auth.fecth));
    assert(result, "Promise { <pending> }");
  });
    
    it('checkUserInboxForUpdates', function() {
    var result=chat.checkUserInboxForUpdates("https://test3b.inrupt.net/profile/card#me");
    assert(result, "Promise { <pending> }");
  });
    
    it('getNewMessage', function() {
    var result=chat.getNewMessage("https://test3b.inrupt.net/profile/card#me",1234);
    assert(result, "Promise { <pending> }");
  });
    
    it('getObjectFromPredicateForResource', function() {
    var result=chat.getObjectFromPredicateForResource("https://test3b.inrupt.net/profile/card#me","");
    assert(result, "Promise { <pending> }");
  });
    
    it('getResponseToInvitation', function() {
    var result=chat.getResponseToInvitation("https://test3b.inrupt.net/profile/card#me");
    assert(result, "Promise { <pending> }");
  });

    // Miosssssss ---- Acuérdate de borrar después este comentario
     it('getStorageForChat', function() {
    var result=chat.getStorageForChat("https://test3b.inrupt.net/inbox/fdf1ee20-53a9-11e9-89e0-5336b442946f.txt","https://test3b.inrupt.net/public/chat_20190316.ttl");
    assert(result, "Promise { <pending> }");
  });
    
    it('getChatFromInvitation', function() {
    var result=chat.getChatFromInvitation("https://test3b.inrupt.net/public/chat_OtherTest#jtwuu2cu");
    assert(result, "Promise { <pending> }");
  });
    
    it('joinExistingChat', function() {
     var result=chat.joinExistingChat("https://test3b.inrupt.net/public/chat_OtherTest#jtwuu2cu",1234,1234,"https://test3b.inrupt.net/profile/card#me",new DataSync(auth.fecth),"https://test3b.inrupt.net/public/chat_20190316.ttl");    
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
    
    it('storeMessage', function() {
        var result=chat.storeMessage("https://test3b.inrupt.net/profile/card#me","userName",1234,"hola",1234,new DataSync(auth.fecth),true);    
        assert(result, null);
    });
    
    it('getDefaultDataUrl', function () {
		var s= chat.getDefaultDataUrl("https://test3b.inrupt.net/profile/card#me");
		assert(s.includes("https://test3b.inrupt.net/public/chat_"));
	})

});