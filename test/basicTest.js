require("chai");
const semanticChat=require("../lib/semanticchat");
const chat= new semanticChat({url:"urlPrueba"});
var assert = require("assert");

describe("SemanticChat", function () {
  it("getUrl", function () {
    assert.equal(chat.geturl(), "urlPrueba");
  });

});

describe("Test chat", function () {
  it("2 is 2", function () {
    assert.equal(2, 2);
  });

});

