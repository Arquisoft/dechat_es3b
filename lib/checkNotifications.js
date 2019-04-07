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
  async checkUserForUpdates(inboxUrl) {
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

}

  module.exports = CheckNotifications;