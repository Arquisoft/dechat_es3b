
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

$('#login-btn').click(() => {
  auth.popupLogin({ popupUri: 'https://solid.github.io/solid-auth-client/dist/popup.html' });
});

$('#logout-btn').click(() => {
  auth.logout();
    seePrincipalScreen();
});

function seeChatScreen() {
 $('#principalScreen').hide(); 
    $('#footer').hide();
    $('#chatScreen').show();
}

function seePrincipalScreen() {
 $('#principalScreen').show(); 
    $('#footer').show();
    $('#chatScreen').hide();
}

async function createChatFolder(url) {
	return await fileClient.createFolder(url).then(success => {
			console.log(`Created folder ${url}.`);
		return true;
	}, err => {
		console.log(err);
		return false;
	});
}

/**
 * This method sets up the chat.
 * @returns {Promise<void>}
 */
async function setUpChat() {
  const username = $('#user-name').text(); 
    //$('#containerFriends').hide();
   // $('#containerChat').show();
    const friendName = await core.getFormattedName(friendWebId);
    $('#friend-name').text(friendName);
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
			$("#messages").val($("#messages").val() + "\n" + friendName +" >> "+ friendMessages[i].messageTx);
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
			$("#messages").val($("#messages").val() + "\n" + username +" >> "+ (myMessages[i].messageTx).substring(1,myMessages[i].messageTx.length));
		}
		i++;
	}
	openChat = true;
};

auth.trackSession(async session => {
  const loggedIn = !!session;

  if (loggedIn) {
    $('#login-required').modal('hide');
    seeChatScreen();
    userWebId = session.webId;
      
      if (userWebId) {
    let n=0;
    for await (const friend of data[userWebId].friends) {
        let name = await core.getFormattedName(friend.value);
        let id="friend"+n;
        
        $('#friends').append(`<button type="button" id="${id}" class="list-group-item list-group-item-action" value="${friend}" text="${name}">${name}</button>`);
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

function loadChat() {  
    $("#messages").val("");
  const dataUrl = core.getDefaultDataUrl(userWebId)+this.getAttribute("text");
    friendWebId = this.getAttribute("value");
    userDataUrl = dataUrl;
    setUpChat();
}

$('#write-chat').click(async() => {
    const username = $('#user-name').text();
    const message=$('#message').val();
    const messageText =username+" >> " + message;
    const valueMes = $('#messages').val();
	$('#messages').val( valueMes + "\n" + messageText);
	document.getElementById("message").value="";
	await messageManager.storeMessage(userDataUrl, username, message, friendWebId, dataSync, true);
    
});

$('#message').keypress(async(e)=> {
    var keycode = (e.keyCode ? e.keyCode : e.which);
    if (keycode == '13') {
        const username = $('#user-name').text();
        const message=$('#message').val();
        const messageText =username+" >> " + message;
        const valueMes = $('#messages').val();
        $('#messages').val( valueMes + "\n" + messageText);
        document.getElementById("message").value="";
        await messageManager.storeMessage(userDataUrl, username, message, friendWebId, dataSync, true);
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
				$("#messages").val($("#messages").val() + "\n" + await core.getFormattedName(friendWebId) + " >> " + message.messageTx);
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

async function stopChatting() {
   $('#containerFriends').show();
    $('#containerChat').hide();
  $("#messages").val("");
}

$('#stop-chatting').click(() => {
    stopChatting();
});

$('#clear-inbox').click(() => {
    clearInbox();
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