const {Loader} = require('semantic-chess');
const auth = require('solid-auth-client');
const DataSync = require('../lib/datasync');
const namespaces = require('../lib/namespaces');
const { default: data } = require('@solid/query-ldflex');
const Core = require('../lib/core');

let userWebId;
let semanticChat;
let dataSync = new DataSync(auth.fetch);

let userDataUrl;
let oppWebId;
let chatsToJoin = [];

let chatName;

let refreshIntervalId;
let core = new Core(auth.fetch);


/*Log in-out*/

$('.login-btn').click(() => {
  auth.popupLogin({ popupUri: 'https://solid.github.io/solid-auth-client/dist/popup.html' });
});

$('#logout-btn').click(() => {
  auth.logout();
});

/******

/**
 * This method does the necessary updates of the UI when the different game options are shown.
 */
function setUpForEveryGameOption() {
  $('#chat-loading').removeClass('hidden');
}

/**
 * This method sets up a new chess game.
 * @returns {Promise<void>}
 */
async function setUpNewChessGame() {
  setUpForEveryGameOption();

  semanticChat = await core.setUpNewGame(userDataUrl, userWebId, oppWebId, chatName, dataSync);



  setUpBoard(semanticChat);
}

/**
 * This method sets up the chessboard.
 * @returns {Promise<void>}
 */
async function setUpBoard() {
    
    $('#chat').removeClass('hidden');
  $('#chat-loading').addClass('hidden');

  updateStatus();
        
  };

  const onDrop = async function(source, target) {
    
    await dataSync.executeSPARQLUpdateForUser(userDataUrl, move.sparqlUpdate); //Guarda en pod el movimiento????

    if (move.notification) {
       dataSync.sendToOpponentsInbox(await core.getInboxUrl(oppWebId), move.notification);
    }

    updateStatus();
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
 * This method updates the UI after a game option has been selected by the player.
 */
function afterGameOption() {
  $('#chat-options').addClass('hidden');
}

$('#new-btn').click(async () => {
  if (userWebId) {
    afterGameOption();
    $('#new-chat-options').removeClass('hidden');
    $('#data-url').prop('value', core.getDefaultDataUrl(userWebId));

    const $select = $('#possible-opps');

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
    oppWebId = $('#possible-opps').val();
    userDataUrl = dataUrl;
    chatName = $('#chat-name').val();
    setUpNewChessGame();
  } else {
    $('#write-permission-url').text(dataUrl);
    $('#write-permission').modal('show');
  }
});

//-----------TODO JOIN-----------
/*

$('#join-btn').click(async () => {
  if (userWebId) {
    afterGameOption();
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
      setUpForEveryGameOption();
      oppWebId = game.opponentWebId;
      semanticChat = await core.joinExistingChessGame(gameUrl, game.invitationUrl, oppWebId, userWebId, userDataUrl, dataSync, game.fileUrl);

      if (semanticChat.isRealTime()) {
        webrtc = new WebRTC({
          userWebId,
          userInboxUrl: await core.getInboxUrl(userWebId),
          opponentWebId: oppWebId,
          opponentInboxUrl: await core.getInboxUrl(oppWebId),
          fetch: auth.fetch,
          initiator: false,
          onNewData: rdfjsSource => {
            let newMoveFound = false;

            core.checkForNewMoveForRealTimeGame(semanticChat, dataSync, userDataUrl, rdfjsSource, (san, url) => {
              semanticChat.loadMove(san, {url});
              board.position(semanticChat.getChess().fen());
              updateStatus();
              newMoveFound = true;
            });

            if (!newMoveFound) {
              core.checkForGiveUpOfRealTimeGame(semanticChat, rdfjsSource, (agentUrl, objectUrl) => {
                semanticChat.loadGiveUpBy(agentUrl);
                $('#real-time-opponent-quit').modal('show');
              });
            }
          },
          onCompletion: () => {
            $('#real-time-setup').modal('hide');
          },
          onClosed: (closedByUser) => {
            if (!closedByUser && !$('#real-time-opponent-quit').is(':visible')) {
              $('#real-time-opponent-quit').modal('show');
            }
          }
        });

        webrtc.start();

        $('#real-time-setup .modal-body ul').append('<li>Response sent</li><li>Setting up direct connection</li>');
        $('#real-time-setup').modal('show');
      }

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
*/
//-------------------------------------------

/**
 * This method updates the status of the game in the UI.
 */
function updateStatus() {
  const statusEl = $('#status');
  let status = '';
  const game = semanticChat.getChess();

  let moveColor = 'White';

  if (game.turn() === 'b') {
    moveColor = 'Black';
  }

  // checkmate?
  if (game.in_checkmate() === true) {
    status = 'Game over, ' + moveColor + ' is in checkmate.';
  }

  // draw?
  else if (game.in_draw() === true) {
    status = 'Game over, drawn position';
  }

  // game still on
  else {
    status = moveColor + ' to move';

    // check?
    if (game.in_check() === true) {
      status += ', ' + moveColor + ' is in check';
    }
  }

  statusEl.html(status);
}


/**
 * This method checks if a new move has been made by the opponent.
 * The necessarily data is stored and the UI is updated.
 * @returns {Promise<void>}
 */
async function checkForNotifications() {
  console.log('Checking for new notifications');

  const updates = await core.checkUserInboxForUpdates(await core.getInboxUrl(userWebId));

  updates.forEach(async (fileurl) => {
    let newMoveFound = false;
    // check for new moves
    await core.checkForNewMove(semanticChat, userWebId, fileurl, userDataUrl, dataSync, (san, url) => {
      semanticChat.loadMove(san, {url});
      updateStatus();
      newMoveFound = true;
    });

    if (!newMoveFound) {
      // check for acceptances of invitations
      const response = await core.getResponseToInvitation(fileurl);

      if (response) {
        processResponseInNotification(response, fileurl);
      } else {
        // check for games to join
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
  oppWebId = null;

  $('#chat').addClass('hidden');
  $('#new-chat-options').addClass('hidden');
  $('#join-chat-options').addClass('hidden');
  $('#chat-options').removeClass('hidden');

});
