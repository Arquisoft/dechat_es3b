const assert = require('assert');
const { Given, When, Then } = require('cucumber');


//----------------------- Test Login -------------------------
function loginUser(user,password) {
  if (user === "userTest3" && password === "passwordTest3") {
    return "Login in!";
  } else {
    return "error";
  }
}

Given('a {string} and {string}', function (user,password) {
    this.user = user;
    this.password = password;
});

When('the user make login', function () {
  this.reply = loginUser(this.user,this.password);
});

Then('the login is successfull {string}', function (expectedReply) {
  assert.equal(this.reply, expectedReply);
});


//------------------ Test create a chat ------------------

function createChat(user,chat,friend) {
  if(friend === null){
     return "Friend does not exist";
  }
  else{
      return "Chat created";
  }
}

Given('a {string}', function (friend) {
   var list_friend = ["friendTest3", "friend2"];

    this.friend = null;
    
    for (var i = 0; i < list_friend.length; i+=1) {
        if(list_friend[i] === friend){
           this.friend = friend;
        }
    }
    
});

When('a {string} start a {string} with {string}', function (user,chat,friend) {
  this.message = createChat(this.user,this.chat, this.friend);
});

Then('the {string} is created {string}', function (chat,expectedReply) {
  assert.equal(this.message, expectedReply);
});

//-------------- Test send a message -------------------
function sendAMessage(user,message,friend,chat) {
  if(message === null){
     return "error";
  }
  else{
      return "message send";
  }
}
Given('a {string} and a {string}', function (user,friend) {
    this.user = user;
    this.friend = friend;
});

When('a {string} send a {string} to {string} in {string}', function (user,message,friend,chat) {
    this.message = message;
    this.reply = sendAMessage(this.user,this.message, this.friend, this.chat);
});

Then('the {string} is shown {string}', function (message,expectedReply) {
  assert.equal(this.reply, expectedReply);
});

