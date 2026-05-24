function sendMessage(){

let input = document.getElementById("input");
let messages = document.getElementById("messages");

let text = input.value;

if(text === "") return;

messages.innerHTML += `
<p><b>You:</b> ${text}</p>
`;

messages.innerHTML += `
<p><b>Cyclone:</b> Hello ${text}</p>
`;

input.value = "";

}