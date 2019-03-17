const Loader = require('../lib/loader');
const auth = require('solid-auth-client');
const DataSync = require('../lib/datasync');
const namespaces = require('../lib/namespaces');
const { default: data } = require('@solid/query-ldflex');
const Core = require('../lib/core');

let userWebId;
let friendWebId;
let semanticChat;
let refreshIntervalId;
let core = new Core(auth.fetch);
let dataSync = new DataSync(auth.fetch);
let userDataUrl;
let chatsToJoin = [];
let chatName;
let friendMessages = [];
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
  semanticChat = await core.setUpNewChat(userDataUrl, userWebId, friendWebId, chatName, dataSync);
  setUpChat();
}

/**
 * This method sets up the chat.
 * @returns {Promise<void>}
 */
async function setUpChat() {
    
    if (semanticChat) {
		semanticChat.getMessages().forEach(async(message) => {
			$("#messages").val($("#messages").val() + "\n" + await core.getFormattedName(friendWebId) + " >> " + message.messagetext);
		});
	}
    
    $('#chat').removeClass('hidden');
    $('#chat-loading').addClass('hidden');
        
    const friendName = await core.getFormattedName(friendWebId);
    $('#friend-name').text(friendName);
    
    var i = 0;
	while (i < friendMessages.length) {
		var nameThroughUrl = friendMessages[i].author.split("/").pop();
		if (nameThroughUrl === friendName) {
			$("#messages").val($("#messages").val() + "\n" + friendName +" >> "+ friendMessages[i].messageTx);
			await core.storeMessage(userDataUrl, friendMessages[i].author, userWebId, friendMessages[i].messageTx, friendWebId, dataSync, false);
			dataSync.deleteFileForUser(friendMessages[i].inboxUrl);
			friendMessages[i] = "hi";
		}
		i++;
	}
	i = friendMessages.length;
	while (i--) {
		if (friendMessages[i] == "hi") {
			friendMessages.splice(i, 1);
		}
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

    checkForNotifications();
    // refresh every 5sec
    refreshIntervalId = setInterval(checkForNotifications, 5000);
  } else {
    $('#nav-login-btn').removeClass('hidden');
    $('#user-menu').addClass('hidden');
    $('#chat').addClass('hidden');
    $('#new-chat-options').addClass('hidden');
    $('#join-chat-options').addClass('hidden');
    $('#chat-options').removeClass('hidden');

    userWebId = null;
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
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

    for await (const friend of data[userWebId].friends) {
        let name = await core.getFormattedName(friend.value);

        $select.append(`<option value="${friend}">${name}</option>`);
    }
  } else {
    $('#login-required').modal('show');
  }
});

$('#start-new-chat-btn').click(async () => {
  const dataUrl = core.getDefaultDataUrl(userWebId)+$('#possible-friends').text();

  if (await core.writePermission(dataUrl, dataSync)) {
    $('#new-chat-options').addClass('hidden');
    friendWebId = $('#possible-friends').val();
    userDataUrl = dataUrl;
    chatName = $('#chat-name').val();
    setUpNewChat();
  } else {
    $('#write-permission-url').text(dataUrl);
    $('#write-permission').modal('show');
  }
});

$('#write-chat').click(async() => {
    const username = $('#user-name').text();
    const message=$('#message').val();
    const messageText =username+" >> " + message;
    const valueMes = $('#messages').val();
	$('#messages').val( valueMes + "\n" + messageText);
	document.getElementById("message").value="";
	await core.storeMessage(userDataUrl, username, userWebId, message, friendWebId, dataSync, true);
    
});

//-----------TODO JOIN-----------


$('#join-btn').click(async () => {
  if (userWebId) {
    afterChatOption();
    $('#join-chat-options').removeClass('hidden');
    $('#join-looking').addClass('hidden');

    if (chatsToJoin.length > 0) {
      $('#join-loading').addClass('hidden');
      $('#join-form').removeClass('hidden');
      const $select = $('#chat-urls');
      $select.empty();

      chatsToJoin.forEach(chat => {
        let name = chat.name;
        let friend = chat.friendName;

        if (!name) {
          name = chat.urlChat;
        }

        $select.append($(`<option value="${chat.urlChat}">${friend}</option>`));
      });
    } else {
      $('#no-join').removeClass('hidden');
    }
  } else {
    $('#login-required').modal('show');
  }
});


