import { callsAPI } from '../services/api';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function formatCallDuration(totalSeconds) {
  var seconds = Math.max(0, Math.floor(totalSeconds || 0));
  var h = Math.floor(seconds / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = seconds % 60;
  if (h > 0) {
    return h + ' hr ' + m + ' min ' + s + ' sec';
  }
  if (m > 0) {
    return m + ' min ' + s + ' sec';
  }
  return s + ' sec';
}

function parseIceList(value) {
  if (!value) return [];
  try {
    var arr = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

export function createWebRTCCallManager(options) {
  var callId = options.callId;
  var isCaller = options.isCaller;
  var callType = options.callType;
  var onRemoteStream = options.onRemoteStream;

  var pc = null;
  var localStream = null;
  var pollTimer = null;
  var appliedAnswer = false;
  var appliedOffer = false;
  var seenIceKeys = {};

  function mediaConstraints() {
    if (callType === 'video') {
      return {
        audio: true,
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      };
    }
    return { audio: true, video: false };
  }

  async function start() {
    localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints());
    pc = new RTCPeerConnection(ICE_SERVERS);

    localStream.getTracks().forEach(function(track) {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = function(event) {
      if (event.streams && event.streams[0] && onRemoteStream) {
        onRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = function(event) {
      if (event.candidate) {
        callsAPI.sendIce(callId, event.candidate.toJSON()).catch(function() {});
      }
    };

    return localStream;
  }

  async function applyRemoteIce(candidates) {
    if (!pc) return;
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      var key = JSON.stringify(c);
      if (seenIceKeys[key]) continue;
      seenIceKeys[key] = true;
      try {
        await pc.addIceCandidate(c);
      } catch (e) {
        /* ignore duplicate or early candidates */
      }
    }
  }

  async function handleSignaling(data) {
    if (!pc || !data) return;

    if (!isCaller && !appliedOffer && data.offer_sdp) {
      var offer = typeof data.offer_sdp === 'string' ? JSON.parse(data.offer_sdp) : data.offer_sdp;
      await pc.setRemoteDescription(offer);
      appliedOffer = true;
      var answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await callsAPI.sendAnswer(callId, answer);
    }

    if (isCaller && !appliedAnswer && data.answer_sdp) {
      var remoteAnswer = typeof data.answer_sdp === 'string' ? JSON.parse(data.answer_sdp) : data.answer_sdp;
      await pc.setRemoteDescription(remoteAnswer);
      appliedAnswer = true;
    }

    var remoteIce = isCaller ? parseIceList(data.receiver_ice) : parseIceList(data.caller_ice);
    await applyRemoteIce(remoteIce);
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(function() {
      callsAPI.getWebRTCSignaling(callId)
        .then(handleSignaling)
        .catch(function() {});
    }, 1000);
  }

  async function runCaller() {
    var offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await callsAPI.sendOffer(callId, offer);
    startPolling();
  }

  async function runReceiver() {
    startPolling();
    try {
      var data = await callsAPI.getWebRTCSignaling(callId);
      await handleSignaling(data);
    } catch (e) {
      /* will retry on poll */
    }
  }

  function destroy() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(function(track) { track.stop(); });
      localStream = null;
    }
    if (pc) {
      pc.close();
      pc = null;
    }
    seenIceKeys = {};
  }

  return {
    start: start,
    runCaller: runCaller,
    runReceiver: runReceiver,
    destroy: destroy,
    getLocalStream: function() { return localStream; }
  };
}
