const SemanticChat = require('../lib/semanticchat');

class CreateChat {

    constructor(core,joinChat) {
        this.core = core;
        this.joinChat=joinChat;
    };
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
    const chatUrl = await this.core.generateUniqueUrlForResource(userDataUrl);
    const semanticChat = new SemanticChat({
      url: chatUrl,
      messageBaseUrl: userDataUrl,
      userWebId,
      friendWebId,
      name
    });
   // const invitation = await this.joinChat.generateInvitation(userDataUrl, semanticChat.getUrl(), userWebId, friendWebId);

    try {
      await dataSync.executeSPARQLUpdateForUser(userWebId, `INSERT DATA { <${chatUrl}> <${namespaces.schema}contributor> 
    <${namespaces.schema}recipient> <${friendWebId}>; 
    <${namespaces.storage}storeIn> <${userDataUrl}>.}`);
    } catch (e) {
        this.core.logger.error(`Could not add chat to WebId.`);
        this.core.logger.error(e);
    }

    /*try {
      await dataSync.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA {${invitation.sparqlUpdate}}`);
    } catch (e) {
        this.core.logger.error(`Could not save invitation for chat.`);
        this.core.logger.error(e);
    }*/

   /* try {
      await dataSync.sendToFriendsInbox(await this.core.getInboxUrl(friendWebId), invitation.notification);
    } catch (e) {
        this.core.logger.error(`Could not send invitation to friend.`);
        this.core.logger.error(e);
    }*/

    return semanticChat;
  }
}



module.exports = CreateChat;