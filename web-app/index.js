
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

$('.login-btn').click(() => {
  auth.popupLogin({ popupUri: 'https://solid.github.io/solid-auth-client/dist/popup.html' });
});

$('#logout-btn').click(() => {
  auth.logout();
});

/**
 * This method does the necessary updates of the UI when the different chat options are shown.
 */
function setUpForEveryChatOption() {
  $('#chat-loading').removeClass('hidden');
}

/**
 * This method sets up a new chat.
 * @returns {Promise<void>}
 */
async function setUpNewChat() {
  setUpForEveryChatOption();
  setUpChat();
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
    $('#chat').removeClass('hidden');
    $('#chat-loading').addClass('hidden');
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
//			$("#messages").val($("#messages").val() + "\n" + friendName +" >> "+ friendMessages[i].messageTx);
            $("#messages").append("<div class='container2'> <p>" + $("#messages").val() + "\n" + friendName +" >> "+ friendMessages[i].messageTx + "</p><div class='speech-bubble-ds-arrow'></div>");
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
			$("#messages").append("<div class='container2 darker'> <p>" + $("#messages").val() + "\n" + username +" >> "+ (myMessages[i].messageTx).substring(1,myMessages[i].messageTx.length) + "</p><div class='speech-bubble'></div>");
		}
		i++;
	}
	openChat = true;
};

auth.trackSession(async session => {
  const loggedIn = !!session;
  //console.log(`logged in: ${loggedIn}`);

  if (loggedIn) {
    $('#user-menu').removeClass('hidden');
    $('#nav-login-btn').addClass('hidden');
    $('#login-required').modal('hide');

    userWebId = session.webId;
    const name = await core.getFormattedName(userWebId);

    if (name) {
      $('#user-name').removeClass('hidden');
      $('#user-name').text(name);
    }

    
    checkForNotificationsInbox();
    
    // refresh every 5sec
    refreshIntervalIdInbox = setInterval(checkForNotificationsInbox, 5000);
  } else {
    $('#nav-login-btn').removeClass('hidden');
    $('#user-menu').addClass('hidden');
    $('#chat').addClass('hidden');
    $('#new-chat-options').addClass('hidden');
    $('#chat-options').removeClass('hidden');

    userWebId = null;
    clearInterval(refreshIntervalIdInbox);
    refreshIntervalIdInbox = null;
  }
});

/**
 * This method updates the UI after a chat option has been selected by the user.
 */
function afterChatOption() {
  $('#chat-options').addClass('hidden');
}

$('#new-btn').click(async () => {
  if (userWebId) {
    afterChatOption();
    $('#new-chat-options').removeClass('hidden');
    const $select = $('#possible-friends');
    $select.empty();
    for await (const friend of data[userWebId].friends) {
        let name = await core.getFormattedName(friend.value);

        $select.append(`<option value="${friend}">${name}</option>`);
    }
  } else {
    $('#login-required').modal('show');
  }
  //clearInbox();
});

$('#start-new-chat-btn').click(async () => {
  var elt = document.getElementById("possible-friends");
  const dataUrl = core.getDefaultDataUrl(userWebId)+elt.options[elt.selectedIndex].text;
    $('#new-chat-options').addClass('hidden');
    friendWebId = $('#possible-friends').val();
    userDataUrl = dataUrl;
    setUpNewChat();
});

$('#write-chat').click(async() => {
    const username = $('#user-name').text();
    const message=$('#message').val();
    const messageText =username+" >> " + message;
    const valueMes = $('#messages').val();
//	$('#messages').val( valueMes + "\n" + messageText);
    $('#messages').append("<div class='container2 darker'><p>" + valueMes + "\n" + messageText + "</p><div class='speech-bubble'></div>")
	document.getElementById("message").value="";
	await messageManager.storeMessage(userDataUrl, username, message, friendWebId, dataSync, true);
    
});

$('#join-btn').click(async () => {
  clearInbox();
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
				$("#messages").append("<div class='container2 darker'><p>" + $("#messages").val() + "\n" + await core.getFormattedName(friendWebId) + " >> " + message.messageTx+ "</p><div class='speech-bubble'></div></div>");
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
  $('#chat').addClass('hidden');
  $('#chat-options').removeClass('hidden');
  $("#messages").val("");
}

$('#stop-chatting').click(() => {
    stopChatting();
});

$('.btn-cancel').click(() => {
  friendWebId = null;
    openChat=false;

  $('#chat').addClass('hidden');
  $('#new-chat-options').addClass('hidden');
  $('#chat-options').removeClass('hidden');
$("#messages").val("");

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