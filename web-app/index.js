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
let openChat=false;



/*Log in-out*/

$('.login-btn').click(() => {
  auth.popupLogin({ popupUri: 'https://solid.github.io/solid-auth-client/dist/popup.html' });
});

$('#logout-btn').click(() => {
  auth.logout();
});

/******
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
    
    $('#chat').removeClass('hidden');
    $('#chat-loading').addClass('hidden');
        
    const friendName = await core.getFormattedName(friendWebId);
    $('#friend-name').text(friendName);

        
  

//Ejemplo d como hay q guardar y enviar el mensaje
  const onDrop = async function(source, target) {
    
    await dataSync.executeSPARQLUpdateForUser(userDataUrl, move.sparqlUpdate); 

    if (move.notification) {
       dataSync.sendToFriendsInbox(await core.getInboxUrl(friendWebId), move.notification);
    }

  };

    
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
    semanticChat = null;
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
    $('#data-url').prop('value', core.getDefaultDataUrl(userWebId));

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
  const dataUrl = $('#data-url').val();

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
	const messageText =">>" + $('#message').val();
	//TODO: Save the message on SOLID Pod
    const valueMes = $('#messages').val();
	$('#messages').val( valueMes + "\n" + messageText);
	$('#message').attr('value', '');
});

//-----------TODO JOIN-----------


$('#join-btn').click(async () => {
  if (userWebId) {
    afterChatOption();
    $('#join-game-options').removeClass('hidden');
    $('#join-data-url').prop('value', core.getDefaultDataUrl(userWebId));
    $('#join-looking').addClass('hidden');

    if (chatsToJoin.length > 0) {
      $('#join-loading').addClass('hidden');
      $('#join-form').removeClass('hidden');
      const $select = $('#game-urls');
      $select.empty();

      chatsToJoin.forEach(game => {
        let name = game.name;

        if (!name) {
          name = game.gameUrl;
        }

        $select.append($(`<option value="${game.gameUrl}">${name} (${game.realTime ? `real time, ` : ''}${game.opponentsName})</option>`));
      });
    } else {
      $('#no-join').removeClass('hidden');
    }
  } else {
    $('#login-required').modal('show');
  }
});


$('#join-game-btn').click(async () => {
  if ($('#join-data-url').val() !== userWebId) {
    userDataUrl = $('#join-data-url').val();

    if (await core.writePermission(userDataUrl, dataSync)){
      $('#join-game-options').addClass('hidden');
      const gameUrl = $('#game-urls').val();

      let i = 0;

      while (i < chatsToJoin.length && chatsToJoin[i].gameUrl !== gameUrl) {
        i++;
      }

      const game = chatsToJoin[i];

      // remove it from the array so it's no longer shown in the UI
      chatsToJoin.splice(i, 1);

      afterGameSpecificOptions();
      setUpForEveryChatOption();
      friendWebId = game.opponentWebId;
      semanticChat = await core.joinExistingChessGame(gameUrl, game.invitationUrl, friendWebId, userWebId, userDataUrl, dataSync, game.fileUrl);


      setUpBoard(semanticChat);
      setUpAfterEveryGameOptionIsSetUp();
    } else {
      $('#write-permission-url').text(userDataUrl);
      $('#write-permission').modal('show');
    }
  } else {
    console.warn('We are pretty sure you do not want to remove your WebID.');
  }
});

//-------------------------------------------


/**
 * This method checks if a new move has been made by the opponent.
 * The necessarily data is stored and the UI is updated.
 * @returns {Promise<void>}
 */
