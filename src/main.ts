import JsSIP from "jssip";
import { RTCSession } from "jssip/lib/RTCSession";

// Debug-Modus: Auf false setzen zum Deaktivieren
const DEBUG = true;

const server = "wss://pbx.positron-it.de:8089/ws";
const aor = "sip:alice@pbx.positron-it.de";
const destination = "sip:bob@pbx.positron-it.de";
const authorizationUser = "alice";
const password = "12345";

const remoteAudioElement = document.getElementById(
  "remoteAudio",
) as HTMLAudioElement;
const remoteVideoElement = document.getElementById(
  "remoteVideo",
) as HTMLVideoElement;
const localVideoElement = document.getElementById(
  "localVideo",
) as HTMLVideoElement;

remoteVideoElement.autoplay = true;
remoteVideoElement.playsInline = true;

remoteAudioElement.autoplay = true;

localVideoElement.autoplay = true;
localVideoElement.muted = true;
localVideoElement.playsInline = true;

if (!remoteAudioElement || !remoteVideoElement || !localVideoElement) {
  throw new Error("Required media elements not found");
}

// UI elements
const callButton = document.getElementById("callButton") as HTMLButtonElement;
const muteButton = document.getElementById("muteButton") as HTMLButtonElement;
const videoButton = document.getElementById("videoButton") as HTMLButtonElement;
const cameraCheckbox = document.getElementById(
  "cameraCheckbox",
) as HTMLInputElement;

const cameraToggle = document.getElementById("cameraToggle") as HTMLLabelElement;

let currentSession: RTCSession | null = null;
let isCalling = false;
let isMuted = false;
let isVideoMuted = false;
let localStream: MediaStream | null = null;

// Debug-Helper
function debugLog(tag: string, ...args: any[]) {
  if (DEBUG) {
    console.log(`[DEBUG ${tag}]`, ...args);
  }
}

// Helper: reset all buttons to idle state
function resetUI() {
  isCalling = false;
  isMuted = false;
  isVideoMuted = false;
  callButton.textContent = "Anrufen";
  callButton.classList.remove("active");
  callButton.disabled = false;
  muteButton.style.display = "none";
  muteButton.textContent = "Stummschalten";
  muteButton.classList.remove("muted");
  videoButton.style.display = "none";
  videoButton.textContent = "Video stoppen";
  videoButton.classList.remove("video-off");
  cameraToggle.style.display = "flex";
}

// Mute button handler (audio only)
muteButton.addEventListener("click", () => {
  if (!currentSession) return;
  if (!isMuted) {
    currentSession.mute({ audio: true, video: false });
    isMuted = true;
    muteButton.textContent = "Stumm aufheben";
    muteButton.classList.add("muted");
    debugLog("mute", "Audio muted");
  } else {
    currentSession.unmute({ audio: true, video: false });
    isMuted = false;
    muteButton.textContent = "Stummschalten";
    muteButton.classList.remove("muted");
    debugLog("mute", "Audio unmuted");
  }
});

// Video toggle button handler
videoButton.addEventListener("click", () => {
  if (!currentSession) return;
  if (!isVideoMuted) {
    currentSession.mute({ audio: false, video: true });
    isVideoMuted = true;
    videoButton.textContent = "Video starten";
    videoButton.classList.add("video-off");
    debugLog("video", "Video stopped");
  } else {
    currentSession.unmute({ audio: false, video: true });
    isVideoMuted = false;
    videoButton.textContent = "Video stoppen";
    videoButton.classList.remove("video-off");
    debugLog("video", "Video started");
  }
});

// Create JsSIP UserAgent
const socket = new JsSIP.WebSocketInterface(server);
const ua = new JsSIP.UA({
  sockets: [socket],
  uri: aor,
  password,
  authorization_user: authorizationUser,
  register: false,
});

// Debug: JsSIP interne Logs aktivieren
if (DEBUG) {
  localStorage.debug = "JsSIP:*";
  console.log("[DEBUG] JsSIP internal logging enabled (localStorage.debug = 'JsSIP:*')");
}

