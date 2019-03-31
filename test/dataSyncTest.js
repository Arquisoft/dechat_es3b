require("chai");
var assert = require('assert');
const dataSync=require("../lib/datasync");
const auth = require('solid-auth-client');

var data = new dataSync(auth.fetch);

describe("DataSync tests", function () {
  it("createEmptyFileForUser", function () {
    assert(data.createEmptyFileForUser("https://alba.inrupt.net/inbox/ficheroNuevo.txt"), "Promise { <pending> }");
  });
    
 it("deleteFileForUser", function () {
    assert(data.deleteFileForUser("https://alba.inrupt.net/inbox/ficheroNuevo.txt"), "Promise { <pending> }");
  });

});



