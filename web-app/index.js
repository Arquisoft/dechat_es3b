
const auth = require('solid-auth-client');
const fileClient = require('solid-file-client');
const DataSync = require('../lib/datasync');
const { default: data } = require('@solid/query-ldflex');
const Core = require('../lib/core');
const CheckNotifications = require('../lib/checkNotifications');
const MessageManager = require('../lib/messageManager');

let userWebId;
let friendWebId;
let refreshIntervalIdInbox;
let core = new Core(auth.fetch);
let checkNotifications = new CheckNotifications(core);
let messageManager = new MessageManager(core,auth.fetch);
let dataSync = new DataSync(auth.fetch);
let userDataUrl;
let friendMessages = [];
let myMessages = [];
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
  auth.popupLogin({ popupUri: 'https://solid.github.io/solid-auth-client/dist/popup.html' });
});

$("#logout-btn").click(() => {
  auth.logout();
    clearConver();
    deleteFriends();
    seePrincipalScreen();
});

async function createChatFolder(url) {
	return await fileClient.createFolder(url).then(success => {
			console.log(`Created folder ${url}.`);
		return true;
	}, err => {
		console.log(err);
		return false;
	});
}

function addMessage(user,message,sended){
    if(sended===true){
        var toAdd="<div class='d-flex flex-row-reverse bd-highlight'><div id='right'><h5><span class='badge badge-light'>"+message+"</span></h5><h6><span class='badge badge-primary'>"+user+"</span></h6></div></div>";
    }else{
        var toAdd="<div class='d-flex flex-row bd-highlight'><div id='left'><h5><span class='badge badge-light'>"+message+"</span></h5><h6><span class='badge badge-primary'>"+user+"</span></h6></div></div>";
    }
    $("#conver").append(toAdd);
}

/**
 * This method sets up the chat.
 * @returns {Promise<void>}
 */
async function setUpChat() {
    const friendName = await core.getFormattedName(friendWebId);
    $("#friend-name").text(friendName);
    createChatFolder(userDataUrl);
    checkForNotificationsPublic();
    console.log(`checked`);
    var i = 0;
    
    friendMessages.sort(function(a, b) {
      return parseFloat(a.date) - parseFloat(b.date);
  });
	while (i < friendMessages.length) {
		var nameThroughUrl = friendMessages[i].author.split("/").pop();
		if (nameThroughUrl === friendName) {
            addMessage(friendName,friendMessages[i].messageTx,false);
		}
		i++;
  }

  i = 0;
  myMessages.sort(function(a, b) {
    return parseFloat(a.date) - parseFloat(b.date);
});
  while (i < myMessages.length) {
    var nameThroughUrl = myMessages[i].author.split("/").pop();
    var friendThroughUrl = myMessages[i].friend.split("/").pop();
		if (friendName===friendThroughUrl) {
            addMessage(await core.getFormattedName(userWebId),myMessages[i].messageTx,true);
		}
		i++;
	}
	openChat = true;
};


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
    const message=$('#message').val();
    addMessage(await core.getFormattedName(userWebId),message,true);
	document.getElementById("message").value="";
	await messageManager.storeMessage(userDataUrl, await core.getFormattedName(userWebId), message, friendWebId, dataSync, true);
    
});

$("#message").keypress(async(e) => {
    var keycode = (e.keyCode ? e.keyCode : e.which);
    if (keycode === '13') {
        const message=$('#message').val();
        document.getElementById("message").value="";
        
        addMessage(await core.getFormattedName(userWebId),message,true);
        
        await messageManager.storeMessage(userDataUrl, await core.getFormattedName(userWebId), message, friendWebId, dataSync, true);
    }
});



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
      let message = await messageManager.getNewMessage(fileurl,"/public/chat_"+await psFriendname, dataSync);
      console.log(message);
      
      if (message) {
			newMessageFound = true;
				myMessages.push(message);
		} 
  });
}

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

$('#clear-inbox').click(() => {
    clearInbox();
});

