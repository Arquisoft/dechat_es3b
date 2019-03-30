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