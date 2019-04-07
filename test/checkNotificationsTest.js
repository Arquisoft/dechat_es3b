require("chai");
var assert = require('assert');
const auth = require('solid-auth-client');

const semanticChat=require("../lib/semanticchat");
const DataSync=require("../lib/datasync");

const Core = require('../lib/core');
const c = new Core(auth.fetch);

const CheckNotifications = require('../lib/checkNotifications');
const chat = new CheckNotifications(c);

describe('CheckNotifications Test', function () {
    
    it('checkUserForUpdates', function() {
    chat.checkUserForUpdates("https://maarr.inrupt.net/inbox/").then(r=>{assert.notEqual(r,null);});
  });
  
    it('getResponseToInvitation', function() {
    chat.getResponseToInvitation("https://maarr.inrupt.net/public/prueba1.ttl").then(r=>{assert.equal(r,null);});
  });

    it('getChatFromInvitation', function() {
        chat.getChatFromInvitation("https://maarr.inrupt.net/public/prueba1.ttl#jtd43qtk").then(r=>{assert.notEqual(r,null);});
  });


});
