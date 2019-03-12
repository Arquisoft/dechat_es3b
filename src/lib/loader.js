const N3 = require('n3');
const newEngine = require('@comunica/actor-init-sparql-rdfjs').newEngine;
const Q = require('q');
const streamify = require('streamify-array');
const namespaces = require('./namespaces');
const SemanticChat = require('../lib/semanticchat');

/**
 * The Loader allows creating a Semantic Chat instance via information loaded from an url.
 */
class Loader {

  /**
   * This constructor creates an instance of Loader.
   * @param fetch: the function used to fetch the data
   */
  constructor(fetch) {
    this.engine = newEngine();
    this.fetch = fetch;
  }

  /**
   * This method creates a instance of Semantic Chess, based on a URL that describes the game.
   * @param {string} gameUrl: the url that represents the game
   * @param {string} userWebId: the WebId of the user
   * @param {string|function(): string} moveBaseUrl: base url used to create urls for new moves
   * @returns {SemanticChat}: an instance of SemanticChat
   */
  async loadFromUrl(chatUrl, userWebId, messageBaseUrl) {
    const rdfjsSource = await this._getRDFjsSourceFromUrl(chatUrl);
    const sources = [{type: 'rdfjsSource', value: rdfjsSource}];
    const friendWebId = await this.findWebIdOfFriend(chatUrl, userWebId);
    let name = await this._getObjectFromPredicateForResource(chatUrl, namespaces.schema + 'name');

    if (name) {
      name = name.value;
    }

    const semanticChat = new SemanticChat({
      url: chatUrl,
      messageBaseUrl,
      userWebId,
      friendWebId,
      name,
      messages
    });

    const messages = await this._findMessage(chatUrl);

    messages.forEach(message => {
      semanticChat.loadMessage(message.san, {url: message.url});
    });

    return semanticChat;
  }

    /**
     * This method returns the WebId of friend.
     * @param gameUrl: the url of the chat
     * @param userWebId: the WebId of the user
     * @returns {Promise}: a promise that resolves with the WebId of the opponent or null if not found
     */
    async findWebIdOfFriend(chatUrl, userWebId) {
        const deferred = Q.defer();

        const rdfjsSource = await this._getRDFjsSourceFromUrl(chatUrl);

        this.engine.query(`SELECT ?id { ?agentRole <${namespaces.rdf}type> ?playerRole;
                   <${namespaces.chat}performedBy> ?id.
                MINUS {?playerRole <${namespaces.chat}performedBy> <${userWebId}> .}} LIMIT 100`,
            {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
            .then(function (result) {
                result.bindingsStream.on('data', function (data) {
                    const id = data.toObject()['?id'].value;

                    if (id !== userWebId) {
                        deferred.resolve(id);
                    }
                });

                result.bindingsStream.on('end', function () {
                    deferred.resolve(null);
                });
            });

        return deferred.promise;
    }

  /**
   * This method returns the move that is represented by a url
   * @param {string} moveUrl: the url of the move
   * @param predicate: the predicate that connects the current move with the next move
   * @returns {Promise}: a promise that resolves with an array of moves
   * @private
   */
  async _findMessage(messageUrl, predicate) {
    const deferred = Q.defer();
    let results = [];

    const rdfjsSource = await this._getRDFjsSourceFromUrl(messageUrl);
    let nextMoveFound = false;

    this.engine.query(`SELECT * {
      OPTIONAL { <${messageUrl}> <${namespaces.chat}hasSANRecord> ?san. }
    } LIMIT 100`,
      {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
      .then(result => {
        result.bindingsStream.on('data', async data => {
          data = data.toObject();

          if (data['?san']) {
            results.push({
              san: data['?san'].value,
              url: moveUrl
            });
          }

          if (data['?nextMove']) {
            nextMoveFound = true;
            const t = await this._findMove(data['?nextMove'].value, namespaces.chess + 'nextHalfMove');
            results = results.concat(t);
          }

          deferred.resolve(results);
        });

        result.bindingsStream.on('end', function () {
          if (!nextMoveFound) {
            deferred.resolve(results);
          }
        });
      });

    return deferred.promise;
  }

  /**
   * This method returns an RDFJSSource of an url
   * @param {string} url: url of the source
   * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
   * @private
   */
  _getRDFjsSourceFromUrl(url) {
    const deferred = Q.defer();

    this.fetch(url)
      .then(async res => {
        if (res.status === 404) {
          deferred.reject(404);
        } else {
          const body = await res.text();
          const store = N3.Store();
          const parser = N3.Parser({baseIRI: res.url});

          parser.parse(body, (err, quad, prefixes) => {
            if (err) {
              deferred.reject();
            } else if (quad) {
              store.addQuad(quad);
            } else {
              const source = {
                match: function(s, p, o, g) {
                  return streamify(store.getQuads(s, p, o, g));
                }
              };

              deferred.resolve(source);
            }
          });
        }
      });

    return deferred.promise;
  }

  /**
   * This method returns the object of resource via a predicate.
   * @param url: the url of the resource.
   * @param predicate: the predicate for which to look.
   * @returns {Promise}: a promise that resolves with the object or null if none is found.
   */
  async _getObjectFromPredicateForResource(url, predicate) {
    const deferred = Q.defer();
    const rdfjsSource = await this._getRDFjsSourceFromUrl(url);
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

    return deferred.promise;
  }
}

module.exports = Loader;
