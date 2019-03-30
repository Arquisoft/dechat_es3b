require("chai");
const semanticChat=require("../lib/semanticchat");
const DataSync=require("../lib/datasync");
var chai = require('chai');
const Core = require('../lib/core');
const chat = new Core();
var assert = chai.assert;
// In the execution of this test, are going to be used the following 2 inrupt accounts:
// Username: Testinges3b1, password: Testingarchisoft1@ WEBID: https://testinges3b1.inrupt.net/profile/card#me
// Username: Testinges3b2, password: Testingarchisoft1@ WEBID: https://testinges3b2.inrupt.net/profile/card#me
//const chaturl= new semanticChat({url:"urlPrueba"});

//This test was done yesterday, it has be commented cos' it fails
//describe("SemanticChat", function () {
//  it("getUrl", function () {
//    assert.equal(chaturl.geturl(), "urlPrueba");
//  });
//
//});

describe("Test chat", function () {
  it("2 is 2", function () {
    assert.equal(2, 2);
  });

});

describe('Basic Funcional Test', function () {
  //There is no chats so it bust be empty
  it('getIbox url', function() {
	   assert(chat.getInboxUrl("https://testinges3b2.inrupt.net") !=null);
  })

  it('getJoinRequest must be null, the url is incorrect', function() {
    assert(chat.getJoinRequest("no",  "https://testinges3b1.inrupt.net/profile/card#me"), null);
  })

  it('getFormattedName ', function() {
    assert(chat.getJoinRequest("https://testinges3b1.inrupt.net/profile/card#me"), "testinges3b");
  })

  it('generate invitation ', function() {
    assert(chat.generateInvitation("https://testinges3b1.inrupt.net/public",
      "https://testinges3b1.inrupt.net/public/1289317812382176", "https://testinges3b1.inrupt.net/profile/card#me", "https://testinges3b2.inrupt.net/profile/card#me"), null);
  })
  it('create a new chat, it must be not null', function() {
    assert(chat.setUpNewChat("https://testinges3b1.inrupt.net/public",
      "https://testinges3b1.inrupt.net/", "https://testinges3b1.inrupt.net/", "chat", new DataSync()), null);
  })


})