async function checkForNotifications() {
  console.log('Checking for new notifications');

  const updates = await core.checkUserInboxForUpdates(await core.getInboxUrl(userWebId));

  updates.forEach(async (fileurl) => {
    let newMessageFound = false;
    console.log("Looking for new messages");
      let message = await core.getNewMessage(fileurl, userWebId, dataSync);
      console.log(message);
      
      if (message) {
			console.log("Guardando mensajes");

			newMessageFound = true;
			if (openChat) {
				$("#messagesarea").val($("#messagesarea").val() + "\n" + message.author + " ["+ message.time +"]> " + message.messageTx);
				await core.storeMessage(userDataUrl, message.author, userWebId, message.time, message.messageTx, interlocWebId, dataSync, false);
			} else {
				//If open there is no need to store them
				interlocutorMessages.push(message);
			}
		}
      
      
      

    if (!newMessageFound) {
      // check for acceptances of invitations
      const response = await core.getResponseToInvitation(fileurl);

      if (response) {
        processResponseInNotification(response, fileurl);
      } else {
        // check for chats to join
        const chatToJoin = await core.getJoinRequest(fileurl, userWebId);

        if (chatToJoin) {
          chatsToJoin.push(await core.processGameToJoin(chatToJoin, fileurl));
        }
      }
    }
  });
}


/**
 * This method processes a response to an invitation to join a game.
 * @param response: the object representing the response.
 * @param fileurl: the url of the file containing the notification.
 * @returns {Promise<void>}
 */
/*async function processResponseInNotification(response, fileurl) {
  const rsvpResponse = await core.getObjectFromPredicateForResource(response.responseUrl, namespaces.schema + 'rsvpResponse');
  let gameUrl = await core.getObjectFromPredicateForResource(response.invitationUrl, namespaces.schema + 'event');
  if (gameUrl) {
    gameUrl = gameUrl.value;
    if (semanticChat && semanticChat.getUrl() === gameUrl && semanticChat.isRealTime()) {
      if (rsvpResponse.value === namespaces.schema + 'RsvpResponseYes') {
        $('#real-time-setup .modal-body ul').append('<li>Invitation accepted</li><li>Setting up direct connection</li>');
        webrtc.start();
      }
    } else {
      let chatName = await core.getObjectFromPredicateForResource(gameUrl, namespaces.schema + 'name');
      const loader = new Loader(auth.fetch);
      const gameOppWebId = await loader.findWebIdOfOpponent(gameUrl, userWebId);
      const opponentsName = await core.getFormattedName(gameOppWebId);
      //show response in UI
      if (!chatName) {
        chatName = gameUrl;
      } else {
        chatName = chatName.value;
      }
      let text;
      if (rsvpResponse.value === namespaces.schema + 'RsvpResponseYes') {
        text = `${opponentsName} accepted your invitation to join "${chatName}"!`;
      } else if (rsvpResponse.value === namespaces.schema + 'RsvpResponseNo') {
        text = `${opponentsName} refused your invitation to join ${chatName}...`;
      }
      if (!$('#invitation-response').is(':visible')) {
        $('#invitation-response .modal-body').empty();
      }
      if ($('#invitation-response .modal-body').text() !== '') {
        $('#invitation-response .modal-body').append('<br/>');
      }
      $('#invitation-response .modal-body').append(text);
      $('#invitation-response').modal('show');
      dataSync.executeSPARQLUpdateForUser(await core.getStorageForChat(userWebId, gameUrl), `INSERT DATA {
    <${response.invitationUrl}> <${namespaces.schema}result> <${response.responseUrl}>}
  `);
    }
    dataSync.deleteFileForUser(fileurl);
  } else {
    console.log(`No chat url was found for response ${response.value}.`);
  }
}
*/

function stopPlaying() {
  $('#chat').addClass('hidden');
  $('#chat-options').removeClass('hidden');
  semanticChat = null;
}

$('#stop-playing').click(() => {
    stopPlaying();
});

$('.btn-cancel').click(() => {
  semanticChat = null;
  friendWebId = null;

  $('#chat').addClass('hidden');
  $('#new-chat-options').addClass('hidden');
  $('#join-chat-options').addClass('hidden');
  $('#chat-options').removeClass('hidden');

});