const namespaces = require('./namespaces');

class SemanticChat {

  /**
   * @param {Object} options: options to initialize the chess game
   * @param {string} options.url: url that represents the game
   * @param {string} options.userWebId: WebId of the user
   * @param {string} options.friendWebId: WebId of friend
   * @param {null|string} options.name: name of the chat
   * @param {null|function()} options.uniqid: function that will return a unique id for the moves
   */
  constructor(options) {
    
    this.url = options.url;
    this.userWebId = options.userWebId;
    this.friendWebId = options.friendWebId;
    this.name = options.name;
    this.messages= [];
    this.totalMessages = 0;

    // an empty string as name does not make much sense
    if (this.name === '') {
      this.name = null;
    }

    // set the default uniqid function to the function of the package 'uniqid'
    if (!options.uniqid) {
      this.uniqid = require('uniqid');
    } else {
      this.uniqid = options.uniqid;
    }
  }

  //san,options
  loadMessage(message) {
      this.messages[this.totalMessages] = message;
      this.totalMessages += 1;
  }

  /**
   * This method returns the RDF (Turtle) representation of the game, without any moves.
   * @returns {string}: RDF representation of the game
   */
  getMinimumRDF() {
      
      this.minimumRDF = `<${this.url}>`;
      return this.minimumRDF;
  }

  /**
   * This method return the WebId of friend.
   * @returns {string}: WebId of friend
   */
  getFriendWebId() {
    return this.friendWebId;
  }

  /**
   * This method returns the URL of the chat.
   * @returns {string}: URL of the chat
   */
  getUrl() {
    return this.url;
  }

  /**
   * This method returns the name of the chat.
   * @returns {string|null}: name of the chat
   */
  getName() {
    return this.name;
  }
    
    /**
    *This method returns the messages
    */
    getMessages(){
        return this.messages;
    }


}

module.exports = SemanticChat;