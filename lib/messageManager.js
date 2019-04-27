const Q = require('q');
const rdfjsSourceFromUrl = require('./rdfjssourcefactory').fromUrl;
const newEngine = require('@comunica/actor-init-sparql-rdfjs').newEngine;
const namespaces = require('../lib/namespaces');
class MessageManager {
    constructor(core) {
        this.core = core;
    };

    async getNewMessage(fileurl,where) {
		const deferred = Q.defer();
		const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.core.fetch);

		if (rdfjsSource) {
			const engine = newEngine();
			let messageFound = false;
			const self = this.core;

			engine.query(`SELECT * {
				?message a <${namespaces.schema}Message>;
					<${namespaces.schema}givenName> ?username;
					<${namespaces.schema}friendName> ?friendname;
					<${namespaces.schema}date> ?date;
					<${namespaces.schema}text> ?msgtext.
					<${namespaces.schema}group> ?group.
			}`, {
					sources: [{
						type: 'rdfjsSource',
						value: rdfjsSource
					}]
				})
				.then(function (result) {
					result.bindingsStream.on('data', async function (result) {
						messageFound = true;
						result = result.toObject();
						const messageUrl = result['?message'].value;
						const messageTx = result['?msgtext'].value.split(where)[1].replace(/U\+0020/g, " ");
						const group = result['?group'].value.replace(/U\+0020/g, " ");
						const author = result['?username'].value.replace(/U\+0020/g, " ");
						const date = result['?date'].value.replace(/U\+0020/g, " ");
						const friend = result['?friendname'].value.replace(/U\+0020/g, " ");
						const inboxUrl = fileurl;
						deferred.resolve({
							inboxUrl,
							messageTx,
							messageUrl,
							author,
							friend,
							group,
							date
						});
					});

					result.bindingsStream.on('end', function () {
						if (!messageFound) {
							deferred.resolve(null);
						}
					});
				});
		} else {
			deferred.resolve(null);
		}

		return deferred.promise;
	}
    
    async storeMessage(userDataUrl, username, message, friendWebId, dataSync, toSend,group) {
		var friendName=await this.core.getFormattedName(friendWebId);
		const messageTx = message.replace(/ /g,"U+0020");
		const psUsername = username.replace(/ /g,"U+0020");
		const psFriendname = friendName.replace(/ /g,"U+0020");
		const url = userDataUrl.replace(/ /g,"_");
		const date = (new Date()).getTime();

		const messageUrl = await this.core.generateUniqueUrlForResource(url);
		const sparqlUpdate = `
		<${messageUrl}> a <${namespaces.schema}Message>;
			<${namespaces.schema}givenName> <${psUsername}>;
			<${namespaces.schema}friendName> <${psFriendname}>;
			<${namespaces.schema}date> <${date}>;
			<${namespaces.schema}text> <${messageTx}>.
			<${namespaces.schema}group> <${group}>.
	  `;
        
		try {
		//	await dataSync.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA {${sparqlUpdate}}`);
		await dataSync.sendToFriendsInbox(await userDataUrl, sparqlUpdate);
		} catch (e) {
			this.core.logger.error(`Could not save new message.`);
			this.core.logger.error(e);
		}

		if (toSend) {
			try {
                await dataSync.sendToFriendsInbox(await this.core.getInboxUrl(friendWebId), sparqlUpdate);
                
			} catch (e) {
				this.core.logger.error(`Could not send message to friend.`);
				this.core.logger.error(e);
			}
		}

  }

  

}

module.exports = MessageManager;