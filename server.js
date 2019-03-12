var express = require('express');
var app = express();
var path = require('path');

app.use(express.static(path.join(__dirname, '/chat')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/chat/index.html'));
});

app.listen(8083, () => {
  console.log('Active server, the application should be available at: http://localhost:8083');
});