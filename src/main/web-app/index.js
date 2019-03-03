const {Loader} = require('semantic-chess');
const auth = require('solid-auth-client');
const DataSync = require('../lib/datasync');
const namespaces = require('../lib/namespaces');
const { default: data } = require('@solid/query-ldflex');
const Core = require('../lib/core');

let userWebId;
let semanticGame;
let dataSync = new DataSync(auth.fetch);

let userDataUrl;
let oppWebId;
let gamesToJoin = [];

let gameName;

let refreshIntervalId;
let core = new Core(auth.fetch);


/*Log in-out*/

$('.login-btn').click(() => {
  auth.popupLogin({ popupUri: 'popup.html' });
});

$('#logout-btn').click(() => {
  auth.logout();
});

/******

/**
 * This method does the necessary updates of the UI when the different game options are shown.
 */
function setUpForEveryGameOption() {
  $('#game-loading').removeClass('hidden');
}

/**
 * This method sets up a new chess game.
 * @returns {Promise<void>}
 */
async function setUpNewChessGame() {
  setUpForEveryGameOption();

  semanticGame = await core.setUpNewGame(userDataUrl, userWebId, oppWebId, startPosition, gameName, dataSync, realTime);



  setUpBoard(semanticGame);
}

/**
 * This method sets up the chessboard.
 * @param semanticGame: the Semantic Game which drives the board.
 * @returns {Promise<void>}
 */
async function setUpBoard() {
    
    $('#game').removeClass('hidden');
  $('#game-loading').addClass('hidden');

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
    $('#game').addClass('hidden');
    $('#new-game-options').addClass('hidden');
    $('#join-game-options').addClass('hidden');
    $('#game-options').removeClass('hidden');

    userWebId = null;
    semanticGame = null;
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
});

/**
 * This method updates the UI after a game option has been selected by the player.
 */
function afterGameOption() {
  $('#game-options').addClass('hidden');
}

$('#new-btn').click(async () => {
  if (userWebId) {
    afterGameOption();
    $('#new-game-options').removeClass('hidden');
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

$('#start-new-game-btn').click(async () => {
  const dataUrl = $('#data-url').val();

  if (await core.writePermission(dataUrl, dataSync)) {
    $('#new-game-options').addClass('hidden');
    oppWebId = $('#possible-opps').val();
    userDataUrl = dataUrl;
    gameName = $('#game-name').val();
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

    if (gamesToJoin.length > 0) {
      $('#join-loading').addClass('hidden');
      $('#join-form').removeClass('hidden');
      const $select = $('#game-urls');
      $select.empty();

      gamesToJoin.forEach(game => {
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

      while (i < gamesToJoin.length && gamesToJoin[i].gameUrl !== gameUrl) {
        i++;
      }

      const game = gamesToJoin[i];

      // remove it from the array so it's no longer shown in the UI
      gamesToJoin.splice(i, 1);

      afterGameSpecificOptions();
      setUpForEveryGameOption();
      oppWebId = game.opponentWebId;
      semanticGame = await core.joinExistingChessGame(gameUrl, game.invitationUrl, oppWebId, userWebId, userDataUrl, dataSync, game.fileUrl);

      if (semanticGame.isRealTime()) {
        webrtc = new WebRTC({
          userWebId,
          userInboxUrl: await core.getInboxUrl(userWebId),
          opponentWebId: oppWebId,
          opponentInboxUrl: await core.getInboxUrl(oppWebId),
          fetch: auth.fetch,
          initiator: false,
          onNewData: rdfjsSource => {
            let newMoveFound = false;

            core.checkForNewMoveForRealTimeGame(semanticGame, dataSync, userDataUrl, rdfjsSource, (san, url) => {
              semanticGame.loadMove(san, {url});
              board.position(semanticGame.getChess().fen());
              updateStatus();
              newMoveFound = true;
            });

            if (!newMoveFound) {
              core.checkForGiveUpOfRealTimeGame(semanticGame, rdfjsSource, (agentUrl, objectUrl) => {
                semanticGame.loadGiveUpBy(agentUrl);
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

      setUpBoard(semanticGame);
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
  const game = semanticGame.getChess();

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
    await core.checkForNewMove(semanticGame, userWebId, fileurl, userDataUrl, dataSync, (san, url) => {
      semanticGame.loadMove(san, {url});
      board.position(semanticGame.getChess().fen());
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
        const gameToJoin = await core.getJoinRequest(fileurl, userWebId);

        if (gameToJoin) {
          gamesToJoin.push(await core.processGameToJoin(gameToJoin, fileurl));
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

    if (semanticGame && semanticGame.getUrl() === gameUrl && semanticGame.isRealTime()) {
      if (rsvpResponse.value === namespaces.schema + 'RsvpResponseYes') {
        $('#real-time-setup .modal-body ul').append('<li>Invitation accepted</li><li>Setting up direct connection</li>');
        webrtc.start();
      }
    } else {
      let gameName = await core.getObjectFromPredicateForResource(gameUrl, namespaces.schema + 'name');
      const loader = new Loader(auth.fetch);
      const gameOppWebId = await loader.findWebIdOfOpponent(gameUrl, userWebId);
      const opponentsName = await core.getFormattedName(gameOppWebId);

      //show response in UI
      if (!gameName) {
        gameName = gameUrl;
      } else {
        gameName = gameName.value;
      }

      let text;

      if (rsvpResponse.value === namespaces.schema + 'RsvpResponseYes') {
        text = `${opponentsName} accepted your invitation to join "${gameName}"!`;
      } else if (rsvpResponse.value === namespaces.schema + 'RsvpResponseNo') {
        text = `${opponentsName} refused your invitation to join ${gameName}...`;
      }

      if (!$('#invitation-response').is(':visible')) {
        $('#invitation-response .modal-body').empty();
      }

      if ($('#invitation-response .modal-body').text() !== '') {
        $('#invitation-response .modal-body').append('<br/>');
      }

      $('#invitation-response .modal-body').append(text);
      $('#invitation-response').modal('show');

      dataSync.executeSPARQLUpdateForUser(await core.getStorageForGame(userWebId, gameUrl), `INSERT DATA {
    <${response.invitationUrl}> <${namespaces.schema}result> <${response.responseUrl}>}
  `);
    }

    dataSync.deleteFileForUser(fileurl);
  } else {
    console.log(`No game url was found for response ${response.value}.`);
  }
}
*/

function stopPlaying() {
  $('#game').addClass('hidden');
  $('#game-options').removeClass('hidden');
  semanticGame = null;
}

$('#stop-playing').click(() => {
    stopPlaying();
});

$('.btn-cancel').click(() => {
  semanticGame = null;
  oppWebId = null;

  $('#game').addClass('hidden');
  $('#new-game-options').addClass('hidden');
  $('#join-game-options').addClass('hidden');
  $('#game-options').removeClass('hidden');

});
