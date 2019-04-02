'use strict';

const assert = require('assert');
//const { Given, When, Then } = require('cucumber');
//const expect = require("chai").expect;
var seleniumWebDriver = require ('selenium-webdriver');


module.exports = function () {
    
    //----------------------- Test Login -------------------------
    this.Given(/^a "([^"]*)" and "([^"]*)" and the user make login$/, function (user,password) {
        //Parent --> First window
        var parent = driver.getWindowHandle();
        return helpers.loadPage("https://arquisoft.github.io/dechat_es3b/")
            .then(()=> {
                    return driver.findElement(by.xpath("//*[@id='nav-login-btn']")).click()
                        .then(() => {
                            // select the newly opened window
                            return driver.getAllWindowHandles().then(function gotWindowHandles(allhandles) {
                                // Switching to Child window
                                driver.switchTo().window(allhandles[allhandles.length - 1]);
                                return driver.findElement(by.xpath("/html/body/div/div/div/button[4]")).click()
                                    .then(() => {
                                        driver.wait(until.elementsLocated(by.name("username")), 10000);
                                        driver.findElement(By.name("username")).sendKeys(user); 
                                        driver.findElement(By.name("password")).sendKeys(password); 
                                        return driver.findElement(by.xpath("//*[@id='login']")).click().then(() => {
                                            driver.switchTo().window(parent);
                                            return driver.wait(until.elementsLocated(by.xpath("//*[@id='user-name']")), 20000);
                                        })
                                })
                            });
                    })
                })
    });
    
    this.Then(/^the login is successfull$/,function (){
        return driver.wait(until.elementsLocated(by.xpath("//*[@id='user-name']")), 10000);
    });
    
    
     //----------------------- Test Login Incorrect -------------------------
    this.Given(/^a "([^"]*)" and "([^"]*)" and the user make bad login$/, function (user,password) {
        //Parent --> First window
        var parent = driver.getWindowHandle();
        return helpers.loadPage("https://arquisoft.github.io/dechat_es3b/")
            .then(()=> {
                    return driver.findElement(by.xpath("//*[@id='nav-login-btn']")).click()
                        .then(() => {
                            // select the newly opened window
                            return driver.getAllWindowHandles().then(function gotWindowHandles(allhandles) {
                                // Switching to Child window
                                driver.switchTo().window(allhandles[allhandles.length - 1]);
                                return driver.findElement(by.xpath("/html/body/div/div/div/button[4]")).click()
                                    .then(() => {
                                        driver.wait(until.elementsLocated(by.name("username")), 10000);
                                        driver.findElement(By.name("username")).sendKeys(user); 
                                        driver.findElement(By.name("password")).sendKeys(password); 
                                        var eleme = driver.findElement(by.xpath("//*[@id='login']"));
                                        driver.switchTo().window(allhandles[allhandles.length - 1]);
                                        driver.close();
                                        driver.switchTo().window(allhandles[0]);
                                        return eleme;
                                })
                            });
                    })
                })
    });
   
    this.Then(/^the login is unsuccessfull$/,function (){
        return driver.findElement(by.xpath("//*[@id='nav-login-btn']"));
    });
    
    
    //----------------------- Test logout -------------------------
    this.Given(/^a "([^"]*)" and "([^"]*)" and the user make login and log out$/, function (user,password) {
        //Parent --> First window
        var parent = driver.getWindowHandle();
        return helpers.loadPage("https://arquisoft.github.io/dechat_es3b/")
            .then(()=> {
                    return driver.findElement(by.xpath("//*[@id='nav-login-btn']")).click()
                        .then(() => {
                            // select the newly opened window
                            return driver.getAllWindowHandles().then(function gotWindowHandles(allhandles) {
                                // Switching to Child window
                                driver.switchTo().window(allhandles[allhandles.length - 1]);
                                return driver.findElement(by.xpath("/html/body/div/div/div/button[4]")).click()
                                    .then(() => {
                                        driver.wait(until.elementsLocated(by.name("username")), 10000);
                                        driver.findElement(By.name("username")).sendKeys(user); 
                                        driver.findElement(By.name("password")).sendKeys(password); 
                                        return driver.findElement(by.xpath("//*[@id='login']")).click().then(() => {
                                            driver.switchTo().window(parent);                                           
                                            // open the menu
//                                           return driver.wait(until.elementsLocated(by.xpath("//*[@id='user-menu']")), 80000).then(() => {
//                                               driver.findElement(By.xpath("//*[@id='user-menu']")).click();
//                                               driver.findElement(By.xpath("//*[@id='logout-btn']")).click();
//                                            });
                                            driver.wait(until.elementsLocated(by.xpath("//*[@id='navbarDropdown']")), 12000000000000000000000000000000000000000);
                                            return driver.wait(until.elementsLocated(by.xpath("//*[@id='user-menu']")), 12000000000000000000000000000000000000000);
                                        })
                                })
                            });
                    })
                })
    });
    
    this.Then(/^the main window is shows$/,function (){
        driver.findElement(By.xpath("//*[@id='navbarDropdown']")).click();
        driver.findElement(By.xpath("//*[@id='logout-btn']")).click();
        return driver.findElement(by.xpath("//*[@id='nav-login-btn']"));
    });
    
    
    
};

//
////------------------ Test create a chat ------------------
//
//function createChat(user,chat,friend) {
//  if(friend === null){
//     return "Friend does not exist";
//  }
//  else{
//      return "Chat created";
//  }
//}
//
//Given('a {string}', function (friend) {
//   var list_friend = ["friendTest3", "friend2"];
//
//    this.friend = null;
//    
//    for (var i = 0; i < list_friend.length; i+=1) {
//        if(list_friend[i] === friend){
//           this.friend = friend;
//        }
//    }
//    
//});
//
//When('a {string} start a {string} with {string}', function (user,chat,friend) {
//  this.message = createChat(this.user,this.chat, this.friend);
//});
//
//Then('the {string} is created {string}', function (chat,expectedReply) {
//  assert.equal(this.message, expectedReply);
//});
//
////-------------- Test send a message -------------------
//function sendAMessage(user,message,friend,chat) {
//  if(message === null){
//     return "error";
//  }
//  else{
//      return "message send";
//  }
//}
//Given('a {string} and a {string}', function (user,friend) {
//    this.user = user;
//    this.friend = friend;
//});
//
//When('a {string} send a {string} to {string} in {string}', function (user,message,friend,chat) {
//    this.message = message;
//    this.reply = sendAMessage(this.user,this.message, this.friend, this.chat);
//});
//
//Then('the {string} is shown {string}', function (message,expectedReply) {
//  assert.equal(this.reply, expectedReply);
//});
//
