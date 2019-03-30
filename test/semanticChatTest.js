require("chai");
var assert = require('assert');
const semanticChat=require("../lib/semanticchat");

const chat= new semanticChat({url:"urlTest", friendWebId:"idTest", name:"nameTest"});

describe("SemanticChat basic tests", function () {
  it("getUrl", function () {
    assert.equal(chat.getUrl(), "urlTest");
  });
    
  it('getFriendWebId', function () {
    assert.equal(chat.getFriendWebId(), "idTest");
  });
    
it('getName', function () {
    assert.equal(chat.getName(), "nameTest");
  });
    
it("getMinimumRDF", function () {
    assert.equal(chat.getMinimumRDF(), "<urlTest>");
  });
    
it("loadMessage and getMessages", function () {
    chat.loadMessage("messageTest");
    assert.equal(chat.totalMessages, 1);
    assert.equal(chat.messages[0], "messageTest");
    
    assert.equal(chat.getMessages()[0], "messageTest");
    
  });

});



