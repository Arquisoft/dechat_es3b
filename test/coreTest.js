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
    
    it('getObjectFromPredicateForResource', function() {
    var result=chat.getObjectFromPredicateForResource("https://test3b.inrupt.net/profile/card#me","");
    assert(result, "Promise { <pending> }");
  });
  
    it('getDefaultDataUrl', function () {
		var s= chat.getDefaultDataUrl("https://test3b.inrupt.net/profile/card#me");
		assert(s.includes("https://test3b.inrupt.net/public/chat_"));
	})

});