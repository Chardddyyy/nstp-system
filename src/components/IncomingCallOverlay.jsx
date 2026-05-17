import { Phone, Video } from 'lucide-react';
import { useAuth } from '../App';

function IncomingCallOverlay() {
  const { incomingCall, answerIncomingCall, declineIncomingCall } = useAuth();

  if (!incomingCall) return null;

  var isVideo = incomingCall.call_type === 'video';

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[10000] p-4">
      <div className="bg-gray-900 rounded-lg p-6 sm:p-8 max-w-md w-full mx-auto text-center">
        <div className="mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-pulse">
            {isVideo ? (
              <Video className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            ) : (
              <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white">
            {incomingCall.caller_name || 'Incoming call'}
          </h3>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">
            {isVideo ? 'Incoming video call…' : 'Incoming voice call…'}
          </p>
        </div>
        <div className="flex justify-center space-x-4 sm:space-x-6 mt-4 sm:mt-6">
          <button
            type="button"
            onClick={() => answerIncomingCall(incomingCall)}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium flex items-center gap-2"
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            Answer
          </button>
          <button
            type="button"
            onClick={() => declineIncomingCall(incomingCall.id)}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium flex items-center gap-2"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallOverlay;
