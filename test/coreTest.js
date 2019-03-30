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
    assert(chat.getFormattedName("https://test3b.inrupt.net/profile/card#me"), "test3b");
  });
    
it('generateUniqueUrlForResource', function() {
    assert(chat.generateUniqueUrlForResource("baseUrlTest"), "baseUrlTest#");
  });
    
it('writePermission', function() {
    assert(chat.writePermission("urlTest",null), false);
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

  

 


});