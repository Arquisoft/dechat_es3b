require("chai");
var assert = require("assert");
const auth = require("solid-auth-client");

const DataSync=require("../lib/datasync");

const Core = require("../lib/core");
const c = new Core(auth.fetch);

const CheckNotifications = require("../lib/checkNotifications");
const chat = new CheckNotifications(c);

describe("CheckNotifications Test", function () {
    
    it("checkUserForUpdates", function() {
    chat.checkUserForUpdates("https://maarr.inrupt.net/inbox/").then(r=>{assert.notEqual(r,null);});
  });

});
