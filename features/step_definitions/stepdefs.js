'use strict';

const assert = require('assert');
var seleniumWebDriver = require ('selenium-webdriver');

module.exports = function () {
    
    //----------------------- Test Login -------------------------
    this.Given(/^a "([^"]*)" and "([^"]*)" and the user make login$/, function (user,password) {
        //Parent --> First window
        var parent = driver.getWindowHandle();
        return helpers.loadPage("https://arquisoft.github.io/dechat_es3b/")
            .then(()=> {
                    return driver.findElement(by.xpath("//*[@id='login-btn']")).click()
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
                                            return driver.wait(until.elementsLocated(by.xpath("//*[@id='mainNav']")), 20000);
                                        })
                                })
                            });
                    })
                })
    });
    
    this.Then(/^the login is successfull$/,function (){
        return driver.wait(until.elementsLocated(by.xpath("//*[@id='mainNav']")), 10000);
    });
    
    
     //----------------------- Test Login Incorrect -------------------------
    this.Given(/^a "([^"]*)" and "([^"]*)" and the user make bad login$/, function (user,password) {
        //Parent --> First window
        var parent = driver.getWindowHandle();
        return helpers.loadPage("https://arquisoft.github.io/dechat_es3b/")
            .then(()=> {
                    return driver.findElement(by.xpath("//*[@id='login-btn']")).click()
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
        return driver.findElement(by.xpath("//*[@id='login-btn']"));
    });
    
    
    //----------------------- Test logout -------------------------
    this.Given(/^a "([^"]*)" and "([^"]*)" and the user make login and log out$/, function (user,password) {
        //Parent --> First window
        var parent = driver.getWindowHandle();
        return helpers.loadPage("https://arquisoft.github.io/dechat_es3b/")
            .then(()=> {
                    return driver.findElement(by.xpath("//*[@id='login-btn']")).click()
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
                                            return driver.wait(until.elementsLocated(by.xpath("//*[@id='mainNav']")), 20000);
                                        })
                                })
                            });
                    })
                })
    });
    
    this.Then(/^the main window is shows$/,function (){
        return driver.wait(until.elementsLocated(by.xpath("//*[@id='logout-btn']")), 20000)
            .then(()=>{
                driver.findElement(By.xpath("//*[@id='logout-btn']")).click()
                    .then(() => {
                        return driver.findElement(by.xpath("//*[@id='login-btn']"));
                }); 
        });
    });
    
    //----------------------- Test create a chat -------------------------
    this.Given(/^a "([^"]*)" with a "([^"]*)" that wants to talk with a friend$/, function (user,password) {
        //Parent --> First window
        var parent = driver.getWindowHandle();
        return helpers.loadPage("https://arquisoft.github.io/dechat_es3b/")
            .then(()=> {
                    return driver.findElement(by.xpath("//*[@id='login-btn']")).click()
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
                                            return driver.wait(until.elementsLocated(by.xpath("//*[@id='mainNav']")), 20000);
                                        })
                                })
                            });
                    })
                })
    });
    
    this.Then(/^the chat is created$/,function (){
        return driver.wait(until.elementsLocated(by.xpath("//*[@id='mainNav']")), 10000)
            .then(() => {
                return driver.wait(until.elementsLocated(by.xpath("//*[@id='friend0']")), 10000)
                    .then(() => {
                        return driver.findElement(by.xpath("//*[@id='friend0']")).click()
                            .then(()=> {
                                return driver.wait(until.elementsLocated(by.xpath("//*[@id='friend-name']")), 10000)
                        });
                    });
                });
            });
};
