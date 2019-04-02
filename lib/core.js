const N3 = require('n3');
const Q = require('q');
const newEngine = require('@comunica/actor-init-sparql-rdfjs').newEngine;
const namespaces = require('./namespaces');
const uniqid = require('uniqid');
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
        const result=await this.getObjectFromPredicateForResource(webId, namespaces.ldp + 'inbox');
        if(result!=null){
            this.inboxUrls[webId] = result.value;
        }
    }
    return this.inboxUrls[webId];
  }

  async getPublicUrl(webId) {
    var sub=webId.substring(0,webId.length-15)
    var a=sub +"public/"
    this.inboxUrls[webId]=a
    return this.inboxUrls[webId];
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
    formattedName = formattedName.value;

    return formattedName;
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

  

  getDefaultDataUrl(webId) {
    const parsedWebId = URI.parse(webId);

    return  `${parsedWebId.scheme}://${parsedWebId.host}/public/chat_`;
  }
    
  
  
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

  async fileContainsChessInfo(fileUrl) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(fileUrl, this.fetch);
    const engine = newEngine();

    engine.query(`SELECT * {
    OPTIONAL { ?s a <${namespaces.schema}InviteAction>.}
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
}



module.exports = SolidChatCore;