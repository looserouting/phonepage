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
      audio: remoteAudioElement
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

callButton.addEventListener('click', async () => {
  if (!isCalling) {
    try {
      callButton.disabled = true;
      callButton.textContent = "Verbinde...";
      
      await simpleUser.connect();
      await simpleUser.call(destination);
      
      isCalling = true;
      callButton.textContent = "Auflegen";
      callButton.classList.add('active');
    } catch (error) {
      console.error('Failed to initiate call:', error);
      callButton.textContent = "Fehler";
      setTimeout(() => {
        callButton.textContent = "Anrufen";
        isCalling = false;
        callButton.disabled = false;
      }, 3000);
    } finally {
      if (isCalling) callButton.disabled = false;
    }
  } else {
    try {
      await simpleUser.hangup();
      isCalling = false;
      callButton.textContent = 'Anrufen';
      callButton.classList.remove('active');
    } catch (error) {
      console.error('Failed to hang up:', error);
    }
  }
});

// Listen for call end events to reset button state
simpleUser.delegate = {
  onCallHangup: () => {
    isCalling = false;
    callButton.textContent = 'Anrufen';
    callButton.classList.remove('active');
    callButton.disabled = false;
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