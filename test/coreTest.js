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
    
    
    
    
    
    
  it('getJoinRequest must be null, the url is incorrect', function() {
    assert(chat.getJoinRequest("no",  "https://urlIncorrect.inrupt.net/profile/card#me"), null);
  });

  

  it('generate invitation ', function() {
    assert(chat.generateInvitation("https://testinges3b1.inrupt.net/public",
      "https://testinges3b1.inrupt.net/public/1289317812382176", "https://testinges3b1.inrupt.net/profile/card#me", "https://testinges3b2.inrupt.net/profile/card#me"), null);
  });


});