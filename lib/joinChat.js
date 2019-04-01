const namespaces = require('./namespaces');
const Q = require('q');
const rdfjsSourceFromUrl = require('./rdfjssourcefactory').fromUrl;
const newEngine = require('@comunica/actor-init-sparql-rdfjs').newEngine;
class JoinChat {
    constructor(core) {
        this.core = core;
    };
    /**
   * This method joins the friend with a chat.
   * @param invitationUrl: the url of the invitation that we accept.
   * @param friendWebId: the WebId of your friend, sender of the invitation.
   * @param userWebId: the WebId of the current user
   * @param userDataUrl: the url of the file where the data is stored
   * @param dataSync: the DataSync instance used to write data to the POD
   * @param fileUrl: the url of the file that contains the notification about the chat
   * @returns {Promise<void>}
   */
  async joinExistingChat(invitationUrl, friendWebId, userWebId, userDataUrl, dataSync, fileUrl) {
     
    const response = await this.generateResponseToInvitation(userDataUrl, invitationUrl, userWebId, friendWebId, "yes");

    dataSync.sendToFriendsInbox(await this.core.getInboxUrl(friendWebId), response.notification);

     const chatUrl = await this.core.generateUniqueUrlForResource(userDataUrl);

   try {
			await dataSync.executeSPARQLUpdateForUser(userWebId, `INSERT DATA { <${chatUrl}> <${namespaces.schema}contributor> <${userWebId}>; 
			<${namespaces.schema}recipient> <${friendWebId}>;
			<${namespaces.storage}storeIn> <${userDataUrl}>.}`);
   } catch (e) {
			this.core.logger.error(`Could not add chat to WebId.`);
			this.core.logger.error(e);
   }

   dataSync.deleteFileForUser(fileUrl);
     
     
  }

/**
   * This method generates a response (RDF) to an invitation to join a chat.
   * @param baseUrl: the base url used to generate new urls.
   * @param invitationUrl: the url of the invitation.
   * @param userWebId: the WebId of the user send the response.
   * @param friendWebId: the WebId of the friend to whome the response is sent.
   * @param response: the response which is either "yes" or "no".
   * @returns {Promise<string>}
   */
  async generateResponseToInvitation(baseUrl, invitationUrl, userWebId, friendWebId, response) {
    const rsvpUrl = await this.core.generateUniqueUrlForResource(baseUrl);
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

  async processChatToJoin(chat, fileurl) {
    chat.fileUrl = fileurl;
    chat.name = "Chat de ";
    chat.friendName = await this.core.getFormattedName(chat.friendWebId.id);
    return chat;
}
/**
* This method returns the url of the file where to store the data of the chat.
* @param fileurl: the url of the file in which to look for the storage details.
* @param chatUrl: the url of the chat for which we want to the storage details.
* @returns {Promise<string|null>}: a promise that resolves with the url of the file or null if none is found.
*/
async getStorageForChat(fileurl, chatUrl) {
const deferred = Q.defer();
const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.core.fetch);
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
   * This method checks a file and looks for the a join request.
   * @param fileurl: the url of the file in which to look.
   * @param userWebId: the WebId of the user looking for requests.
   * @returns {Promise}: a promise that resolves with {friendWebId: string, urlChat: string, invitationUrl: string},
   * where friendWebId is the WebId of the friend that initiated the request, urlChat is the url of the chat, and
   * invitationUrl is the url of the invitation.
   * If no request was found, null is returned.
   */
  async getJoinRequest(fileurl, userWebId) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.core.fetch);

    if (rdfjsSource) {
      const engine = newEngine();
      let invitationFound = false;
      const self = this.core;

      engine.query(`SELECT ?invitation {
    ?invitation a <${namespaces.schema}InviteAction>.
  }`,
        {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
        .then(function (result) {
          result.bindingsStream.on('data', async function (result) {
            invitationFound = true;
            result = result.toObject();
            const invitationUrl = result['?invitation'].value;
            let urlChat = invitationUrl.split("#")[0];
              
            if (!urlChat) {
              urlChat = await self.getChatFromInvitation(invitationUrl);
              if (urlChat) {
                self.logger.info('CHAT: found by using Comunica directly, but not when using LDflex. Caching issue (reported).');
              }
            }

            if (!urlChat) {
              deferred.resolve(null);
            } else {
              const recipient = await self.getObjectFromPredicateForResource(invitationUrl, namespaces.schema + 'recipient');
                if (!recipient || recipient.value !== userWebId) {
								deferred.resolve(null);
							}
                


                const friendWebId = await self.getObjectFromPredicateForResource(invitationUrl, namespaces.schema + 'agent');
                
                
                
              deferred.resolve({
                friendWebId,
                urlChat,
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
   * This method generates an invitation (RDF) for a chat.
   * @param baseUrl: the base url used to generate new urls.
   * @param chatUrl: the url of the chat.
   * @param userWebId: the WebId of the friend sending the invitation.
   * @param friendWebId: the WebId of the friend to whom the invitation is sent.
   * @returns {Promise<string>}
   */

  async generateInvitation(baseUrl, chatUrl, userWebId, friendWebId) {
    const invitationUrl = await this.core.generateUniqueUrlForResource(baseUrl);
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

}
  module.exports = JoinChat;