import { Web } from "sip.js";


const server      = "wss://pbx.positron-it.de:8089/ws";
const aor         = "sip:alice@pbx.positron-it.de";
const destination = 'sip:bob@pbx.positron-it.de';
const authorizationUsername = "alice";
const authorizationPassword = "12345";

const remoteVideoElement = document.getElementById('remoteVideo') as HTMLVideoElement;
const localVideoElement = (document.getElementById('localVideo') as HTMLVideoElement);
const options: Web.SimpleUserOptions = {
  aor,
  userAgentOptions : {
    authorizationUsername,
    authorizationPassword
  },
  media: {
    local: {
      video: localVideoElement
    },
    remote: {
      video: remoteVideoElement,
      audio: remoteVideoElement    }
  }
};

// Construct a SimpleUser instance
let simpleUser = new Web.SimpleUser(server, options);

const callButton = document.getElementById('callButton') as HTMLButtonElement;
let isCalling = false;

callButton.addEventListener('click', () => {
  if (!isCalling) {
    simpleUser.connect().then( ()=> {
      return simpleUser.call(destination);
    }).then( ()=> {
      isCalling = true;
      callButton.textContent = "Auflegen";
    }).catch(error => {
      console.error('Failed to initiate call:', error);
    });
  }else {
    isCalling = false;
    callButton.textContent = 'Anrufen';
    simpleUser.hangup().then( ()=> {
    }).catch(error => {
      console.error('Failed to hang up:', error);
    });
  }
});


