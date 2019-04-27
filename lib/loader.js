const N3 = require("n3");
const newEngine = require("@comunica/actor-init-sparql-rdfjs").newEngine;
const Q = require("q");
const streamify = require("streamify-array");
const namespaces = require("./namespaces");

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
     * This method returns the WebId of friend.
     * @param gameUrl: the url of the chat
     * @param userWebId: the WebId of the user
     * @returns {Promise}: a promise that resolves with the WebId of the opponent or null if not found
     */
    async findWebIdOfFriend(chatUrl, userWebId) {
        const deferred = Q.defer();

        const rdfjsSource = await this._getRDFjsSourceFromUrl(chatUrl);

        this.engine.query(`SELECT * {?rurl <${namespaces.schema}agent> ?webid.`, {
				sources: [{
					type: "rdfjsSource",
					value: rdfjsSource
				}]
			})
            .then(function (result) {
                result.bindingsStream.on("data", function (data) {
                    const id = data.toObject()["?webid"].value;

                    if (id !== userWebId) {
                        deferred.resolve(id);
                    }
                });

                result.bindingsStream.on("end", function () {
                    deferred.resolve(null);
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

}

module.exports = Loader;
