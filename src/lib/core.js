const N3 = require('n3');
const Q = require('q');
const newEngine = require('@comunica/actor-init-sparql-rdfjs').newEngine;
const namespaces = require('./namespaces');
const uniqid = require('uniqid');
const SemanticChat = require('./semanticchat');
const Loader = require('./loader');
const winston = require('winston');
const URI = require('uri-js');
const {format} = require('date-fns');
const rdfjsSourceFromUrl = require('./rdfjssourcefactory').fromUrl;

class SolidChatCore {

  constructor(fetch) {
    this.inboxUrls = {};
    this.fetch = fetch;
    this.alreadyCheckedResources = [];
    this.logger = winston.createLogger({
      level: 'error',
      transports: [
        new winston.transports.Console(),
      ],
      format: winston.format.cli()
    });
  };

  /**
   * This method returns the inbox of a WebId.
   * @param {string} webId: the WebId for which to find the inbox
   * @returns {Promise}: a promise that resolves with the inbox found via the WebId.
   */
  async getInboxUrl(webId) {
    if (!this.inboxUrls[webId]) {
      this.inboxUrls[webId] = (await this.getObjectFromPredicateForResource(webId, namespaces.ldp + 'inbox')).value;
    }

    return this.inboxUrls[webId];
  }

  /**
   * This method returns the url of the file where to store the data of the chat.
   * @param fileurl: the url of the file in which to look for the storage details.
   * @param chatUrl: the url of the chat for which we want to the storage details.
   * @returns {Promise<string|null>}: a promise that resolves with the url of the file or null if none is found.
   */
  async getStorageForChat(fileurl, chatUrl) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.fetch);
    const engine = newEngine();

    engine.query(`SELECT ?url {
     <${chatUrl}> <${namespaces.schema}contributor> <${fileurl}>;
        <${namespaces.storage}storeIn> ?url.
  }`,
      {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
      .then(function (result) {
        result.bindingsStream.on('data', async function (data) {
          data = data.toObject();

          deferred.resolve(data['?url'].value);
        });

        result.bindingsStream.on('end', function () {
          deferred.resolve(null);
        });
      });

    return deferred.promise;
  }

  /**
   * This method checks a file and returns the next half move of a game.
   * @param {string} fileurl: the url of the file in which to look.
   * @param {string} move: the url of the move for which to find the next one.
   * @param {string} gameUrl: the url of the game.
   * @returns {Promise}: a promise that resolves with {move: string, endsGame: boolean},
   * where move is the url of the next move and endsGame is true when this move is last move of the game.
   * If no move is found, move is null.
   */
  async getNextHalfMoveFromUrl(fileurl, move, gameUrl) {
    const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.fetch);
    return this.getNextHalfMoveFromRDFJSSource(rdfjsSource, move, gameUrl);
  }

  async getNextHalfMoveFromRDFJSSource(rdfjsSource, move, gameUrl) {
    const deferred = Q.defer();
    const engine = newEngine();
    let moveFound = false;

    engine.query(`SELECT ?nextMove ?lastMove {
    <${move}> <${namespaces.chat}nextHalfMove> ?nextMove.
    OPTIONAL { <${gameUrl}> <${namespaces.chat}hasLastHalfMove> ?lastMove}
  }`,
      {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
      .then(function (result) {
        result.bindingsStream.on('data', function (data) {
          data = data.toObject();
          moveFound = true;

          const endsGame = (data['?lastMove'] && data['?lastMove'].value === data['?nextMove'].value);

          deferred.resolve({
            move: data['?nextMove'].value,
            endsGame
          });
        });

        result.bindingsStream.on('end', function () {
          if (!moveFound) {
            deferred.resolve({move: null});
          }
        });
      });

    return deferred.promise;
  }

  async getGiveUpActionFromRDFJSSource(rdfjsSource) {
    const deferred = Q.defer();
    const engine = newEngine();

    engine.query(`SELECT ?action {
    ?action a <${namespaces.schema}GiveUpAction>.
  }`,
      {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
      .then(function (result) {
        result.bindingsStream.on('data', function (data) {
          data = data.toObject();

          deferred.resolve(data['?action'].value);
        });

        result.bindingsStream.on('end', function () {
          deferred.resolve(null);
        });
      });

    return deferred.promise;
  }

  /**
   * This method returns the original move in a file, i.e., the move preceding a next half move or the first move of a game.
   * @param fileurl: the url of the file in which to look.
   * @returns {Promise<string|null>}: a promise that resolves with the url of the move or null if none is found.
   */
  async getOriginalHalfMove(fileurl) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.fetch);

    if (rdfjsSource) {
      const engine = newEngine();

      engine.query(`SELECT ?move {
    OPTIONAL {?move <${namespaces.chat}nextHalfMove> ?nextMove.}
    OPTIONAL {?game <${namespaces.chat}hasFirstHalfMove> ?move.}
  }`,
        {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
        .then(function (result) {
          result.bindingsStream.on('data', function (data) {
            data = data.toObject();

            if (data['?move']) {
              deferred.resolve(data['?move'].value);
            } else {
              deferred.resolve(null);
            }
          });

          result.bindingsStream.on('end', function () {
            deferred.resolve(null);
          });
        });
    } else {
      deferred.resolve(null);
    }

    return deferred.promise;
  }

  /**
   * This method checks a file for the first move of a game.
   * @param fileurl: the url of the file in which to look.
   * @param gameUrl: the url of the game for which to find the first move.
   * @returns {Promise}: a promise that resolves with either the url of the first move or null.
   */
  async getFirstHalfMove(fileurl, gameUrl) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.fetch);
    const engine = newEngine();
    let moveFound = false;

    engine.query(`SELECT ?nextMove {
    <${gameUrl}> <${namespaces.chat}hasFirstHalfMove> ?nextMove.
  }`,
      {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
      .then(function (result) {
        result.bindingsStream.on('data', function (data) {
          data = data.toObject();
          moveFound = true;

          deferred.resolve(data['?nextMove'].value);
        });

        result.bindingsStream.on('end', function () {
          if (!moveFound) {
            deferred.resolve(null);
          }
        });
      });

    return deferred.promise;
  }

  async getFirstHalfMoveFromUrl(fileurl, gameUrl) {
    const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.fetch);
    return this.getFirstHalfMoveFromRDFJSSource(rdfjsSource, gameUrl);
  }

  async getFirstHalfMoveFromRDFJSSource(rdfjsSource, gameUrl) {
    const deferred = Q.defer();
    const engine = newEngine();
    let moveFound = false;

    engine.query(`SELECT ?nextMove {
    <${gameUrl}> <${namespaces.chat}hasFirstHalfMove> ?nextMove.
  }`,
      {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
      .then(function (result) {
        result.bindingsStream.on('data', function (data) {
          data = data.toObject();
          moveFound = true;

          deferred.resolve(data['?nextMove'].value);
        });

        result.bindingsStream.on('end', function () {
          if (!moveFound) {
            deferred.resolve(null);
          }
        });
      });

    return deferred.promise;
  }

  /**
   * This method checks a file and looks for the a join request.
   * @param fileurl: the url of the file in which to look.
   * @param userWebId: the WebId of the user looking for requests.
   * @returns {Promise}: a promise that resolves with {friendWebId: string, gameUrl: string, invitationUrl: string},
   * where friendWebId is the WebId of the player that initiated the request, gameUrl is the url of the game, and
   * invitationUrl is the url of the invitation.
   * If no request was found, null is returned.
   */
  async getJoinRequest(fileurl, userWebId) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.fetch);

    if (rdfjsSource) {
      const engine = newEngine();
      let invitationFound = false;
      const self = this;

      engine.query(`SELECT ?invitation {
    ?invitation a <${namespaces.schema}InviteAction>.
  }`,
        {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
        .then(function (result) {
          result.bindingsStream.on('data', async function (result) {
            invitationFound = true;
            result = result.toObject();
            const invitationUrl = result['?invitation'].value;
            let chatUrl = await self.getObjectFromPredicateForResource(invitationUrl, namespaces.schema + 'event');

            if (!chatUrl) {
              chatUrl = await self.getChatFromInvitation(invitationUrl);

              if (chatUrl) {
                self.logger.info('chat: found by using Comunica directly, but not when using LDflex. Caching issue (reported).');
              }
            }

            if (!chatUrl) {
              deferred.resolve(null);
            } else {
              chatUrl = chatUrl.value;

              const types = await self.getAllObjectsFromPredicateForResource(chatUrl, namespaces.rdf + 'type');

              let i = 0;

              while (i < types.length && types[i].value !== namespaces.chat + 'Chat') {
                i++
              }

              if (i === types.length) {
                deferred.resolve(null);
              }

              const recipient = await self.getObjectFromPredicateForResource(invitationUrl, namespaces.schema + 'recipient');

              if (!recipient || recipient.value !== userWebId) {
                deferred.resolve(null);
              }

              const loader = new Loader(self.fetch);
              const friendWebId = await loader.findWebIdOfOpponent(chatUrl, userWebId);

              deferred.resolve({
                friendWebId,
                chatUrl,
                invitationUrl
              });
            }
          });

          result.bindingsStream.on('end', function () {
            if (!invitationFound) {
              deferred.resolve(null);
            }
          });
        });
    } else {
      deferred.resolve(null);
    }

    return deferred.promise;
  }

  /**
   * This method checks if a file contains information about a chess game.
   * @param fileUrl: the url of the file to check.
   * @returns {Promise}: a promise that resolves with true if the file contains information about a chess game, else false.
   */
  async fileContainsChessInfo(fileUrl) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(fileUrl, this.fetch);
    const engine = newEngine();

    engine.query(`SELECT * {
    OPTIONAL { ?s a <${namespaces.schema}InviteAction>.}
    OPTIONAL { ?s <${namespaces.chat}nextHalfMove> ?o.}
    OPTIONAL { ?s <${namespaces.chat}hasFirstHalfMove> ?o.}
  }`,
      {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
      .then(function (result) {
        result.bindingsStream.on('data', data => {
          deferred.resolve(true);
        });

        result.bindingsStream.on('end', function () {
          deferred.resolve(false);
        });
      });

    return deferred.promise;
  }

  /**
   * This method generates a unique url for a resource based on a given base url.
   * @param baseurl: the base url for the url of the resource.
   * @returns {Promise<string>}: a promise that resolves with a unique url.
   */
  async generateUniqueUrlForResource(baseurl) {
    let url = baseurl + '#' + uniqid();

    try {
      let d = this.getObjectFromPredicateForResource(url, namespaces.rdf + 'type');

      // We assume that if this url doesn't have a type, the url is unused.
      // Ok, this is not the most fail-safe thing.
      // TODO: check if there are any triples at all.
      while (d) {
        url = baseurl + '#' + uniqid();
        d = await this.getObjectFromPredicateForResource(url, namespaces.rdf + 'type');
      }
    } catch (e) {
      // this means that response of data[url] returns a 404
      // TODO might be called when you have no access, should check
    } finally {
      return url;
    }
  }

  /**
   * This method returns a formatted name for a WebId.
   * @param webid: the WebId for which a formatted name needs to be created.
   * @returns {Promise<string|null>}: a promise that resolvew with the formatted name (string) or
   * null if no name details were found.
   */
  async getFormattedName(webid) {
    let formattedName = await this.getObjectFromPredicateForResource(webid, namespaces.foaf + 'name');

    if (!formattedName) {
      formattedName = null;
      const firstname = await this.getObjectFromPredicateForResource(webid, namespaces.foaf + 'givenName');
      const lastname = await this.getObjectFromPredicateForResource(webid, namespaces.foaf + 'lastName');

      if (firstname) {
        formattedName = firstname;
      }

      if (lastname) {
        if (formattedName) {
          formattedName += ' ';
        } else {
          formattedName = '';
        }

        formattedName += lastname;
      }

      if (!formattedName) {
        formattedName = webid;
      }
    } else {
      formattedName = formattedName.value;
    }

    return formattedName;
  }

  /**
   * This method finds all chats that we can join.
   * @param userWebId: the WebId of the friend for which we want to check for new chats.
   * @param dataSync: the DataSync object that is used to access some of the data.
   * @returns {Promise}: a promise that resolves with an array containing all chats that we can join.
   * Each object in the array has the following attributes: fileUrl (url of the file that contained the request),
   * name (name of the chat), friendsName (name of the friend), friendWebId (WebId of the friend), and
   * chatUrl (url of the chat).
   */
  async findChatsToJoin(userWebId, dataSync) {
    const deferred = Q.defer();
    const promises = [];
    const updates = await
    dataSync.checkUserInboxForUpdates(await this.getInboxUrl(userWebId));
    const results = [];

    updates.forEach(async (fileurl) => {
      const d = Q.defer();
      promises.push(d.promise);

      try {
        const result = await this.getJoinRequest(fileurl, userWebId);

        if (result) {
          result.fileUrl = fileurl;
          result.name = await this.getObjectFromPredicateForResource(result.gameUrl, namespaces.schema + 'name');

          if (result.name) {
            result.name = result.name.value;
          }

          result.friendsName = await this.getFormattedName(result.friendWebId);
          results.push(result);
        }

        d.resolve();
      } catch (e) {
        // something went wrong while reading the file, e.g., the file did not contain valid RDF
        d.resolve();
      }
    });

    Q.all(promises).then(() => {
      const chatUrls = [];
      const keep = [];

      // filter out duplicate requests based on the url of the game
      results.forEach(r => {
        if (chatUrls.indexOf(r.chatUrl) === -1) {
          chatUrls.push(r.chatUrl);
          keep.push(r);
        }
      });

      deferred.resolve(keep);
    });

    return deferred.promise;
  }

  /**
   * This method checks if the current user has write access to a file.
   * @param url: the url of the file to check.
   * @param dataSync: the DataSync object to do access.
   * @returns {Promise<boolean>}: a promise that resolves with true if the user has write access, else false.
   */
  async writePermission(url, dataSync) {
    // TODO We should probably check the ACL of the parent folder to see if we can write if the file doesn't exist and
    // if the file exists, we check the ACL of the file.
    const response = await dataSync.executeSPARQLUpdateForUser(url, 'INSERT DATA {}');
    return response.status === 200;
  }

  /**
   * This method generates an invitation (RDF) for a chess game.
   * @param baseUrl: the base url used to generate new urls.
   * @param gameUrl: the url of the game.
   * @param userWebId: the WebId of the player sending the invitation.
   * @param friendWebId: the WebId of the opponent to whom the invitation is sent.
   * @returns {Promise<string>}
   */

  async generateInvitation(baseUrl, chatUrl, userWebId, friendWebId) {
    const invitationUrl = await this.generateUniqueUrlForResource(baseUrl);
    const notification = `<${invitationUrl}> a <${namespaces.schema}InviteAction>.`;
    const sparqlUpdate = `
    <${invitationUrl}> a <${namespaces.schema}InviteAction>;
      <${namespaces.schema}event> <${chatUrl}>;
      <${namespaces.schema}agent> <${userWebId}>;
      <${namespaces.schema}recipient> <${friendWebId}>.
  `;

    return {
      notification,
      sparqlUpdate
    };
  }

  /**
   * This method generates a response (RDF) to an invitation to join a chess game.
   * @param baseUrl: the base url used to generate new urls.
   * @param invitationUrl: the url of the invitation.
   * @param userWebId: the WebId of the user send the response.
   * @param friendWebId: the WebId of the opponent to whome the response is sent.
   * @param response: the response which is either "yes" or "no".
   * @returns {Promise<string>}
   */
  async generateResponseToInvitation(baseUrl, invitationUrl, userWebId, friendWebId, response) {
    const rsvpUrl = await this.generateUniqueUrlForResource(baseUrl);
    let responseUrl;

    if (response === 'yes') {
      responseUrl = namespaces.schema + 'RsvpResponseYes';
    } else if (response === "no") {
      responseUrl = namespaces.schema + 'RsvpResponseNo';
    } else {
      throw new Error(`The parameter "response" expects either "yes" or "no". Instead, "${response}" was provided.`);
    }

    const notification = `<${invitationUrl}> <${namespaces.schema}result> <${rsvpUrl}>.`;
    const sparqlUpdate = `
    <${rsvpUrl}> a <${namespaces.schema}RsvpAction>;
      <${namespaces.schema}rsvpResponse> <${responseUrl}>;
      <${namespaces.schema}agent> <${userWebId}>;
      <${namespaces.schema}recipient> <${friendWebId}>.
      
    <${invitationUrl}> <${namespaces.schema}result> <${rsvpUrl}>.
  `;

    return {
      notification,
      sparqlUpdate
    };
  }

  /**
   * This method returns the SAN of a move.
   * @param moveUrl: the url of the move.
   * @returns {Promise<string|null>}: a promise that resolves with the san or null.
   */
  async getSANRecord(moveUrl) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(moveUrl, this.fetch);
    const engine = newEngine();

    engine.query(`SELECT ?san {
    <${moveUrl}> <${namespaces.chat}hasSANRecord> ?san.
  }`,
      {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
      .then(function (result) {
        result.bindingsStream.on('data', function (data) {
          data = data.toObject();

          deferred.resolve(data['?san']);
        });

        result.bindingsStream.on('end', function () {
          deferred.resolve(null);
        });
      });

    return deferred.promise;
  }

  /**
   * This method returns the urls of the invitation and the opponent's response.
   * @param fileurl: the url of the file in which to look for the response.
   * @returns {Promise<object|null>}: a promise that resolves to {invitationUrl: string, responseUrl: string},
   * where the invitationUrl is the url of the invitation and responseUrl the url of the response.
   * If no response is found, the promise is resolved with null.
   */
  async getResponseToInvitation(fileurl) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.fetch);

    if (rdfjsSource) {
      const engine = newEngine();

      engine.query(`SELECT * {
    ?invitation <${namespaces.schema}result> ?response.
  }`,
        {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
        .then(function (result) {
          result.bindingsStream.on('data', function (data) {
            data = data.toObject();

            deferred.resolve({
              invitationUrl: data['?invitation'].value,
              responseUrl: data['?response'].value,
            });
          });

          result.bindingsStream.on('end', function () {
            deferred.resolve(null);
          });
        });
    } else {
      deferred.resolve(null);
    }

    return deferred.promise;
  }

  /**
   * This method returns the game to which a move belongs.
   * @param moveUrl: the url of the move.
   * @returns {Promise}: a promise that returns the url of the game (NamedNode) or null if none is found.
   */
  async getGameOfMove(moveUrl) {
    return this.getObjectFromPredicateForResource(moveUrl, namespaces.schema + 'subEvent');
  }

  /**
   * This method returns the game of an invitation.
   * @param url: the url of the invitation.
   * @returns {Promise}: a promise that returns the url of the game (NamedNode) or null if none is found.
   */
  async getChatFromInvitation(url) {
    return this.getObjectFromPredicateForResource(url, namespaces.schema + 'event');
  }

  /**
   * This method returns the object of resource via a predicate.
   * @param url: the url of the resource.
   * @param predicate: the predicate for which to look.
   * @returns {Promise}: a promise that resolves with the object or null if none is found.
   */
  async getObjectFromPredicateForResource(url, predicate) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(url, this.fetch);

    if (rdfjsSource) {
      const engine = newEngine();

      engine.query(`SELECT ?o {
    <${url}> <${predicate}> ?o.
  }`,
        {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
        .then(function (result) {
          result.bindingsStream.on('data', function (data) {
            data = data.toObject();

            deferred.resolve(data['?o']);
          });

          result.bindingsStream.on('end', function () {
            deferred.resolve(null);
          });
        });
    } else {
      deferred.resolve(null);
    }

    return deferred.promise;
  }

  async getAllObjectsFromPredicateForResource(url, predicate) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(url, this.fetch);

    if (rdfjsSource) {
      const engine = newEngine();
      const objects = [];

      engine.query(`SELECT ?o {
    <${url}> <${predicate}> ?o.
  }`,
        {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
        .then(function (result) {
          result.bindingsStream.on('data', function (data) {
            data = data.toObject();

            objects.push(data['?o']);
          });

          result.bindingsStream.on('end', function () {
            deferred.resolve(objects);
          });
        });
    } else {
      deferred.resolve(null);
    }

    return deferred.promise;
  }

  /**
   * This method checks for new moves in a notification.
   * @param semanticChat: the current semantic chat being used
   * @param userWebId: the WebId of the current user
   * @param fileurl: the url of file that contains the notification.
   * @param userDataUrl: the url where the new data is stored for the game
   * @param dataSync: the DataSync instance used to save that to the POD
   * @param callback: the function with as parameters the san and url of the next move that is called at the end of this method
   * @returns {Promise<void>}
   */
  async checkForNewMessage(semanticChat = null, userWebId, fileurl, userDataUrl, dataSync, callback) {
    const originalMove = await this.getOriginalHalfMove(fileurl);

    if (originalMove) {
      let chatUrl = await this.getObjectFromPredicateForResource(originalMove, namespaces.schema + 'subEvent');

      if (!chatUrl) {
        gameUrl = await this.getGameOfMove(originalMove);

        if (chatUrl) {
          console.error('game: found by using Comunica directly, but not when using LDflex. Caching issue (reported).');
        }
      }

      if (chatUrl) {
        chatUrl = chatUrl.value;
        let chat = semanticChat;
        let chatStorageUrl;

        if (!chat || chat.getUrl() !== chatUrl) {
          chatStorageUrl = await this.getStorageForChat(userWebId, chatUrl);

          if (chatStorageUrl) {
            const loader = new Loader(this.fetch);
            chat = await
            loader.loadFromUrl(chatUrl, userWebId, chatStorageUrl);
          } else {
            this.logger.debug(`No storage location is found for game "${chatUrl}". Ignoring notification in ${fileurl}.`);
          }
        } else {
          chatStorageUrl = userDataUrl;
        }
        
        //Ojo mirar a partir de aquí que igual no hace falta

        if (game && game.isOpponentsTurn() && !game.isRealTime()) {
          const lastMoveUrl = game.getLastMove();
          let nextMoveUrl;
          let endsGame = false;

          if (lastMoveUrl) {
            const r = await
              this.getNextHalfMoveFromUrl(fileurl, lastMoveUrl.url, game.getUrl());
            nextMoveUrl = r.move;
            endsGame = r.endsGame;
          } else {
            nextMoveUrl = await
              this.getFirstHalfMoveFromUrl(fileurl, game.getUrl());
          }

          if (nextMoveUrl) {
            this.logger.debug(nextMoveUrl);
            dataSync.deleteFileForUser(fileurl);

            if (lastMoveUrl) {
              let update = `INSERT DATA {
              <${lastMoveUrl.url}> <${namespaces.chat}nextHalfMove> <${nextMoveUrl}>.
            `;

              if (endsGame) {
                update += `<${game.getUrl()}> <${namespaces.chat}hasLastHalfMove> <${nextMoveUrl}>.`;
              }

              update += '}';

              dataSync.executeSPARQLUpdateForUser(gameStorageUrl, update);
            } else {
              dataSync.executeSPARQLUpdateForUser(gameStorageUrl, `INSERT DATA {
              <${game.getUrl()}> <${namespaces.chat}hasFirstHalfMove> <${nextMoveUrl}>.
            }`);
            }

            if (semanticChat && game.getUrl() === semanticChat.getUrl()) {
              let san = await this.getObjectFromPredicateForResource(nextMoveUrl, namespaces.chat + 'hasSANRecord');

              if (!san) {
                san = await this.getSANRecord(nextMoveUrl);

                if (san) {
                  console.error('san: found by using Comunica directly, but not when using LDflex. Caching issue (reported).');
                }
              }

              if (san) {
                callback(san.value, nextMoveUrl);
              } else {
                console.error(`The move with url "${nextMoveUrl}" does not have a SAN record defined.`);
              }
            }
          }
        }
      } else {
        this.logger.warn(`No game was found for the notification about move "${originalMove}". Ignoring notification in ${fileurl}.`);
        //TODO throw error
      }
    }
  }

  /**
   * This method sets up a new chat.
   * @param userDataUrl: the url of the file where the data is stored
   * @param userWebId: the WebId of the current user
   * @param friendWebId: the WebId of the friend
   * @param name: the name of the chat
   * @param dataSync: the DataSync instance used to write data
   * @returns {semanticChat}: the newly created chat
   */
  async setUpNewChat(userDataUrl, userWebId, friendWebId, name, dataSync) {
    const chatUrl = await this.generateUniqueUrlForResource(userDataUrl);
    const semanticChat = new SemanticChat({
      url: chatUrl,
      messageBaseUrl: userDataUrl,
      userWebId,
      friendWebId,
      name,
      messages
    });
    const invitation = await this.generateInvitation(userDataUrl, semanticChat.getUrl(), userWebId, friendWebId);

    try {
      await dataSync.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA {${semanticChat.getMinimumRDF()} \n <${chatUrl}> <${namespaces.storage}storeIn> <${userDataUrl}>}`);
    } catch (e) {
      this.logger.error(`Could not save new chat data.`);
      this.logger.error(e);
    }

    try {
      await dataSync.executeSPARQLUpdateForUser(userWebId, `INSERT DATA { <${chatUrl}> <${namespaces.schema}contributor> <${userWebId}>; <${namespaces.storage}storeIn> <${userDataUrl}>.}`);
    } catch (e) {
      this.logger.error(`Could not add chat to WebId.`);
      this.logger.error(e);
    }

    try {
      await dataSync.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA {${invitation.sparqlUpdate}}`);
    } catch (e) {
      this.logger.error(`Could not save invitation for chat.`);
      this.logger.error(e);
    }

    try {
      await dataSync.sendToFriendsInbox(await this.getInboxUrl(friendWebId), invitation.notification);
    } catch (e) {
      this.logger.error(`Could not send invitation to friend.`);
      this.logger.error(e);
    }

    return semanticChat;
  }

  /**
   * This method processes a notification that contains an invitation to join a game.
   * The resulting game is added to gamesToJoin (array).
   * @param game: the object representing the relevant game information.
   * @param fileurl: the url of the file containing the notification.
   * @returns {Promise<void>}
   */
 /* async processChatToJoin(game, fileurl) {
    game.fileUrl = fileurl;
    game.name = await this.getObjectFromPredicateForResource(game.gameUrl, namespaces.schema + 'name');
    game.realTime = await this.getObjectFromPredicateForResource(game.gameUrl, namespaces.chat + 'isRealTime');

    if (game.name) {
      game.name = game.name.value;
    }

    if (game.realTime) {
      game.realTime = game.realTime.value === 'true';
    } else {
      game.realTime = false;
    }

    game.opponentsName = await this.getFormattedName(game.friendWebId);
    return game;
  }*/

  /**
   * This method joins the player with a game.
   * @param gameUrl: the url of the game to join.
   * @param invitationUrl: the url of the invitation that we accept.
   * @param friendWebId: the WebId of the opponent of the game, sender of the invitation.
   * @param userWebId: the WebId of the current user
   * @param userDataUrl: the url of the file where the data is stored
   * @param dataSync: the DataSync instance used to write data to the POD
   * @param fileUrl: the url of the file that contains the notification about the game
   * @returns {Promise<void>}
   */
 /* async joinExistingChat(gameUrl, invitationUrl, friendWebId, userWebId, userDataUrl, dataSync, fileUrl) {
    const loader = new Loader(this.fetch);
    const semanticChat = await loader.loadFromUrl(gameUrl, userWebId, userDataUrl);
    const response = await this.generateResponseToInvitation(userDataUrl, invitationUrl, userWebId, friendWebId, "yes");

    dataSync.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA {
  <${gameUrl}> a <${namespaces.chat}ChessGame>;
    <${namespaces.storage}storeIn> <${userDataUrl}>.
    
    ${response.sparqlUpdate}
  }`);
    dataSync.executeSPARQLUpdateForUser(userWebId, `INSERT DATA { <${gameUrl}> <${namespaces.schema}contributor> <${userWebId}>; <${namespaces.storage}storeIn> <${userDataUrl}>.}`);
    dataSync.sendToFriendsInbox(await this.getInboxUrl(friendWebId), response.notification);
    dataSync.deleteFileForUser(fileUrl);

    return semanticChat;
  }*/

  /**
   * This method check an inbox for new notifications.
   * @param inboxUrl: the url of the inbox.
   * @returns {Promise}: a promise that resolves with an array containing the urls of all new notifications since the last time
   * this method was called.
   */
  async checkUserInboxForUpdates(inboxUrl) {
    const deferred = Q.defer();
    const newResources = [];
    const rdfjsSource = await rdfjsSourceFromUrl(inboxUrl, this.fetch);
    const self = this;
    const engine = newEngine();

    engine.query(`SELECT ?resource {
      ?resource a <http://www.w3.org/ns/ldp#Resource>.
    }`,
      { sources: [ { type: 'rdfjsSource', value: rdfjsSource } ] })
      .then(function (result) {
        result.bindingsStream.on('data', data => {
          data = data.toObject();

          const resource = data['?resource'].value;

          if (self.alreadyCheckedResources.indexOf(resource) === -1) {
            newResources.push(resource);
            self.alreadyCheckedResources.push(resource);
          }
        });

        result.bindingsStream.on('end', function () {
          deferred.resolve(newResources);
        });
      });

    return deferred.promise;
  }

  /**
   * This method returns all resources in an inbox.
   * @param inboxUrl: the url of the inbox.
   * @returns {Promise}: a promise that resolves with an array with all urls of the resources in the inbox.
   */
  async getAllResourcesInInbox(inboxUrl) {
    const deferred = Q.defer();
    const resources = [];
    const rdfjsSource = await rdfjsSourceFromUrl(inboxUrl, this.fetch);
    const engine = newEngine();

    engine.query(`SELECT ?resource {
      ?resource a <http://www.w3.org/ns/ldp#Resource>.
    }`,
      { sources: [ { type: 'rdfjsSource', value: rdfjsSource } ] })
      .then(function (result) {
        result.bindingsStream.on('data', data => {
          data = data.toObject();

          const resource = data['?resource'].value;
          resources.push(resource);
        });

        result.bindingsStream.on('end', function () {
          deferred.resolve(resources);
        });
      });

    return deferred.promise;
  }

  getDefaultDataUrl(webId) {
    const parsedWebId = URI.parse(webId);
    const today = format(new Date(), 'yyyyMMdd');

    return  `${parsedWebId.scheme}://${parsedWebId.host}/public/chat_${today}.ttl`;
  }
}

module.exports = SolidChatCore;
