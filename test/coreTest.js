require("chai");
var assert = require('assert');
const auth = require('solid-auth-client');
const namespaces = require('../lib/namespaces');

const DataSync=require("../lib/datasync");
const data=new DataSync(auth.fetch);

const Core = require('../lib/core');
const chat = new Core(auth.fetch);

describe('Core test', function () {

it('getInboxUrl', function() {
    chat.getInboxUrl("https://maarr.inrupt.net/profile/card#me").then(r=>{assert(r,"https://maarr.inrupt.net/inbox/");});
  });
  it('getPublicUrl', function() {
    chat.getPublicUrl("https://maarr.inrupt.net/profile/card#me").then(r=>{assert(r,"https://maarr.inrupt.net/public/");});
  });
    
it('getFormattedName ', function() {
    chat.getFormattedName("https://alba.inrupt.net/profile/card#me").then(r=>{assert(r, "alba");});
    chat.getFormattedName("https://maarr.inrupt.net/profile/card#me").then(r=>{assert(r, "Mar Rodriguez");});
  });
    
it('generateUniqueUrlForResource', function() {
    chat.generateUniqueUrlForResource("baseUrlTest").then(r=>{assert(r, "baseUrlTest#");});
  });
    
it('writePermission', function() {
    chat.writePermission("https://maarr.inrupt.net/public/prueba1.ttl",data);
});
    
    it('getObjectFromPredicateForResource', function() {
    chat.getObjectFromPredicateForResource("https://maarr.inrupt.net/profile/card#me",namespaces.test);
  });
    
     it('getAllResourcesInInbox', function() {
    chat.getAllResourcesInInbox("https://maarr.inrupt.net/inbox/").then(r=>{assert(r,null);});
  });
    
    it('fileContainsChatInfo', function() {
    chat.fileContainsChatInfo("https://maarr.inrupt.net/public/prueba1.ttl").then(r=>{assert(r,true);});
  });
  
    it('getDefaultDataUrl', function () {
		assert(chat.getDefaultDataUrl("https://maarr.inrupt.net/profile/card#me"),"https://maarr.inrupt.net/public/chat_");
	})

});
