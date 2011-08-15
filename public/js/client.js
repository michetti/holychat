// get only the beginning of the user email
function toShortName(email) {
  var i = email.indexOf("@");

  if (i >= 0) {
    return email.substr(0, i);
  } else {
    return email;
  }
}

// generate gravatar url from email
function toGravatarUrl(email) {
  var emailHash = hex_md5(email);
  return "http://www.gravatar.com/avatar/" + emailHash + "?size=40&d=mm";
}

function newMessage(data) {
  $("<li style='display: none;'></li>").html("<img src='" + toGravatarUrl(data.email) + "' />" + "<span class='conversation_text'><b>" + toShortName(data.email) + "</b>: " + data.message + "</span>").appendTo("#chat_conversations ul").fadeIn();
}

$(function() {

  // Text input
  $("#text").focusin(function() {
    $(this).addClass('ui-state-highlight');

  }).focusout(function() {
    $(this).removeClass('ui-state-highlight');
  });

  // Create buttons
  $("#send").button();
  $("#clear").button();

  // Conversations auto scroll
  $("#chat_conversations div").autoscroll({
    step: 100
  });

  // Prompt for user email
  var email = '';
  while(email === null || email === '') {
    email = prompt('Qual seu email?', '');
  }

  // focus on text input
  $("#text").focus();

  // Socket.io
  var socket = io.connect('http://localhost');


  socket.on('connect', function() {
    socket.emit('join', {email: email});
  });

  socket.on('joined', function(data) {
    if(data.email === email) {
      // Set my email on page
      $("#login_menu").html(data.email);
    }
    
    // Add email to users list
    $("<li data-name='" + data.email + "'></li>").html("<img src='" + toGravatarUrl(data.email) + "' />" + toShortName(data.email)).appendTo("#chat_users ul");
    
    // If this is a new user who joinned, add a message about it
    if (data.newUser) {
      $("<li class='conversation_notice' style='display: none;'></li>").html('Usuário <b>' + toShortName(data.email) + "</b> entrou no chat").appendTo("#chat_conversations ul").fadeIn();
    }
  });

  socket.on('messages', function(data) {
    for(var i in data.messages) {
      var message = data.messages[i];
      newMessage(message);
    }
  });

  socket.on('leave', function(data) {
    $("li[data-name='" + data.email + "']").remove();
    $("<li class='conversation_notice' style='display: none;'></li>").html('Usuário <b>' + toShortName(data.email) + "</b> saiu do chat").appendTo("#chat_conversations ul").fadeIn();
  });

  socket.on('disconnect', function() {
    alert('Você foi desconectado do servidor...');
  });

  // send a chat message
  function send() {
    socket.emit('message', {message: $('#text').val()});
    $('#text').val('');
    $('#text').focus();
  };

  $("#send").click(send);
  $("#text").keyup(function(e) {
    if (e.keyCode === 13) {
      send();
    }
  });

  $("#clear").click(function() {
    $("#text").val('');
    $('#text').focus();
  });
});
