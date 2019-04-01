class MessageManager {
    constructor(core) {
        this.core = core;
    };

    async getNewMessage(fileurl, userWebId) {
		const deferred = Q.defer();
		const rdfjsSource = await rdfjsSourceFromUrl(fileurl, this.core.fetch);

		if (rdfjsSource) {
			const engine = newEngine();
			let messageFound = false;
			const self = this.core;

			engine.query(`SELECT * {
				?message a <${namespaces.schema}Message>;
					<${namespaces.schema}givenName> ?username;
					<${namespaces.schema}text> ?msgtext.
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
						const messageTx = result['?msgtext'].value.split("/inbox/")[1].replace(/U\+0020/g, " ");
						const author = result['?username'].value.replace(/U\+0020/g, " ");
						const inboxUrl = fileurl;
						deferred.resolve({
							inboxUrl,
							messageTx,
							messageUrl,
							author
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
    
    async storeMessage(userDataUrl, username, userWebId, message, friendWebId, dataSync, toSend) {
		
		const messageTx = message.replace(/ /g,"U+0020");
		const psUsername = username.replace(/ /g,"U+0020");

		const messageUrl = await this.core.generateUniqueUrlForResource(userDataUrl);
		const sparqlUpdate = `
		<${messageUrl}> a <${namespaces.schema}Message>;
		  <${namespaces.schema}givenName> <${psUsername}>;
		  <${namespaces.schema}text> <${messageTx}>.
	  `;
        
		try {
			await dataSync.executeSPARQLUpdateForUser(userDataUrl, `INSERT DATA {${sparqlUpdate}}`);
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