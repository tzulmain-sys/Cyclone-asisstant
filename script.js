function sendMessage(){

  let input = document.getElementById("input");
  let messages = document.getElementById("messages");

  let userText = input.value;

  messages.innerHTML += `
    <p><b>You:</b> ${userText}</p>
  `;

  let aiReply = "Hello, I am Cyclone AI.";

  messages.innerHTML += `
    <p><b>Cyclone:</b> ${aiReply}</p>
  `;

  input.value = "";
}