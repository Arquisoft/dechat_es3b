const Q = require('q');
const rdfjsSourceFromUrl = require('./rdfjssourcefactory').fromUrl;
const newEngine = require('@comunica/actor-init-sparql-rdfjs').newEngine;
const namespaces = require('../lib/namespaces');
class CheckNotifications {
    constructor(core) {
        this.core = core;
    };

/**
   * This method check an inbox for new notifications.
   * @param inboxUrl: the url of the inbox.
   * @returns {Promise}: a promise that resolves with an array containing the urls of all new notifications since the last time
   * this method was called.
   */
  async checkUserInboxForUpdates(inboxUrl) {
    const deferred = Q.defer();
    const newResources = [];
    const rdfjsSource = await rdfjsSourceFromUrl(inboxUrl, this.core.fetch);
    const self = this.core;
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
   * This method returns the urls of the invitation and the friend's response.
   * @param fileurl: the url of the file in which to look for the response.
   * @returns {Promise<object|null>}: a promise that resolves to {invitationUrl: string, responseUrl: string},
   * where the invitationUrl is the url of the invitation and responseUrl the url of the response.
   * If no response is found, the promise is resolved with null.
   */
  async getResponseToInvitation(fileurl) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.core.fetch);

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
   * This method returns the chat of an invitation.
   * @param url: the url of the invitation.
   * @returns {Promise}: a promise that returns the url of the chat (NamedNode) or null if none is found.
   */
  async getChatFromInvitation(url) {
    return this.core.getObjectFromPredicateForResource(url, namespaces.schema + 'event');
  }


}

  module.exports = CheckNotifications;