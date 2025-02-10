import { Web } from "sip.js";

const server = "wss://pbx.positron-it.de:8089/ws";
const aor = "sip:alice@pbx.positron-it.de";
const destination = 'sip:bob@pbx.positron-it.de';
const authorizationUsername = "alice";
const authorizationPassword = "12345";
const remoteAudioElement = document.getElementById('remoteAudio') as HTMLAudioElement;

const options: Web.SimpleUserOptions = {
  aor,
  userAgentOptions: {
    authorizationUsername,
    authorizationPassword
  },
  media: {
    remote: {
      audio: remoteAudioElement
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

// Volume control logic
const speakerVolumeControl = document.getElementById('speakerVolume') as HTMLInputElement;
const microphoneVolumeControl = document.getElementById('microphoneVolume') as HTMLInputElement;
const speakerVolumeIndicator = document.getElementById('speakerVolumeIndicator') as HTMLElement;
const microphoneVolumeIndicator = document.getElementById('microphoneVolumeIndicator') as HTMLElement;

speakerVolumeControl.addEventListener('input', () => {
  const volume = parseInt(speakerVolumeControl.value) / 100;
  remoteAudioElement.volume = volume;
  speakerVolumeIndicator.querySelector('.volume-level').style.width = `${volume * 100}%`;
});

microphoneVolumeControl.addEventListener('input', () => {
  const volume = parseInt(microphoneVolumeControl.value) / 100;
  // Assuming there's a way to set microphone volume in your setup
  microphoneVolumeIndicator.querySelector('.volume-level').style.width = `${volume * 100}%`;
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