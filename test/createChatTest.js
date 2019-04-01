require("chai");
var assert = require('assert');
const auth = require('solid-auth-client');

const semanticChat=require("../lib/semanticchat");
const DataSync=require("../lib/datasync");

const Core = require('../lib/core');
const c = new Core(auth.fetch);

const JoinChat = require('../lib/joinChat');
const j = new JoinChat(c);

const CreateChat = require('../lib/createChat');
const chat = new CreateChat(c,j);

describe('CreateChat Test', function () {

it('setUpNewChat', function() {
    var result=chat.setUpNewChat("https://test3b.inrupt.net/profile/card#me",  1234, 1234, "Test",new DataSync(auth.fecth));
    assert(result, "Promise { <pending> }");
  });

});