require("chai");
/**
 * Test account used:
 * username=justtestajccount
 * password= Justfortesting1@
 * url=https://justtestajccount.inrupt.net/profile/card#me
 */
const Chat = require("../lib/semanticchat");
const Core = require("../lib/core");
const Sync = require("../lib/datasync");
var MyID= "https://justtestajccount.inrupt.net/profile/card#me";
const chai = require("chai");
var asserto = chai.assert;
var assert = require("assert");
const OK = 200;

describe("Test chat", function () {

  it("2 is 2", function () {
    assert.equal(2, 2);
  });

  it("3+3 is 6", function () {
    assert.equal(3+3, 6);
  });

  //Probamos a crear chat:

  it("Crear nuevo chat", async function(){
    var response = await Core.setUpNewChat(MyID,MyID,MyID,"JustForTesting",Sync );
    assert.notnull()
  });



});