// Debug: Eingehende SIP-Nachrichten loggen
ua.on("newMessage", (data: any) => {
  debugLog("SIP Rx", data);
});

// Debug: Ausgehende SIP-Nachrichten über den Transport loggen
// Hinweis: localStorage.debug = 'JsSIP:*' loggt SIP-Nachrichten bereits
// Zusätzlich hooken wir uns in den Transport für eigene [DEBUG SIP Tx]-Ausgaben
const origStart = ua.start.bind(ua);
ua.start = function () {
  const result = origStart();
  // Nach start() ist der transport verfügbar
  setTimeout(() => {
    const transport = (ua as any).transport;
    if (transport?.send) {
      const origSend = transport.send.bind(transport);
      transport.send = (data: string) => {
        debugLog("SIP Tx", data);
        return origSend(data);
      };
    }
  }, 0);
  return result;
};

// UA-Level Debug-Events
ua.on("connected", () => debugLog("UA", "WebSocket connected"));
ua.on("disconnected", (data: any) => debugLog("UA", "WebSocket disconnected", data));
ua.on("registered", () => debugLog("UA", "registered"));
ua.on("unregistered", () => debugLog("UA", "unregistered"));
ua.on("registrationFailed", (data: any) => {
  console.error("[DEBUG UA] registration failed", data);
});

// Session events
ua.on("newRTCSession", (data: { session: RTCSession; originator: string }) => {
  const session = data.session;
  currentSession = session;

  debugLog("RTCSession", "newRTCSession fired", {
    originator: data.originator,
    direction: session.direction,
  });

  callButton.textContent = "Verbinde...";
  callButton.disabled = true;

  session.on("accepted", () => {
    debugLog("RTCSession", "accepted", {
      remote_identity: session.remote_identity?.uri?.toString(),
    });
  });

  session.on("confirmed", () => {
    debugLog("RTCSession", "confirmed", {
      remote_identity: session.remote_identity?.uri?.toString(),
    });
    isCalling = true;
    callButton.textContent = "Auflegen";
    callButton.classList.add("active");
    callButton.disabled = false;

    // Show mute & video buttons
    muteButton.style.display = "inline-block";
    videoButton.style.display = "inline-block";

    // Sync mute state from session
    const mutedState = session.isMuted();
    isMuted = mutedState.audio ?? false;
    isVideoMuted = mutedState.video ?? false;
    if (isMuted) {
      muteButton.textContent = "Stumm aufheben";
      muteButton.classList.add("muted");
    }
    if (isVideoMuted) {
      videoButton.textContent = "Video starten";
      videoButton.classList.add("video-off");
    }

    // Hide camera checkbox during call
    cameraToggle.style.display = "none";
  });

  session.on("ended", () => {
    debugLog("RTCSession", "ended", {
      cause: (session as any).end_cause,
    });
    currentSession = null;
    remoteAudioElement.srcObject = null;
    remoteVideoElement.srcObject = null;
    localVideoElement.srcObject = null;
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      localStream = null;
    }
    resetUI();
  });

  session.on("failed", () => {
    debugLog("RTCSession", "failed", {
      cause: (session as any).end_cause,
    });
    currentSession = null;
    remoteAudioElement.srcObject = null;
    remoteVideoElement.srcObject = null;
    localVideoElement.srcObject = null;
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      localStream = null;
    }
    resetUI();
  });

  session.on("sdp", (sdpData: any) => {
    debugLog("RTCSession", "sdp", sdpData);
  });

  // peerconnection: Polling + Event-Listener (fängt beide Fälle ab)
  let peerConnectionAttached = false;

  session.on("peerconnection", (connectionEvent: any) => {
    debugLog("RTCSession", "peerconnection EVENT fired", connectionEvent);
    if (!peerConnectionAttached) {
      attachPeerConnection(session);
    }
  });

  // Polling: Falls das peerconnection-Event schon synchron verpasst wurde
  const waitForConnection = () => {
    if (peerConnectionAttached) return;

    if (session.connection) {
      debugLog("RTCSession", "peerconnection available via POLLING");
      attachPeerConnection(session);
    } else {
      setTimeout(waitForConnection, 100);
    }
  };
  // Starte Polling mit kurzer Verzögerung
  setTimeout(waitForConnection, 10);

  function attachPeerConnection(session: RTCSession) {
    if (peerConnectionAttached) return;
    peerConnectionAttached = true;

    const pc = session.connection!;
    debugLog("RTCPeerConnection", "Attached", {
      iceConnectionState: pc.iceConnectionState,
      iceGatheringState: pc.iceGatheringState,
      signalingState: pc.signalingState,
    });

    // ICE-Verbindungsstatus loggen
    pc.addEventListener("iceconnectionstatechange", () => {
      debugLog("ICE", "iceConnectionState:", pc.iceConnectionState);
    });
    pc.addEventListener("icegatheringstatechange", () => {
      debugLog("ICE", "iceGatheringState:", pc.iceGatheringState);
    });
    pc.addEventListener("signalingstatechange", () => {
      debugLog("SIGNALING", "signalingState:", pc.signalingState);
    });

    pc.addEventListener("track", (event: RTCTrackEvent) => {
      debugLog("TRACK", "Remote track received", {
        kind: event.track.kind,
        streams: event.streams.length,
      });
      event.streams.forEach((stream: MediaStream) => {
        remoteAudioElement.srcObject = stream;
        remoteVideoElement.srcObject = stream;
      });
    });

    // Attach local stream to local video element after getUserMedia completes
    const attachLocalStream = () => {
      const senders = pc.getSenders();
      const videoSender = senders.find(
        (s: RTCRtpSender) => s.track && s.track.kind === "video",
      );
      if (videoSender?.track) {
        const stream = new MediaStream([videoSender.track]);
        localVideoElement.srcObject = stream;
        localStream = stream;
        debugLog("LOCAL", "Local video preview attached");
      } else {
        // Retry after short delay – getUserMedia may still be in progress
        setTimeout(attachLocalStream, 200);
      }
    };
    // Delay initial check to let getUserMedia complete
    setTimeout(attachLocalStream, 500);
  }

  session.on("getusermediafailed", () => {
    console.error("[DEBUG RTCSession] getUserMedia failed");
    callButton.textContent = "Fehler";
    setTimeout(() => {
      callButton.textContent = "Anrufen";
      callButton.disabled = false;
    }, 3000);
  });
});

