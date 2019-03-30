require("chai");
var assert = require('assert');
const auth = require('solid-auth-client');

const Loader = require('../lib/loader');
const loader = new Loader(auth.fetch);
      

describe("Loader tests", function () {
  it("findWebIdOfFriend", function () {
      var url='https://test3b.inrupt.net/profile/card#me';
      var friendWebId = loader.findWebIdOfFriend(url, 25);
      assert(friendWebId, "Promise { <pending> }");      
  });
    
    it("findWebIdOfFriend", function () {
      var url='https://test3b.inrupt.net/profile/card#me';
      var friendWebId = loader.findWebIdOfFriend(url, 25);
      assert(friendWebId, "Promise { <pending> }");      
  });

});

