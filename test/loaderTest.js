require("chai");
var assert = require('assert');
const auth = require('solid-auth-client');

const Loader = require('../lib/loader');
const loader = new Loader(auth.fetch);
      

describe("Loader tests", function () {
  /*it("findWebIdOfFriend", function () {
      const friendWebId = loader.findWebIdOfFriend("", 25);
    assert.equal(friendWebId, null);
      
  });*/

});

