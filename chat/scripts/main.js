const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
const fileClient = require('solid-file-client');

async function login () {
  await fileClient.popupLogin().then(webId => {
      console.log(`Logged in as ${webId}.`);
  }, err => console.log(err));
  $('#login').hide();
  $('#logout').show();
  $('#chatRef').show();
}

async function logout () {
  await fileClient.logout();
  $('#login').show();
  $('#logout').hide();
  $('#chatRef').hide();
}

const popupUri = 'popup.html';
$('#login  button').click(() => login());
$('#logout button').click(() => logout());


solid.auth.trackSession(session => {
  const loggedIn = !!session;
  $('#login').toggle(!loggedIn);
  $('#logout').toggle(loggedIn);
  if (loggedIn) {
    $('#user').text(session.webId);

    if (!$('#profile').val())
      $('#profile').val(session.webId);
  }
  loadProfile();
});

async function loadProfile() {
  const store = $rdf.graph();
  
  const fetcher = new $rdf.Fetcher(store);

  dataChat.user = $('#profile').text();
  await fetcher.load(dataChat.user);

  dataChat.userName = store.any($rdf.sym(dataChat.user), FOAF('name'));
  $('#fullName').text(fullName && fullName.value);

  const friends = store.each($rdf.sym(dataChat.user), FOAF('knows'));
  $('#friends').empty();
  friends.forEach(
    async (friend) => {
      await fetcher.load(friend);
      $('#friends').append(
        $('<li>').append(
          $('<a href="chat.html">').text(store.any(friend, FOAF('name')))
          .click(
              () => {
                dataChat.receiver = friend.value;
                dataChat.receiverName = store.any(friend, FOAF('name'));
                dataChat.receiverURI = dataChat.receiver.substr(0,(dataChat.receiver.length-15));
              }
            )));
  });
}
  


var dataChat = 
{
  user: "",
  userName: "" ,
  userURI:"" ,
  friend:""  ,
  friendName:"" ,
  friendURI:""
}


async function sendMessage(text){
  var chat=dataChat.userURI+"public/Chat/";
  var chatFriend=dataChat.friendURI+"public/Chat/"
  var folder= chat+dataChat.friendName;
  var folderFriend=chatFriend+dataChat.userName+"public/Chat/"
  try{
      var err = await readFolder(chat);
      if(!err){
          throw("error")
      }
  
    }catch(error){
      await createChatFolder(chat);}
  try{
        var err2 = await readFolder(chatFriend);
        if(!err2){
            throw("error2")
        }}
      catch(error2){
        await createChatFolder(chatFriend);
  }
  await writeMessage(folder+"/"+(new Date().getTime()), text);
  await writeMessage(folderFriend+"/"+(new Date().getTime()), text);
}

$('#sendButton').click(
  async function sendFunc()  {
      dataChat.userURI = dataChat.user.substr(0,(dataChat.user.length-15));
	    var text = $('#messageText').val();
      sendMessage(text);
	  
  });