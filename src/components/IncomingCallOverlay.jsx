import { useEffect } from 'react';
import { Phone, Video, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function IncomingCallOverlay() {
  const { incomingCall, answerIncomingCall, declineIncomingCall } = useAuth();
  const navigate = useNavigate();

  // Play synthesized phone ringtone sound while incoming call exists
  useEffect(() => {
    if (!incomingCall) return;

    let audioCtx = null;
    let timer = null;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const playTonePattern = () => {
        if (!audioCtx || audioCtx.state === 'closed') return;
        try {
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc1.frequency.value = 440;
          osc2.frequency.value = 480;

          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(audioCtx.destination);

          osc1.start();
          osc2.start();
          osc1.stop(audioCtx.currentTime + 1.2);
          osc2.stop(audioCtx.currentTime + 1.2);
        } catch { /* ignore audio play error */ }
      };

      playTonePattern();
      timer = setInterval(playTonePattern, 2400);
    } catch { /* ignore audio setup error */ }

    return () => {
      if (timer) clearInterval(timer);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  var isVideo = incomingCall.call_type === 'video';
  var isGroup = !!(incomingCall.is_group || incomingCall.group_call_id || incomingCall.group_name);
  var displayName = isGroup
    ? (incomingCall.group_name || 'Group Chat')
    : (incomingCall.caller_name || 'Incoming call');
  var subtitle = isGroup
    ? `${incomingCall.caller_name} is calling the group…`
    : (isVideo ? 'Incoming video call…' : 'Incoming voice call…');

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fade-in min-h-screen w-screen">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full mx-auto text-center shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className={`relative w-16 h-16 sm:w-20 sm:h-20 ${isGroup ? 'bg-gradient-to-tr from-emerald-600 to-green-500' : 'bg-gradient-to-tr from-blue-600 to-indigo-500'} rounded-full flex items-center justify-center shadow-lg border-2 border-white/20`}>
              {isGroup ? (
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              ) : isVideo ? (
                <Video className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              ) : (
                <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-bounce" />
              )}
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white truncate px-2">{displayName}</h3>
          <p className="text-emerald-300/90 mt-1.5 text-xs sm:text-sm font-semibold">{subtitle}</p>
          {isGroup && (
            <p className="text-slate-400 mt-1 text-[11px] font-medium">
              {isVideo ? '🎥 Group video call' : '📞 Group voice call'}
            </p>
          )}

          <div className="flex justify-center items-center space-x-3 sm:space-x-5 mt-6 sm:mt-8">
            <button
              type="button"
              onClick={async () => {
                const currentCall = incomingCall;
                answerIncomingCall(currentCall);
                navigate('/chat');

                try {
                  const constraints = isVideo ? { audio: true, video: true } : { audio: true };
                  const stream = await navigator.mediaDevices.getUserMedia(constraints);
                  window.__nstp_preacquired_stream__ = stream;
                } catch (err) {
                  console.warn('Preacquire media stream error:', err);
                }
              }}
              className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 active:scale-95 text-white rounded-2xl font-black flex items-center gap-2 text-xs sm:text-sm touch-manipulation cursor-pointer transition-all shadow-lg shadow-emerald-950/40"
            >
              {isVideo ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <Phone className="w-4 h-4 sm:w-5 sm:h-5" />}
              <span>Answer Call</span>
            </button>

            <button
              type="button"
              onClick={() => declineIncomingCall(incomingCall.id)}
              className="px-4 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 active:scale-95 text-white rounded-2xl font-black flex items-center gap-2 text-xs sm:text-sm touch-manipulation cursor-pointer transition-all shadow-lg shadow-rose-950/40"
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 rotate-[135deg]" />
              <span>Decline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallOverlay;
