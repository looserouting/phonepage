import { Web } from "sip.js";

const server = "wss://pbx.positron-it.de:8089/ws";
const aor = "sip:alice@pbx.positron-it.de";
const destination = 'sip:bob@pbx.positron-it.de';
const authorizationUsername = "alice";
const authorizationPassword = "12345";
const remoteAudioElement = document.getElementById('remoteAudio') as HTMLAudioElement;
const remoteVideoElement = document.getElementById('remoteVideo') as HTMLVideoElement;
const localVideoElement = document.getElementById('localVideo') as HTMLVideoElement;

if (!remoteVideoElement || !localVideoElement) {
  throw new Error("Video elements not found");
}

const options: Web.SimpleUserOptions = {
  aor,
  userAgentOptions: {
    authorizationUsername,
    authorizationPassword,
/*    sessionDescriptionHandlerFactoryOptions: {
      peerConnectionConfiguration: {
        iceServers: [
          {
            urls: 'turn:pbx.positron-it.de:3478',
          }
        ]
      }
    }
*/
  },
  media: {
    remote: {
      video: remoteVideoElement,
      audio: remoteVideoElement
    },
    local: {
      video: localVideoElement
    }
  }
};

// Construct a SimpleUser instance
let simpleUser = new Web.SimpleUser(server, options);

const callButton = document.getElementById('callButton') as HTMLButtonElement;
let isCalling = false;

callButton.addEventListener('click', () => {
  callButton.textContent="Auflegen";
  if (!isCalling) {
    simpleUser.connect().then(() => {
      return simpleUser.call(destination);
    }).then(() => {
      isCalling = true;
    });
  } else {
    simpleUser.hangup().then(() => {
      isCalling = false;
      callButton.textContent = 'Anrufen';
    }).catch(error => {
      console.error('Failed to hang up:', error);
    });
  }
});

// Listen for call end events to reset button state
simpleUser.delegate = {
  onCallHangup: () => {
    isCalling = false;
    callButton.textContent = 'Anrufen';
  },
  onCallAnswered: () => {
    console.log('Call answered');
  },
  onCallCreated: () => {
    console.log('Call created');
  },
  onCallReceived: () => {
    console.log('Call received');
  }
};