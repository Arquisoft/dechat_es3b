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

    it('checkUserInboxForUpdates', function() {
        try {
            var result =chat.checkUserInboxForUpdates("https://test3b.inrupt.net/public/"); 
            assert(result, undefined);

        }catch(err) {
            console.log('err', err)
            console.log('err', result)
        }
        
       // console.log(updates);
		//
  //  var result=chat.checkUserInboxForUpdates("https://test3b.inrupt.net/profile/card#me");
    //assert(result, "Promise { <pending> }");
  });
  
    it('getResponseToInvitation', function() {
    var result=chat.getResponseToInvitation("https://test3b.inrupt.net/profile/card#me");
    assert(result, "Promise { <pending> }");
  });

    
    it('getChatFromInvitation', function() {
    var result=chat.getChatFromInvitation("https://test3b.inrupt.net/public/chat_OtherTest#jtwuu2cu");
    assert(result, "Promise { <pending> }");
  });


});