$('#join-chat-btn').click(async () => {
  var elt = document.getElementById("chat-urls");
     
    userDataUrl = core.getDefaultDataUrl(userWebId)+elt.options[elt.selectedIndex].text;
    if (await core.writePermission(userDataUrl, dataSync)){
      $('#join-chat-options').addClass('hidden');
        setUpForEveryChatOption();
      const chatUrl  = $('#chat-urls').val();
        console.log(chatUrl);

      let i = 0;

      while (i < chatsToJoin.length && chatsToJoin[i].urlChat !== chatUrl) {
        i++;
      }
      const chat = chatsToJoin[i];
      friendWebId = chat.friendWebId.id;
      userDataUrl=userDataUrl+friendWebId;
      await core.joinExistingChat(chat.invitationUrl, friendWebId, userWebId, userDataUrl, dataSync, chat.fileUrl);
      setUpChat();
    } else {
      $('#write-permission-url').text(userDataUrl);
      $('#write-permission').modal('show');
    }
});

/**
 * This method checks if a new move has been made by the opponent.
 * The necessarily data is stored and the UI is updated.
 * @returns {Promise<void>}
 */
async function checkForNotifications() {
  const updates = await core.checkUserInboxForUpdates(await core.getInboxUrl(userWebId));

  updates.forEach(async (fileurl) => {
    let newMessageFound = false;
      
      let message = await core.getNewMessage(fileurl, userWebId, dataSync);
      console.log(message);
      
      if (message) {
			newMessageFound = true;
			if (openChat) {
				$("#messages").val($("#messages").val() + "\n" + await core.getFormattedName(friendWebId) + " >> " + message.messageTx);
				await core.storeMessage(userDataUrl, message.author, userWebId, message.messageTx, friendWebId, dataSync, false);
			} else {
				friendMessages.push(message);
			}
		} 

    if (!newMessageFound) {
      const response = await core.getResponseToInvitation(fileurl);

      if (response) {
        this.processResponseInNotification(response, fileurl);
      } else {
        const chatToJoin = await core.getJoinRequest(fileurl, userWebId);

        if (chatToJoin) {
            console.log(userWebId);
            console.log(fileurl);
          chatsToJoin.push(await core.processChatToJoin(chatToJoin, fileurl));
            console.log(chatToJoin);
        }
      }
    }
  });
}

/////////////////


/**
 * This method processes a response to an invitation to join a game.
 * @param response: the object representing the response.
 * @param fileurl: the url of the file containing the notification.
 * @returns {Promise<void>}
 */
async function processResponseInNotification(response, fileurl) {
  const rsvpResponse = await core.getObjectFromPredicateForResource(response.responseUrl, namespaces.schema + 'rsvpResponse');
  let chatUrl = await core.getObjectFromPredicateForResource(response.invitationUrl, namespaces.schema + 'event');
  if (chatUrl) {
    chatUrl = chatUrl.value;
    if (semanticChat && semanticChat.getUrl() === chatUrl) {
        
      if (rsvpResponse.value === namespaces.schema + 'RsvpResponseYes') {
        
      }
    } else {
      let chatName = await core.getObjectFromPredicateForResource(chatUrl, namespaces.schema + 'name');
      const loader = new Loader(auth.fetch);
      const friendWebId = await loader.findWebIdOfFriend(chatUrl, userWebId);
      const friendsName = await core.getFormattedName(friendWebId);
      //show response in UI
      if (!chatName) {
        chatName = chatUrl;
      } else {
        chatName = chatName.value;
      }
      let text;
      if (rsvpResponse.value === namespaces.schema + 'RsvpResponseYes') {
        text = `${friendsName} accepted your invitation to join "${chatName}"!`;
      } else if (rsvpResponse.value === namespaces.schema + 'RsvpResponseNo') {
        text = `${friendsName} refused your invitation to join ${chatName}...`;
      }
      if (!$('#invitation-response').is(':visible')) {
        $('#invitation-response .modal-body').empty();
      }
      if ($('#invitation-response .modal-body').text() !== '') {
        $('#invitation-response .modal-body').append('<br/>');
      }
      $('#invitation-response .modal-body').append(text);
      $('#invitation-response').modal('show');
      dataSync.executeSPARQLUpdateForUser(await core.getStorageForChat(userWebId, chatUrl), `INSERT DATA {
    <${response.invitationUrl}> <${namespaces.schema}result> <${response.responseUrl}>}
  `);
    }
    dataSync.deleteFileForUser(fileurl);
  } else {
    console.log(`No chat url was found for response ${response.value}.`);
  }
}


async function stopChatting() {
  $('#chat').addClass('hidden');
  $('#chat-options').removeClass('hidden');
}

$('#stop-chatting').click(() => {
    stopChatting();
});

$('.btn-cancel').click(() => {
  friendWebId = null;
    openChat=false;

  $('#chat').addClass('hidden');
  $('#new-chat-options').addClass('hidden');
  $('#join-chat-options').addClass('hidden');
  $('#chat-options').removeClass('hidden');
$("#messages").val("");

});