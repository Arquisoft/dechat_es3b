
const auth = require("solid-auth-client");
const fileClient = require("solid-file-client");
const DataSync = require("../lib/datasync");
const { default: data } = require("@solid/query-ldflex");
const Core = require("../lib/core");
const CheckNotifications = require("../lib/checkNotifications");
const MessageManager = require("../lib/messageManager");

let userWebId;
let friendWebId;
let refreshIntervalIdInbox;
let core = new Core(auth.fetch);
let checkNotifications = new CheckNotifications(core);
let messageManager = new MessageManager(core,auth.fetch);
let dataSync = new DataSync(auth.fetch);
let userDataUrl;
let friendMessages = [];
let openChat=false;

/*Log in-out*/

function deleteFriends(){
    var element = document.getElementById("friends");
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function clearConver(){
    $("#friend-name").text("");
    var element = document.getElementById("conver");
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function seeChatScreen() {
 $("#principalScreen").hide(); 
    $("#footer").hide();
    $("#chatScreen").show();
}

function seePrincipalScreen() {
 $("#principalScreen").show(); 
    $("#footer").show();
    $("#chatScreen").hide();
}

$("#login-btn").click(() => {
  auth.popupLogin({ popupUri: "https://solid.github.io/solid-auth-client/dist/popup.html" });
});

$("#logout-btn").click(() => {
  auth.logout();
    clearConver();
    deleteFriends();
    seePrincipalScreen();
});

async function createChatFolder(url) {
	return await fileClient.createFolder(url).then(success=>{
		return true;
	}, err => {
		return false;
	});
}

function addMessage(user,message,sended){
    var toAdd="";
    if(sended===true){
        toAdd="<div class='d-flex flex-row-reverse bd-highlight'><div id='right'><h5><span class='badge badge-light'>"+message+"</span></h5><h6><span class='badge badge-primary'>"+user+"</span></h6></div></div>";
    }else{
        toAdd="<div class='d-flex flex-row bd-highlight'><div id='left'><h5><span class='badge badge-light'>"+message+"</span></h5><h6><span class='badge badge-primary'>"+user+"</span></h6></div></div>";
    }
    $("#conver").append(toAdd);
}

/**
 * This method checks if a new message has been made by your friend into Inbox.
 * The necessarily data is stored and the UI is updated.
 * @returns {Promise<void>}
 */
async function checkForNotificationsInbox() {
  var updates = await checkNotifications.checkUserForUpdates(await core.getInboxUrl(userWebId));
  console.log(updates.length);
  updates.forEach(async (fileurl) => {   
      let message = await messageManager.getNewMessage(fileurl,"/inbox/", dataSync,);
      console.log(message);  
      if (message) {
			newMessageFound = true;
			if (openChat) {
                addMessage(await core.getFormattedName(friendWebId),message.messageTx,false);
			} else {
        message.date=message.date.split("/").pop();
				friendMessages.push(message);
			}
		} 
  });
  
}

/**
 * This method checks if a new message has been made by your friend into Publc directory.
 * The necessarily data is stored and the UI is updated.
 * @returns {Promise<void>}
 */
async function checkForNotificationsPublic() {
  const psFriendname = (await core.getFormattedName(friendWebId)).replace(/ /g,"%20");
  var updates = await checkNotifications.checkUserForUpdates(await core.getPublicUrl(userWebId)+"/chat_"+psFriendname);
  updates.forEach(async (fileurl) => {   
      let message = await messageManager.getNewMessage(fileurl,"/public/chat_"+await psFriendname+"/", dataSync);
      console.log(message);
      if (message) {
      newMessageFound = true;
      message.date=message.date.split("/").pop();
			friendMessages.push(message);
		} 
  });
}

/**
 * This method sets up the chat.
 * @returns {Promise<void>}
 */
async function setUpChat() {
    const friendName = await core.getFormattedName(friendWebId);
    const userName=await core.getFormattedName(userWebId);
    $("#friend-name").text(friendName);
    createChatFolder(userDataUrl);
    checkForNotificationsPublic();
    var i = 0; 
    friendMessages.sort(function(a, b) {
      return parseFloat(a.date) - parseFloat(b.date);
  });
	while (i < friendMessages.length) {
    var nameThroughUrl = friendMessages[i].author.split("/").pop();
    var friendThroughUrl = friendMessages[i].friend.split("/").pop();
		if (nameThroughUrl === friendName && friendThroughUrl===userName) {
      addMessage(friendName,friendMessages[i].messageTx,false);
    }
    else if (nameThroughUrl === userName && friendThroughUrl===friendName) {
      addMessage(userName,friendMessages[i].messageTx,true);
}
		i++;
  }
	openChat = true;
}


function loadChat() {  
    clearConver();
  const dataUrl = core.getDefaultDataUrl(userWebId)+this.getAttribute("text");
    friendWebId = this.getAttribute("value");
    userDataUrl = dataUrl;
    setUpChat();
}


auth.trackSession(async session => {
  const loggedIn = !!session;

  if (loggedIn) {
    $("#login-required").modal("hide");
    seeChatScreen();
    userWebId = session.webId;
      
      if (userWebId) {
    let n=0;
    for await (const friend of data[userWebId].friends) {
        let name = await core.getFormattedName(friend.value);
        let id="friend"+n;
        
        $("#friends").append(`<button type="button" id="${id}" class="list-group-item list-group-item-action" value="${friend}" text="${name}">${name}</button>`);
        document.getElementById("friend" + n).addEventListener("click", loadChat, false);
        n=n+1;
    }
  }
    
    checkForNotificationsInbox();
    
    // refresh every 5sec
    refreshIntervalIdInbox = setInterval(checkForNotificationsInbox, 5000);
  } else {
    seePrincipalScreen();
    userWebId = null;
    clearInterval(refreshIntervalIdInbox);
    refreshIntervalIdInbox = null;
  }
});

$("#write-chat").click(async() => {
    const message=$("#message").val();
    addMessage(await core.getFormattedName(userWebId),message,true);
	document.getElementById("message").value="";
	await messageManager.storeMessage(userDataUrl, await core.getFormattedName(userWebId), message, friendWebId, dataSync, true);
    
});

$("#message").keypress(async(e) => {
    var keycode = (e.keyCode ? e.keyCode : e.which);
    if (keycode === "13") {
        const message=$("#message").val();
        document.getElementById("message").value="";
        
        addMessage(await core.getFormattedName(userWebId),message,true);
        
        await messageManager.storeMessage(userDataUrl, await core.getFormattedName(userWebId), message, friendWebId, dataSync, true);
    }
});

async function clearInbox() {
  var resources = await core.getAllResourcesInInbox(await core.getInboxUrl(userWebId));

  resources.forEach(async r => {
    if (await core.fileContainsChatInfo(r)) {
      dataSync.deleteFileForUser(r);
    }
  });

  resources = await core.getAllResourcesInInbox(await core.getPublicUrl(userWebId));

  resources.forEach(async r => {
    if (await core.fileContainsChatInfo(r)) {
      dataSync.deleteFileForUser(r);
    }
  });
}

$("#clear-inbox").click(() => {
    clearInbox();
});

