require("chai");
var assert = require('assert');
const auth = require('solid-auth-client');

const Loader = require('../lib/loader');
const loader = new Loader(auth.fetch);
      

describe("Loader tests", function () {
  it("findWebIdOfFriend", function () {
      var friendWebId = loader.findWebIdOfFriend("https://alba.inrupt.net/inbox/d67b1c20-481b-11e9-89e0-5336b442946f.txt", 'https://alba.inrupt.net/profile/card#me');
      assert(friendWebId, "Promise { <pending> }");      
  });

});

