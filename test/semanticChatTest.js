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

});