// Keine Registrierung (register: false), daher sofort nach ua.start() bereit
callButton.disabled = false;

ua.start();
debugLog("UA", "ua.start() called");

// Fallback: Falls Browser-Autoplay trotz User-Gesture blockiert,
// kann der Nutzer per Klick aufs Video die Audio-Wiedergabe starten.
remoteVideoElement.addEventListener("click", () => {
  remoteVideoElement.play().catch((e: Error) =>
    console.warn("Video play on click also blocked:", e));
});

// Call button handler – simplified, events are already set up via newRTCSession
callButton.addEventListener("click", () => {
  if (!isCalling) {
    callButton.disabled = true;
    callButton.textContent = "Verbinde...";

    debugLog("CALL", "Initiating call to", destination, {
      audio: true,
      video: cameraCheckbox.checked,
    });

    // Play-Erlaubnis jetzt holen, solange wir in der User-Action-Kette sind.
    // Später im track-Event reicht dann srcObject = stream, um Audio zu starten.
    remoteVideoElement.play().catch(() => {
      // Wird erwartungsgemäß rejected (noch kein srcObject), aber die
      // User-Gesture wird registriert.
    });

    try {
      ua.call(destination, {
        mediaConstraints: {
          audio: true,
          video: cameraCheckbox.checked,
        },
        rtcConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: true },
      });
    } catch (error) {
      console.error("[DEBUG CALL] Failed to initiate call:", error);
      callButton.textContent = "Fehler";
      setTimeout(() => {
        callButton.textContent = "Anrufen";
        callButton.disabled = false;
      }, 3000);
    }
  } else {
    // Hangup
    debugLog("CALL", "Hanging up");
    if (currentSession) {
      currentSession.terminate();
    }
  }
});