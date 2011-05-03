var sys = require('sys');
var WebSocket = require('websocket-client').WebSocket;
var utils = require('./utils.js');

function user() {
  var now = new Date();
  var testUserEmail = 'benchmark' + now + '@gmail.com';
  var ws = new WebSocket('ws://localhost:8080/socket.io/websocket');
  //var ws = new WebSocket('ws://173.203.127.245:8080/socket.io/websocket');
  
  var joined = false;
  
  ws.onmessage = function(message) {
    var payload = utils.decode(message.data)[0];
  
    if (joined == false) {
      console.log('Sending join message');
      ws.send(utils.encode({action: 'join', email: testUserEmail}));
  
      joined = true;
  
    } else if (payload.substr(0, 3) === '~j~') {
      var data = JSON.parse(payload.substr(3));
  
      if (data.action === 'join' && data.email === testUserEmail) {
        console.log('Sending bechmark messages');
  
        setInterval(function() {
          ws.send(utils.encode({action: 'message', message: 'Benchmark message '}));
          console.log('enviando');
        }, 100);
  
      } else if (data.action === 'message') { 
          console.log('recebendo: ' + data.message);
      }
    }
  
  }
}

for(var i=1; i<=20; i++) {
  console.log('creating user ' + i);

  setTimeout(function() {
    user();
  }, i * 1100);
}
