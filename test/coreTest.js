require("chai");
var assert = require('assert');
const auth = require('solid-auth-client');

const semanticChat=require("../lib/semanticchat");
const DataSync=require("../lib/datasync");

const Core = require('../lib/core');
const chat = new Core(auth.fetch);

describe('Core test', function () {

it('getInboxUrl', function() {
    chat.getInboxUrl(25).then(o=>{assert(o, null);});
  });
    
it('getFormattedName ', function() {
    chat.getFormattedName("https://alba.inrupt.net/profile/card#me").then(o=>{assert(o, "alba");});
    chat.getFormattedName("https://maarr.inrupt.net/profile/card#me").then(o=>{assert(o, "Mar Rodriguez");});
  });
    
it('generateUniqueUrlForResource', function() {
    chat.generateUniqueUrlForResource("baseUrlTest").then(o=>{assert(o, "baseUrlTest#");});
  });
    
/*it('writePermission', function() {
    assert(chat.writePermission("https://alba.inrupt.net/profile/card#me",new DataSync(auth.fecth)), false);
  });*/
    
    it('getObjectFromPredicateForResource', function() {
    chat.getObjectFromPredicateForResource("https://test3b.inrupt.net/profile/card#me","").then(o=>{assert(o,null);});
  });
  
    it('getDefaultDataUrl', function () {
		assert(chat.getDefaultDataUrl("https://test3b.inrupt.net/profile/card#me"),"https://test3b.inrupt.net/public/chat_");
	})

});