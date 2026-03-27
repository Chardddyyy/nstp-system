import { useAuth } from '../App';
import { 
  LayoutDashboard, Users, FileText, MessageSquare, 
  LogOut, User, ChevronLeft, ChevronRight, Send, Search,
  Phone, Video, MoreVertical, Paperclip, Smile,
  Mic, Camera, Image, X, Download, Edit3, Pencil, Type,
  Play, Menu, ArrowLeft, Users as UsersIcon, Plus, MicOff, Calendar,
  Volume2, VolumeX
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo } from 'react';

// Avatar options for display
const AVATAR_OPTIONS = {
  default: { color: 'bg-gray-400', icon: '👤' },
  green: { color: 'bg-green-500', icon: '🎓' },
  blue: { color: 'bg-blue-500', icon: '👨‍🏫' },
  purple: { color: 'bg-purple-500', icon: '👩‍🏫' },
  red: { color: 'bg-red-500', icon: '👮' },
  yellow: { color: 'bg-yellow-500', icon: '⭐' },
};

// Emoji list for reactions
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

// Image compression utility
const compressImage = (dataUrl, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to compressed JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

function Chat() {
  const { user, logout, allUsers, conversations, messages, startConversation, sendMessage, getUserConversations, editMessage, deleteMessage, addReaction, deleteConversation, clearMessages } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const messagesEndRef = useRef(null);

  const [activeConversationId, setActiveConversationId] = useState(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem('nstp_active_chat');
    return saved ? saved : null;
  });
  const [readConversations, setReadConversations] = useState(() => {
    // Load read state from localStorage
    const saved = localStorage.getItem('nstp_read_conversations');
    return saved ? JSON.parse(saved) : {};
  });
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showContacts, setShowContacts] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  
  // Group chat state
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesContainerRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Voice recording refs and state
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(null); // message id being played
  const audioPlayerRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !activeConversation) return;
    
    // Check if blocked
    if (isBlocked) {
      addNotification('You cannot send messages to this user while they are blocked. Unblock them first.', 'error');
      return;
    }
    
    sendMessage(activeConversation.id, {
      sender: 'me',
      text: messageText
    });
    setMessageText('');
  };

  const handleStartConversation = (contact) => {
    const conv = startConversation(contact);
    setActiveConversationId(conv.id);
    setShowContacts(false);
    setShowConversations(false); // Hide conversations list on mobile when chat opens
  };

  const handleCreateGroupChat = () => {
    if (!groupName.trim() || selectedParticipants.length < 2) {
      addNotification('Please enter a group name and select at least 2 participants', 'error');
      return;
    }

    const groupConversation = {
      id: `group_${Date.now()}`,
      isGroup: true,
      name: groupName,
      participants: [user.id, ...selectedParticipants],
      createdAt: new Date().toISOString(),
      lastMessage: null
    };

    // Add to conversations (this would need to be handled in the auth context)
    setActiveConversationId(groupConversation.id);
    setShowGroupChatModal(false);
    setGroupName('');
    setSelectedParticipants([]);
    setShowContacts(false);
    setShowConversations(false);
    addNotification('Group chat created successfully!', 'success');
  };

  const toggleParticipantSelection = (participantId) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId) 
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const getGroupAvatar = (conversation) => {
    if (!conversation?.isGroup) return null;
    
    // Use participantDetails if available from backend, otherwise fallback to allUsers lookup
    let participantUsers = [];
    
    if (conversation.participantDetails && conversation.participantDetails.length > 0) {
      // Use detailed participant info from backend
      participantUsers = conversation.participantDetails.slice(0, 4);
    } else if (conversation.participants && conversation.participants.length > 0) {
      // Fallback: lookup from allUsers
      participantUsers = conversation.participants
        .map(id => allUsers.find(u => u.id === id))
        .filter(Boolean)
        .slice(0, 4);
    }

    if (participantUsers.length === 0) {
      // Default group avatar
      const groupName = conversation.groupName || conversation.group_name || conversation.name || 'G';
      return (
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {groupName.charAt(0).toUpperCase()}
        </div>
      );
    }

    // Show combined avatars for group chats - display up to 3 avatars in a cluster
    return (
      <div className="w-10 h-10 relative flex items-center justify-center">
        {participantUsers.slice(0, 3).map((participant, index) => {
          // Position avatars in a triangular/cluster formation
          const positions = [
            { top: '0px', left: '2px' },    // top left
            { top: '0px', right: '2px' },   // top right  
            { bottom: '0px', left: '50%', transform: 'translateX(-50%)' } // bottom center
          ];
          const pos = positions[index] || { top: '0px', left: '0px' };
          
          // Check if participant has profile picture
          if (participant?.profilePicture) {
            return (
              <img
                key={participant?.id || index}
                src={participant.profilePicture}
                alt={participant?.name || 'User'}
                className="absolute w-5 h-5 rounded-full border border-white shadow-sm object-cover"
                style={pos}
                title={participant?.name || 'User'}
              />
            );
          }
          
          // Fallback to colored avatar with icon
          const avatar = AVATAR_OPTIONS[participant?.avatar || 'default'] || AVATAR_OPTIONS.default;
          return (
            <div
              key={participant?.id || index}
              className={`absolute w-5 h-5 ${avatar.color} rounded-full flex items-center justify-center text-[10px] border border-white shadow-sm`}
              style={pos}
              title={participant?.name || 'User'}
            >
              {avatar.icon}
            </div>
          );
        })}
        {(conversation.participants?.length > 3 || conversation.participantDetails?.length > 3) && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-[9px] text-white border border-white shadow-sm">
            +{(conversation.participants?.length || conversation.participantDetails?.length || 0) - 3}
          </div>
        )}
      </div>
    );
  };

  // Create instructor/admin group chat
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'instructor')) {
      const instructorsAndAdmin = allUsers.filter(u => u.role === 'admin' || u.role === 'instructor');
      
      // Check if group chat already exists
      const existingGroupChat = conversations.find(c => 
        c.isGroup && 
        c.name === 'Instructor & Admin Group' &&
        c.participants.includes(user.id)
      );
      
      if (!existingGroupChat && instructorsAndAdmin.length > 1) {
        // Group chat creation will be handled by App context
        // This prevents console spam
      }
    }
  }, [user, allUsers, conversations]);

  const handleSetActiveConversation = (id) => {
    setActiveConversationId(id);
    setShowConversations(false); // Hide conversation list on mobile when chat opens
    setSidebarOpen(false); // Close main navigation sidebar
    
    // Mark conversation as read
    setReadConversations(prev => {
      const updated = { ...prev, [id]: Date.now() };
      localStorage.setItem('nstp_read_conversations', JSON.stringify(updated));
      return updated;
    });
  };

  const handleBackToConversations = () => {
    setActiveConversationId(null);
    setShowConversations(true);
    setSidebarOpen(false);
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file && activeConversation) {
      // Limit file size to 50MB for server compatibility
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        addNotification('File too large. Maximum 50MB allowed.', 'error');
        e.target.value = '';
        return;
      }
      
      addNotification('Uploading file...', 'info');
      
      try {
        // Read file as base64 for download capability
        const fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
        
        // Send file message to backend
        await sendMessage(activeConversation.id, {
          sender: 'me',
          text: `📎 File: ${file.name}`,
          type: 'file',
          fileName: file.name,
          fileSize: file.size,
          fileUrl: fileData,
          fileType: file.type
        });
        
        addNotification('File sent!', 'success');
      } catch (error) {
        console.error('File upload error:', error);
        addNotification('Failed to send file. Please try again.', 'error');
      }
    }
    e.target.value = '';
  };

  const handleGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleGallerySelect = async (e) => {
    const file = e.target.files[0];
    if (file && activeConversation) {
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const imageData = event.target.result;
          
          // Compress image before sending
          addNotification('Compressing image...', 'info');
          const compressedImage = await compressImage(imageData, 800, 800, 0.7);
          
          await sendMessage(activeConversation.id, {
            sender: 'me',
            text: '📸 Photo',
            type: 'image',
            imageUrl: compressedImage,
            created_at: new Date().toISOString(),
            timestamp: new Date().toISOString()
          });
          addNotification('Photo sent!', 'success');
        };
        reader.onerror = () => {
          addNotification('Failed to read image', 'error');
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Image compression error:', error);
        addNotification('Failed to compress image', 'error');
      }
    }
    e.target.value = '';
  };

  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setShowCameraModal(true);
    } catch (err) {
      alert('Could not access camera. Please allow camera access.');
      console.error('Error accessing camera:', err);
    }
  };

  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setShowCameraModal(false);
    setCapturedPhoto(null);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoData = canvas.toDataURL('image/png');
    setCapturedPhoto(photoData);
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
  };

  const handleSendPhoto = async () => {
    if (!capturedPhoto || !activeConversation) return;
    
    try {
      addNotification('Sending photo...', 'info');
      
      // Send without compression - just use the captured photo directly
      await sendMessage(activeConversation.id, {
        sender: 'me',
        text: '📸 Camera Photo',
        type: 'image',
        imageUrl: capturedPhoto
      });
      addNotification('Photo sent!', 'success');
    } catch (error) {
      console.error('Photo send error:', error);
      addNotification('Failed to send photo', 'error');
    }
    
    handleCloseCamera();
  };

  const handleCameraCapture = async (e) => {
    const file = e.target.files[0];
    if (file && activeConversation) {
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const imageData = event.target.result;
          
          // Compress image before sending
          addNotification('Compressing photo...', 'info');
          const compressedImage = await compressImage(imageData, 800, 800, 0.7);
          
          await sendMessage(activeConversation.id, {
            sender: 'me',
            text: '📸 Camera Photo',
            type: 'image',
            imageUrl: compressedImage
          });
          addNotification('Photo sent!', 'success');
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Camera capture compression error:', error);
        addNotification('Failed to compress photo', 'error');
      }
    }
    e.target.value = '';
  };

  const handleVoiceToggle = async () => {
    if (isBlocked) {
      addNotification('You cannot send voice messages while this user is blocked.', 'error');
      return;
    }
    
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Try to use a supported MIME type
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4';
        
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        let recordingDuration = 0;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          // Get the final duration
          const finalDuration = recordingDuration;
          
          // Create blob from chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
          // Auto-send voice message if we recorded something
          if (activeConversation && finalDuration > 0) {
            // Convert blob to base64 for persistence
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Audio = reader.result; // This is a data URL (e.g., data:audio/webm;base64,...)
              
              // Convert duration to readable format
              const formattedDuration = finalDuration < 60 
                ? `${finalDuration}s` 
                : `${Math.floor(finalDuration / 60)}:${(finalDuration % 60).toString().padStart(2, '0')}`;
              
              sendMessage(activeConversation.id, {
                sender: 'me',
                text: `🎤 Voice message (${formattedDuration})`,
                type: 'voice',
                duration: formattedDuration,
                audioUrl: base64Audio, // Store as base64 data URL for persistence
                audioBlob: audioBlob // Keep blob reference for compatibility
              });
              
              addNotification('Voice message sent!', 'success');
            };
            reader.readAsDataURL(audioBlob);
          }
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          setRecordingTime(0);
        };

        // Start recording with 100ms timeslice to capture data
        mediaRecorder.start(100);
        setIsRecording(true);
        setRecordingTime(0);
        recordingDuration = 0;
        
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(prev => {
            recordingDuration = prev + 1;
            return recordingDuration;
          });
        }, 1000);
      } catch (err) {
        alert('Could not access microphone. Please allow microphone access.');
        console.error('Error accessing microphone:', err);
      }
    }
  };

  const handlePlayVoice = (message) => {
    // Get audio URL from various possible field names
    let audioUrl = message.audioUrl || message.audio_url;
    
    if (!audioUrl) {
      addNotification('Voice message not available', 'error');
      return;
    }
    
    // Check if it's a blob URL that might have expired
    if (audioUrl.startsWith('blob:')) {
      console.warn('Blob URL may have expired, trying to use data URL instead');
      // Try to find alternative audio source or notify user
      addNotification('Voice message expired (blob URL)', 'error');
      return;
    }
    
    // For data URLs, we can use them directly
    // For other URLs, try to use as-is
    const playableUrl = audioUrl;
    
    if (isPlaying === message.id) {
      // Stop playing
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      setIsPlaying(null);
    } else {
      // Start playing
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      try {
        const audio = new Audio(playableUrl);
        audioPlayerRef.current = audio;
        
        // Handle errors
        audio.onerror = (e) => {
          console.error('Audio error:', e);
          addNotification('Voice message format not supported', 'error');
          setIsPlaying(null);
          audioPlayerRef.current = null;
        };
        
        // Try to play
        audio.play().then(() => {
          console.log('Voice message playing');
        }).catch(err => {
          console.error('Failed to play voice message:', err);
          addNotification('Cannot play voice message', 'error');
          setIsPlaying(null);
          audioPlayerRef.current = null;
        });
        
        setIsPlaying(message.id);
        audio.onended = () => {
          setIsPlaying(null);
          audioPlayerRef.current = null;
        };
      } catch (err) {
        console.error('Error creating audio player:', err);
        addNotification('Voice message unavailable', 'error');
      }
    }
  };

  const [showCallModal, setShowCallModal] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [callStatus, setCallStatus] = useState('calling');
  const [activeCallStartTime, setActiveCallStartTime] = useState(null);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isCameraVideoOff, setIsCameraVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [videoCallStatus, setVideoCallStatus] = useState('calling');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);

  // Image viewer and editor state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [isViewerEditing, setIsViewerEditing] = useState(false);
  const imageEditorCanvasRef = useRef(null);
  const viewerCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editorTool, setEditorTool] = useState('draw'); // 'draw', 'text'
  const [editorColor, setEditorColor] = useState('#000000');
  const [editorText, setEditorText] = useState('');
  const [textPosition, setTextPosition] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedBy, setBlockedBy] = useState(null);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [incomingCallType, setIncomingCallType] = useState(null); // 'voice' or 'video'
  const [callerInfo, setCallerInfo] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDanger: false
  });

  const handleCall = async () => {
    if (isBlocked) {
      addNotification('You cannot call this user while they are blocked.', 'error');
      return;
    }
    
    try {
      // Show outgoing call modal
      setShowCallModal(true);
      setCallStatus('calling');
      addNotification(`Calling ${activeConversation?.with}...`, 'call');
      
      // Play ringing sound - krruuuu kruuuu kruuu style using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const playRingTone = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 440; // A4 note
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.6);
      };
      
      // Ring pattern: krruuuu (long) - pause - kruuuu (medium) - pause - kruuuu (medium)
      let ringCount = 0;
      const ringPattern = [600, 800, 500, 800, 500]; // durations in ms
      
      const scheduleRing = () => {
        if (!showCallModal || callStatus !== 'calling') return;
        if (ringCount >= ringPattern.length) ringCount = 0;
        
        if (ringCount % 2 === 0) {
          // Play tone
          playRingTone();
        }
        
        setTimeout(() => {
          ringCount++;
          scheduleRing();
        }, ringPattern[ringCount]);
      };
      
      // Start the ringing pattern
      scheduleRing();
      
      // Simulate waiting for answer (in real app, this would be socket event)
      // For demo, auto-answer after 5 seconds
      setTimeout(async () => {
        // Stop ringing
        audioContext.close();
        
        // Only proceed if call is still active (not declined/ended)
        if (!showCallModal || callStatus !== 'calling') return;
        
        // Simulate other person answered
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setLocalStream(stream);
          setCallStatus('connected');
          const callStartTime = Date.now();
          setActiveCallStartTime(callStartTime); // Set activeCallStartTime
          addNotification('Call connected!', 'success');
          
          // Store call start time for duration calculation
          setActiveCallStartTime(callStartTime);
        } catch (err) {
          addNotification('Could not access microphone', 'error');
          setShowCallModal(false);
        }
      }, 5000);
    } catch (err) {
      addNotification('Could not start call', 'error');
    }
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setShowCallModal(false);
    setCallStatus('ended');
    
    // Send missed call or call duration message
    if (activeConversation && callStatus === 'calling') {
      // Missed call - not answered
      sendMessage(activeConversation.id, {
        sender: 'me',
        text: '📞 Missed call',
        type: 'system',
        callType: 'voice',
        answered: false
      });
    } else if (activeConversation && callStatus === 'connected' && activeCallStartTime) {
      // Call ended - show duration
      const duration = Math.floor((Date.now() - activeCallStartTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const durationText = minutes > 0 
        ? `${minutes}:${seconds.toString().padStart(2, '0')} min` 
        : `${seconds} sec`;
      
      sendMessage(activeConversation.id, {
        sender: 'me',
        text: `📞 Call ended • ${durationText}`,
        type: 'system',
        callType: 'voice',
        answered: true,
        duration: durationText
      });
    }
    
    setLocalStream(null);
    setActiveCallStartTime(null);
  };

  const handleVideoCall = async () => {
    if (isBlocked) {
      addNotification('You cannot video call this user while they are blocked.', 'error');
      return;
    }
    
    try {
      // Show outgoing video call modal
      setShowVideoCallModal(true);
      setVideoCallStatus('calling');
      addNotification(`Video calling ${activeConversation?.with}...`, 'call');
      
      // Get local video stream immediately so user can see themselves while ringing
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        addNotification('Could not access camera/microphone', 'error');
        setShowVideoCallModal(false);
        return;
      }
      
      // Play ringing sound
      const ringtone = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      ringtone.loop = true;
      ringtone.volume = 0.3;
      ringtone.play().catch(err => console.log('Audio play failed:', err));
      
      // Simulate waiting for answer (in real app, this would be socket event)
      // For demo, auto-answer after 5 seconds
      setTimeout(async () => {
        // Stop ringing
        ringtone.pause();
        ringtone.currentTime = 0;
        
        // Only proceed if video call is still active (not declined/ended)
        if (!showVideoCallModal || videoCallStatus !== 'calling') return;
        
        setVideoCallStatus('connected');
        addNotification('Video call connected!', 'success');
      }, 5000);
    } catch (err) {
      addNotification('Could not start video call', 'error');
    }
  };

  const handleEndVideoCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setShowVideoCallModal(false);
    setVideoCallStatus('ended');
    setLocalStream(null);
  };

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiList = ['😊', '👍', '❤️', '😂', '🎉', '👏', '🔥', '✅', '🙏', '😎', '🤔', '👋', '🌟', '💪', '✨', '🎵', '📸', '🎁', '🍕', '☕', '🌈', '🌺', '🌞', '💯', '🆗', '🎊', '🎈', '🎀', '🎄', '🎃', '🎅', '🤶', '🦃', '🐰', '🐣', '🌸', '🌼', '🌻', '🌹', '🌷', '🌱', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍄', '🌰', '🦋', '🐛', '🐝', '🐞', '🐜', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦛', '🐪', '🐫', '🦙', '🦒', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'];
  const [selectedEmoji, setSelectedEmoji] = useState(null);

  const handleEmojiSelect = (emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleStartEdit = (message) => {
    setEditingMessage(message);
    setEditText(message.text);
    setShowMessageMenu(null);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editingMessage) {
      editMessage(activeConversation.id, editingMessage.id, editText);
      setEditingMessage(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  const handleDelete = (messageId, forEveryone) => {
    deleteMessage(activeConversation.id, messageId, forEveryone);
    setShowMessageMenu(null);
  };

  const handleReaction = (messageId, emoji) => {
    addReaction(activeConversation.id, messageId, emoji);
    setShowEmojiPicker(null);
  };

  const isMessageDeletedForMe = (message) => {
    return message.deletedFor?.includes(user?.id);
  };

  const isMessageDeletedForEveryone = (message) => {
    return message.deleted_for_everyone === true || message.deleted_for_everyone === 1 || message.type === 'deleted';
  };

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsNearBottom(isBottom);
  };

  // Set camera stream to video element when modal opens
  useEffect(() => {
    if (showCameraModal && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCameraModal, cameraStream]);

  // Save active conversation ID to localStorage whenever it changes
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem('nstp_active_chat', activeConversationId);
    }
  }, [activeConversationId]);

  // Helper function to get the correct conversation partner name
  const getConversationPartnerName = (conversation) => {
    if (!conversation || !user) return '';
    
    // If it's a group chat, return the group name
    if (conversation.isGroup) {
      return conversation.groupName || conversation.group_name || conversation.name || 'Group Chat';
    }
    
    // Find the other participant for private chat
    const otherParticipantId = conversation.participants?.find(id => id !== user.id);
    if (!otherParticipantId) return conversation.with || '';
    // Look up the user's current name from allUsers
    const otherUser = allUsers.find(u => u.id === otherParticipantId);
    return otherUser?.name || conversation.with || '';
  };

  // Get the user object for conversation partner
  const getConversationPartner = (conversation) => {
    if (!conversation || !user) return null;
    const otherParticipantId = conversation.participants?.find(id => id !== user.id);
    if (!otherParticipantId) return null;
    return allUsers.find(u => u.id === otherParticipantId);
  };

  // Get the correct partner name for active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const activePartnerName = getConversationPartnerName(activeConversation);

  // Get messages for active conversation - MUST be declared AFTER activeConversation
  const currentMessages = activeConversation ? (messages[activeConversation.id] || []) : [];

  // Scroll to bottom on initial load and when sending messages
  useEffect(() => {
    // Only auto-scroll if user is near bottom or when they send a message
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [currentMessages.length]);

  // Get user's own conversations only (private)
  const userConversations = getUserConversations();

  const filteredConversations = userConversations.filter(c => 
    c.with.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get contacts (all users except current user)
  const contacts = allUsers.filter(u => u.id !== user?.id);

  // Image viewer and editor handlers
  const handleImageClick = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setImageViewerOpen(true);
  };

  const handleCloseImageViewer = () => {
    setImageViewerOpen(false);
    setSelectedImageUrl(null);
  };

  const handleDownloadImage = () => {
    if (!selectedImageUrl) return;
    const link = document.createElement('a');
    link.href = selectedImageUrl;
    link.download = `image_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('Image downloaded!', 'success');
  };

  const handleOpenImageEditor = () => {
    setShowImageEditor(true);
    setIsViewerEditing(true);
    // Load image onto canvas with visible background
    setTimeout(() => {
      const canvas = imageEditorCanvasRef.current;
      if (!canvas || !selectedImageUrl) return;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        // Draw the image as background
        ctx.drawImage(img, 0, 0);
      };
      img.crossOrigin = 'anonymous';
      img.src = selectedImageUrl;
    }, 100);
  };

  const handleCloseImageEditor = () => {
    setShowImageEditor(false);
    setIsViewerEditing(false);
    setEditorTool('draw');
    setEditorText('');
    setTextPosition(null);
  };

  const handleDeleteConversation = () => {
    if (!activeConversation) return;
    setConfirmModalData({
      title: 'Delete Conversation',
      message: `Delete conversation with ${activeConversation.with}? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: () => {
        deleteConversation(activeConversation.id);
        setActiveConversationId(null);
        setShowChatMenu(false);
        addNotification('Conversation deleted', 'success');
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleClearChat = () => {
    if (!activeConversation) return;
    setConfirmModalData({
      title: 'Clear Chat',
      message: `Clear all messages with ${activeConversation.with}?`,
      confirmText: 'Clear',
      cancelText: 'Cancel',
      isDanger: false,
      onConfirm: () => {
        clearMessages(activeConversation.id);
        setShowChatMenu(false);
        addNotification('Chat cleared', 'success');
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleBlockUser = () => {
    if (!activeConversation) return;
    if (isBlocked) {
      // Unblock
      setConfirmModalData({
        title: 'Unblock User',
        message: `Unblock ${activeConversation.with}?`,
        confirmText: 'Unblock',
        cancelText: 'Cancel',
        isDanger: false,
        onConfirm: () => {
          setIsBlocked(false);
          setBlockedBy(null);
          setShowChatMenu(false);
          addNotification('User unblocked', 'success');
          setShowConfirmModal(false);
        }
      });
    } else {
      // Block
      setConfirmModalData({
        title: 'Block User',
        message: `Block ${activeConversation.with}? They won't be able to message or call you, and you won't be able to message or call them until you unblock.`,
        confirmText: 'Block',
        cancelText: 'Cancel',
        isDanger: true,
        onConfirm: () => {
          setIsBlocked(true);
          setBlockedBy(user?.id);
          setShowChatMenu(false);
          addNotification('User blocked', 'success');
          setShowConfirmModal(false);
        }
      });
    }
    setShowConfirmModal(true);
  };

  const handleCanvasMouseDown = (e) => {
    const canvas = imageEditorCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (editorTool === 'draw') {
      setIsDrawing(true);
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = editorColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
    } else if (editorTool === 'text') {
      setTextPosition({ x, y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || editorTool !== 'draw') return;
    const canvas = imageEditorCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const handleAddTextToCanvas = () => {
    if (!editorText.trim() || !textPosition) return;
    const canvas = imageEditorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.font = '24px Arial';
    ctx.fillStyle = editorColor;
    ctx.fillText(editorText, textPosition.x, textPosition.y);
    setEditorText('');
    setTextPosition(null);
  };

  const handleSendEditedImage = () => {
    const canvas = imageEditorCanvasRef.current;
    if (!canvas || !activeConversation) return;
    const editedImageUrl = canvas.toDataURL('image/png');
    sendMessage(activeConversation.id, {
      sender: 'me',
      text: '📷 Edited Image',
      type: 'image',
      imageUrl: editedImageUrl
    });
    handleCloseImageEditor();
    addNotification('Edited image sent!', 'success');
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, [cameraStream]);

  // Set camera stream to video element when modal opens
  useEffect(() => {
    if (showCameraModal && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCameraModal, cameraStream]);

  // Save active conversation ID to localStorage whenever it changes
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem('nstp_active_chat', activeConversationId);
    }
  }, [activeConversationId]);

  // Get user online status
  const getUserStatus = (userId) => {
    // In a real app, this would check from backend or websocket
    // For now, randomly show some users as offline for demo purposes
    const userStatuses = {
      1: 'online', // Current user
      2: 'online',
      3: 'offline',
      4: 'online',
    };
    return userStatuses[userId] || 'offline';
  };

  const getLastSeen = (userId) => {
    // Simulated last seen times
    const lastSeenTimes = {
      3: '2 mins ago',
    };
    return lastSeenTimes[userId] || 'recently';
  };

  const getAvatarColor = (dept) => {
    switch(dept) {
      case 'ROTC': return 'bg-red-500';
      case 'LTS': return 'bg-purple-500';
      case 'CWTS': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  // Simple notification system
  const addNotification = (message, type = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Helper function to format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return formatTime(dateString);
    }
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + formatTime(dateString);
    }
    // Otherwise show date
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options) + ' ' + formatTime(dateString);
  };

  // Get user avatar display
  const getUserAvatar = (u) => {
    if (u?.profilePicture) {
      return (
        <img 
          src={u.profilePicture} 
          alt="Profile" 
          className="w-10 h-10 object-cover rounded-full"
        />
      );
    }
    const avatar = AVATAR_OPTIONS[u?.avatar || 'default'] || AVATAR_OPTIONS.default;
    return (
      <div className={`w-10 h-10 ${avatar.color} rounded-full flex items-center justify-center text-lg`}>
        {avatar.icon}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm min-w-[300px] max-w-[400px] ${
              n.type === 'success' ? 'bg-green-500' : 
              n.type === 'error' ? 'bg-red-500' : 'bg-gray-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <p className="font-medium">{n.message}</p>
              <button 
                onClick={() => removeNotification(n.id)} 
                className="ml-2 text-white/70 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-green-800 text-white p-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-green-700 rounded-lg transition-colors touch-manipulation"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <MessageSquare className="w-5 h-5" />
          <span className="font-bold text-sm">Messages</span>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-green-800 text-white shadow-xl z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-green-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-8 h-8" />
              <div>
                <h1 className="font-bold text-lg">National Service Training Program</h1>
                <p className="text-xs text-green-200">Messages</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-green-700 rounded-lg transition-colors lg:hidden"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button 
            onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              (user?.role === 'admin' && location.pathname === '/admin/dashboard') || 
              (user?.role === 'instructor' && location.pathname === '/instructor/dashboard') 
              ? 'bg-green-700' : 'hover:bg-green-700/50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => navigate('/students')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span>Students</span>
          </button>
          <button 
            onClick={() => navigate('/reports')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span>Reports</span>
          </button>
          <button 
            onClick={() => navigate('/chat')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-green-700"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Messages</span>
          </button>
          <button 
            onClick={() => navigate('/calendar')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span>Calendar</span>
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-700">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors bg-red-500 text-white"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'lg:ml-64' : ''} h-screen flex flex-col lg:flex-row`}>
        {/* Conversations List - Hidden on mobile when chat is active */}
        <div className={`${showConversations ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 bg-white border-r border-gray-200 flex-col h-[calc(100vh-48px)] lg:h-screen`}>
          <div className="p-3 lg:p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {/* Hamburger menu to toggle conversations list */}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSidebarOpen(!sidebarOpen);
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0 touch-manipulation cursor-pointer"
                  style={{ cursor: 'pointer', zIndex: 10 }}
                  title="Toggle menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-lg lg:text-xl font-bold text-gray-800">Messages</h2>
              </div>
              <button 
                onClick={() => setShowContacts(!showContacts)}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors touch-manipulation"
              >
                {showContacts ? 'Back' : 'New Chat'}
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
              <input
                type="text"
                placeholder={showContacts ? "Search contacts..." : "Search conversations..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 lg:pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {showContacts ? (
              // Show Contacts List
              <>
                <div className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-600">
                  {isAdmin ? 'Instructors' : 'Admin & Other Instructors'}
                </div>
                {contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleStartConversation(contact)}
                    className="w-full p-3 lg:p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100 active:bg-gray-100 touch-manipulation"
                  >
                    {getUserAvatar(contact)}
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="font-medium text-gray-800 text-sm lg:text-base truncate">{contact.name}</h3>
                      <p className="text-xs lg:text-sm text-gray-500 truncate">{contact.department} {contact.role === 'admin' ? '(Admin)' : '(Instructor)'}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">Click to chat</span>
                  </button>
                ))}
              </>
            ) : (
              // Show Conversations List
              <>
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No conversations yet</p>
                    <div className="mt-4 space-y-2">
                      <button 
                        onClick={() => setShowContacts(true)}
                        className="block w-full text-green-600 hover:text-green-700 text-sm"
                      >
                        Start a new conversation
                      </button>
                      <button 
                        onClick={() => setShowGroupChatModal(true)}
                        className="block w-full text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Create a group chat
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => {
                    const partner = getConversationPartner(conversation);
                    const conversationMessages = messages[conversation.id] || [];
                    const lastReadTime = readConversations[conversation.id] || 0;
                    
                    // Count unread messages (messages that arrived after last read time and not from current user)
                    const unreadCount = conversationMessages.filter(msg => {
                      const msgTime = new Date(msg.created_at || msg.timestamp || Date.now()).getTime();
                      const isOwnMessage = msg.senderId === user?.id || msg.sender_id === user?.id;
                      return msgTime > lastReadTime && !isOwnMessage;
                    }).length;
                    
                    // Check if there are new messages (red dot indicator)
                    const hasNewMessages = unreadCount > 0 && activeConversationId !== conversation.id;
                    
                    return (
                      <button
                        type="button"
                        key={conversation.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSetActiveConversation(conversation.id);
                        }}
                        className={`w-full p-3 lg:p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100 active:bg-gray-100 touch-manipulation cursor-pointer ${activeConversationId === conversation.id ? 'bg-green-50 border-l-4 border-l-green-600' : ''}`}
                      >
                        <div className="relative">
                          {conversation.isGroup ? getGroupAvatar(conversation) : getUserAvatar(partner)}
                          {/* Red dot indicator for new messages */}
                          {hasNewMessages && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-800 text-sm lg:text-base truncate">
                              {conversation.isGroup ? 'Group Chat' : getConversationPartnerName(conversation)}
                            </h3>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{conversation.time}</span>
                          </div>
                          <p className="text-xs lg:text-sm text-gray-500 truncate">{conversation.lastMessage || 'No messages yet'}</p>
                        </div>
                        {/* Show unread count badge */}
                        {hasNewMessages && (
                          <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat Area - Full width on mobile when active */}
        <div className={`${!showConversations ? 'flex' : 'hidden'} lg:flex flex flex-1 flex-col bg-gray-50 w-full`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white p-2 lg:p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
                  {/* Back button */}
                  <button 
                    onClick={handleBackToConversations}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0 touch-manipulation"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-shrink-0">
                    {activeConversation?.isGroup ? getGroupAvatar(activeConversation) : getUserAvatar(getConversationPartner(activeConversation))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm lg:text-base truncate">{activePartnerName}</h3>
                    {activeConversation?.isGroup ? (
                      <p className="text-xs lg:text-sm text-gray-500 flex items-center">
                        <span className="truncate">{activeConversation.participants?.length || 2} participants</span>
                      </p>
                    ) : (
                      (() => {
                        const partner = getConversationPartner(activeConversation);
                        const partnerId = partner?.id;
                        const status = getUserStatus(partnerId);
                        const isOnline = status === 'online';
                        return (
                          <p className={`text-xs lg:text-sm flex items-center ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className={`w-2 h-2 rounded-full mr-1 lg:mr-2 flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            <span className="truncate">{isOnline ? 'Online' : `Last seen ${getLastSeen(partnerId)}`}</span>
                          </p>
                        );
                      })()
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
                  <button 
                    onClick={handleCall}
                    className="p-2 lg:p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                    title="Voice Call"
                    aria-label="Voice call"
                  >
                    <Phone className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                  <button 
                    onClick={handleVideoCall}
                    className="p-2 lg:p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                    title="Video Call"
                    aria-label="Video call"
                  >
                    <Video className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowChatMenu(!showChatMenu)}
                      className="p-2 lg:p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                      title="More Options"
                      aria-label="More options"
                    >
                      <MoreVertical className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                    {showChatMenu && (
                      <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[180px]">
                        <button
                          onClick={handleClearChat}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
                        >
                          Clear Chat
                        </button>
                        <button
                          onClick={handleDeleteConversation}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                        >
                          Delete Conversation
                        </button>
                        <button
                          onClick={handleBlockUser}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${isBlocked ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {isBlocked ? 'Unblock User' : 'Block User'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              {isBlocked && (
                <div className="bg-red-100 border-l-4 border-red-500 p-4 mx-4 mt-4 rounded">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        <span className="font-bold">Blocked</span> — You cannot send messages or call this user. <button onClick={handleBlockUser} className="underline font-medium">Unblock</button>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {currentMessages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  const deletedForEveryone = isMessageDeletedForEveryone(message);
                  const deletedForMe = isMessageDeletedForMe(message) || deletedForEveryone;
                  
                  if (deletedForMe) {
                    return (
                      <div key={message.id} className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                        {/* Avatar for other user's deleted messages */}
                        {!isOwn && (
                          <div className="flex-shrink-0 self-end mb-1">
                            {getUserAvatar(allUsers.find(u => u.id === message.senderId))}
                          </div>
                        )}
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isOwn ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-500'}`}>
                          <p className="italic text-sm">Message deleted</p>
                        </div>
                        {/* Avatar for own deleted messages */}
                        {isOwn && (
                          <div className="flex-shrink-0 self-end mb-1">
                            {(() => {
                              const avatar = AVATAR_OPTIONS[user?.avatar || 'default'] || AVATAR_OPTIONS.default;
                              return user?.profilePicture ? (
                                <img 
                                  src={user.profilePicture} 
                                  alt="Me" 
                                  className="w-10 h-10 object-cover rounded-full"
                                />
                              ) : (
                                <div className={`w-10 h-10 ${avatar.color} rounded-full flex items-center justify-center text-lg`}>
                                  {avatar.icon}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={message.id} 
                         data-is-own={isOwn}
                         className={`flex w-full items-end gap-2 ${isOwn ? 'flex-row' : 'flex-row-reverse'}`}>
                      {/* Avatar */}
                      <div className="flex-shrink-0 self-end mb-1">
                        {isOwn ? (
                          // Own avatar on LEFT
                          (() => {
                            const avatar = AVATAR_OPTIONS[user?.avatar || 'default'] || AVATAR_OPTIONS.default;
                            return user?.profilePicture ? (
                              <img 
                                src={user.profilePicture} 
                                alt="Me" 
                                className="w-10 h-10 object-cover rounded-full"
                              />
                            ) : (
                              <div className={`w-10 h-10 ${avatar.color} rounded-full flex items-center justify-center text-lg`}>
                                {avatar.icon}
                              </div>
                            );
                          })()
                        ) : (
                          // Other's avatar on RIGHT
                          (() => {
                            const senderUser = allUsers.find(u => u.id === message.senderId) || 
                                               allUsers.find(u => u.id === message.sender_id) ||
                                               (message.senderId ? { id: message.senderId, name: message.senderName, profilePicture: message.senderProfilePicture } : null);
                            if (!senderUser) return null;
                            return (
                              <div className="relative">
                                {senderUser.profilePicture ? (
                                  <img 
                                    src={senderUser.profilePicture} 
                                    alt={senderUser.name || 'User'} 
                                    className="w-10 h-10 object-cover rounded-full"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-lg">
                                    {(senderUser.name || '?').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                              </div>
                            );
                          })()
                        )}
                      </div>
                      
                      {/* Message Content - LEFT for own, RIGHT for others */}
                      <div className={`group relative max-w-[70%] ${isOwn ? 'mr-auto' : 'ml-auto'}`}>
                        {/* Sender name - only for others */}
                        {!isOwn && (
                          <span className="text-xs font-medium text-gray-500 block mb-1 ml-1">
                            {message.senderName}
                          </span>
                        )}
                        
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-white text-gray-800 border border-gray-200 rounded-br-none shadow-sm'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                          }`}
                        >
                          {editingMessage?.id === message.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm bg-white text-gray-800 rounded border"
                                onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                              />
                              <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-700 font-bold">✓</button>
                              <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-600 font-bold">✕</button>
                            </div>
                          ) : (
                            <>
                              {/* Image Messages - Gallery/Camera/Edited */}
                              {(message.type === 'image' || message.message_type === 'image') && (message.imageUrl || message.image_url || message.file_url) ? (
                                <img 
                                  src={message.imageUrl || message.image_url || message.file_url} 
                                  alt="Shared" 
                                  className="max-w-full max-h-48 rounded-lg cursor-pointer hover:opacity-90"
                                  onClick={() => handleImageClick(message.imageUrl || message.image_url || message.file_url)}
                                />
                              ) : (message.type === 'file' || message.message_type === 'file') && (message.fileName || message.file_name) ? (
                                /* File Messages with download */
                                <button
                                  onClick={async () => {
                                    const fileUrl = message.fileUrl || message.file_url || message.image_url;
                                    const fileName = message.fileName || message.file_name || 'download';
                                    if (!fileUrl) {
                                      addNotification('File not available for download', 'error');
                                      return;
                                    }
                                    
                                    try {
                                      // For base64 data URLs, we can use them directly
                                      if (fileUrl.startsWith('data:')) {
                                        const link = document.createElement('a');
                                        link.href = fileUrl;
                                        link.download = fileName;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        addNotification('File downloaded!', 'success');
                                      } else {
                                        // For other URLs, fetch and download
                                        const response = await fetch(fileUrl);
                                        const blob = await response.blob();
                                        const blobUrl = window.URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = blobUrl;
                                        link.download = fileName;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        window.URL.revokeObjectURL(blobUrl);
                                        addNotification('File downloaded!', 'success');
                                      }
                                    } catch (err) {
                                      console.error('Download error:', err);
                                      addNotification('Failed to download file', 'error');
                                    }
                                  }}
                                  className="flex items-center space-x-2 bg-gray-100 rounded-lg p-3 hover:bg-gray-200 transition-colors border border-gray-300 cursor-pointer text-left"
                                >
                                  <Paperclip className="w-5 h-5 text-gray-600" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{message.fileName || message.file_name}</span>
                                    <span className="text-xs text-blue-600 underline">Click to download</span>
                                  </div>
                                </button>
                              ) : (message.type === 'voice' || message.message_type === 'voice') && (message.audioUrl || message.audio_url) ? (
                                /* Voice Messages with play button */
                                <button 
                                  onClick={() => handlePlayVoice(message)}
                                  className={`flex items-center space-x-3 rounded-lg p-3 transition-colors min-w-[150px] ${
                                    isPlaying === message.id
                                      ? 'bg-green-100 border-2 border-green-500 text-green-700' 
                                      : 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {isPlaying === message.id ? (
                                    <>
                                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      </div>
                                      <div className="flex flex-col items-start">
                                        <span className="text-sm font-medium">Playing...</span>
                                        <div className="w-24 h-1 bg-gray-300 rounded-full mt-1 overflow-hidden">
                                          <div className="h-full bg-green-500 animate-pulse" style={{width: '60%'}}></div>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                        <Play className="w-4 h-4 text-white ml-0.5" />
                                      </div>
                                      <div className="flex flex-col items-start">
                                        <span className="text-sm font-medium">Voice Message</span>
                                        <span className="text-xs text-gray-500">{message.duration || message.text || 'Click to play'}</span>
                                      </div>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <p className="text-gray-800">{message.text || message.content || ''}</p>
                              )}
                            </>
                          )}
                        </div>
                        
                        {/* Time outside bubble */}
                        <div className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                          {(() => {
                              // Format the time for display
                              const messageTime = message.created_at ? formatDate(message.created_at) : 
                                                  message.timestamp ? formatDate(message.timestamp) : 
                                                  message.time ? message.time : '';
                              return (
                                <>
                                  <span>{messageTime}</span>
                                  {message.edited && <span className="ml-1">(edited)</span>}
                                </>
                              );
                            })()}
                        </div>

                        {/* Reactions */}
                        {message.reactions && Object.keys(message.reactions).length > 0 && (
                          <div className={`flex gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {Object.entries(message.reactions).map(([emoji, users]) => (
                              users.length > 0 && (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(message.id, emoji)}
                                  className={`text-xs px-2 py-1 rounded-full ${users.includes(user?.id) ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                                >
                                  {emoji} {users.length}
                                </button>
                              )
                            ))}
                          </div>
                        )}

                        {/* Message Menu */}
                        {editingMessage?.id !== message.id && (
                          <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                            <button 
                              onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Message Options Menu */}
                        {showMessageMenu === message.id && (
                          <div className={`absolute top-6 ${isOwn ? 'right-0' : 'left-0'} bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[150px]`}>
                            {/* Emoji Reactions */}
                            <div className="flex gap-1 px-2 py-1 border-b border-gray-100">
                              {EMOJI_LIST.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(message.id, emoji)}
                                  className="hover:bg-gray-100 rounded px-1"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                            
                            {/* Edit - only for own text messages (not voice, file, or image) */}
                            {isOwn && !message.type && (
                              <button
                                onClick={() => handleStartEdit(message)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                Edit
                              </button>
                            )}
                            
                            {/* Delete options */}
                            {isOwn ? (
                              <>
                                <button
                                  onClick={() => handleDelete(message.id, false)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600"
                                >
                                  Delete for me
                                </button>
                                <button
                                  onClick={() => handleDelete(message.id, true)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600"
                                >
                                  Delete for everyone
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleDelete(message.id, false)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600"
                              >
                                Delete for me
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white p-2 lg:p-3 border-t border-gray-200">
                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.mp3,.mp4,.avi,.mov,.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.tiff,.ico"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={galleryInputRef}
                  onChange={handleGallerySelect}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleCameraCapture}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
                
                <div className="flex items-center space-x-1 lg:space-x-2">
                  <button 
                    type="button"
                    onClick={handleFileAttach}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                    title="Attach File"
                    aria-label="Attach file"
                  >
                    <Paperclip className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                  <button 
                    type="button"
                    onClick={handleGallery}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                    title="Gallery"
                    aria-label="Gallery"
                  >
                    <Image className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                  <button 
                    type="button"
                    onClick={handleCamera}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                    title="Live Camera"
                    aria-label="Camera"
                  >
                    <Camera className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                  <button 
                    type="button"
                    onClick={handleVoiceToggle}
                    className={`p-2 rounded-lg transition-colors touch-manipulation flex-shrink-0 ${isRecording ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    title={isRecording ? 'Stop Recording' : 'Voice Message'}
                    aria-label={isRecording ? 'Stop recording' : 'Voice message'}
                  >
                    <Mic className="w-4 h-4 lg:w-5 lg:h-5" />
                    {isRecording && <span className="ml-1 text-xs hidden sm:inline">{recordingTime}s</span>}
                  </button>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-2 lg:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none min-w-0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                    title="Add Emoji"
                    aria-label="Add emoji"
                  >
                    <Smile className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-16 lg:bottom-14 right-2 lg:right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-30 w-64 max-w-[calc(100vw-1rem)]">
                      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                        {emojiList.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => handleEmojiSelect(emoji)}
                            className="text-lg lg:text-xl hover:bg-gray-100 rounded p-1 transition-colors touch-manipulation"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => setShowEmojiPicker(false)}
                        className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 py-2 touch-manipulation"
                      >
                        Close
                      </button>
                    </div>
                  )}
                  <button 
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex-shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
          {/* Image Viewer Modal with Inline Editing */}
          {imageViewerOpen && selectedImageUrl && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-gray-900 rounded-lg p-3 sm:p-4 max-w-5xl w-full mx-auto max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    {showImageEditor ? 'Image Editor' : 'Image Viewer'}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!showImageEditor ? (
                      <>
                        <button 
                          onClick={handleDownloadImage}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 sm:gap-2 text-sm touch-manipulation"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Download</span>
                        </button>
                        <button 
                          onClick={handleOpenImageEditor}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1 sm:gap-2 text-sm touch-manipulation"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Tool Selection */}
                        <div className="flex bg-gray-800 rounded-lg p-1">
                          <button 
                            onClick={() => setEditorTool('draw')}
                            className={`px-2 py-1 sm:px-3 sm:py-1 rounded flex items-center gap-1 text-sm touch-manipulation ${editorTool === 'draw' ? 'bg-green-600 text-white' : 'text-gray-300'}`}
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="hidden sm:inline">Draw</span>
                          </button>
                          <button 
                            onClick={() => setEditorTool('text')}
                            className={`px-2 py-1 sm:px-3 sm:py-1 rounded flex items-center gap-1 text-sm touch-manipulation ${editorTool === 'text' ? 'bg-green-600 text-white' : 'text-gray-300'}`}
                          >
                            <Type className="w-4 h-4" />
                            <span className="hidden sm:inline">Text</span>
                          </button>
                        </div>
                        {/* Color Picker */}
                        <input 
                          type="color" 
                          value={editorColor}
                          onChange={(e) => setEditorColor(e.target.value)}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded cursor-pointer touch-manipulation"
                        />
                        <button 
                          onClick={handleSendEditedImage}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1 sm:gap-2 text-sm touch-manipulation"
                        >
                          <Send className="w-4 h-4" />
                          <span className="hidden sm:inline">Send</span>
                        </button>
                        <button 
                          onClick={handleCloseImageEditor}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm touch-manipulation"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    <button 
                      onClick={handleCloseImageViewer}
                      className="p-1.5 sm:p-2 text-white hover:bg-gray-700 rounded-lg touch-manipulation"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>

                {/* Text Input for Text Tool */}
                {showImageEditor && editorTool === 'text' && (
                  <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={editorText}
                      onChange={(e) => setEditorText(e.target.value)}
                      placeholder="Enter text to add..."
                      className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTextToCanvas()}
                    />
                    <button 
                      onClick={handleAddTextToCanvas}
                      disabled={!editorText.trim() || !textPosition}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm touch-manipulation"
                    >
                      Add Text
                    </button>
                    {!textPosition && (
                      <span className="text-gray-400 text-xs sm:text-sm self-center">
                        Click image to position
                      </span>
                    )}
                  </div>
                )}

                <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-800 rounded-lg">
                  {!showImageEditor ? (
                    <img 
                      src={selectedImageUrl} 
                      alt="Full size" 
                      className="max-w-full max-h-[50vh] sm:max-h-[70vh] object-contain"
                    />
                  ) : (
                    <canvas
                      ref={imageEditorCanvasRef}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                      className="max-w-full max-h-[40vh] sm:max-h-[60vh] cursor-crosshair"
                    />
                  )}
                </div>
                {showImageEditor && (
                  <p className="text-gray-400 text-xs sm:text-sm mt-2 text-center px-2">
                    {editorTool === 'draw' ? 'Click and drag to draw' : 'Click on image to place text, then type and click Add Text'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Incoming Call Modal */}
          {showIncomingCall && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-lg p-6 sm:p-8 max-w-md w-full mx-auto text-center">
                <div className="mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-pulse">
                    {incomingCallType === 'video' ? <Video className="w-8 h-8 sm:w-10 sm:h-10 text-white" /> : <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-white" />}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">{callerInfo?.name || activePartnerName}</h3>
                  <p className="text-gray-400 mt-2 text-sm sm:text-base">
                    {incomingCallType === 'video' ? 'Incoming Video Call...' : 'Incoming Voice Call...'}
                  </p>
                </div>
                <div className="flex justify-center space-x-4 sm:space-x-6 mt-4 sm:mt-6">
                  <button 
                    onClick={async () => {
                      // Answer call
                      setShowIncomingCall(false);
                      if (incomingCallType === 'voice') {
                        setShowCallModal(true);
                        setCallStatus('connected');
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                          setLocalStream(stream);
                          addNotification('Call connected!', 'success');
                        } catch (err) {
                          addNotification('Could not access microphone', 'error');
                          setShowCallModal(false);
                        }
                      } else {
                        setShowVideoCallModal(true);
                        setVideoCallStatus('connected');
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                          setLocalStream(stream);
                          if (localVideoRef.current) {
                            localVideoRef.current.srcObject = stream;
                          }
                          addNotification('Video call connected!', 'success');
                        } catch (err) {
                          addNotification('Could not access camera/microphone', 'error');
                          setShowVideoCallModal(false);
                        }
                      }
                      setIncomingCallType(null);
                      setCallerInfo(null);
                    }}
                    className="px-4 py-2 sm:px-6 sm:py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium flex items-center gap-2 touch-manipulation"
                  >
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Answer</span>
                  </button>
                  <button 
                    onClick={() => {
                      setShowIncomingCall(false);
                      setIncomingCallType(null);
                      setCallerInfo(null);
                      addNotification('Call declined', 'error');
                    }}
                    className="px-4 py-2 sm:px-6 sm:py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium flex items-center gap-2 touch-manipulation"
                  >
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Decline</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Call Modal */}
          {showCallModal && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-3 sm:p-4">
              <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 max-w-sm w-full mx-auto text-center max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="mb-6 sm:mb-8">
                  {/* Avatar */}
                  <div className="relative mx-auto mb-4">
                    {activeConversation && !activeConversation.isGroup ? (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full overflow-hidden bg-gray-700 border-4 border-gray-700">
                        {(() => {
                          const partner = getConversationPartner(activeConversation);
                          if (partner?.profilePicture) {
                            return <img src={partner.profilePicture} alt="" className="w-full h-full object-cover" />;
                          }
                          const avatar = AVATAR_OPTIONS[partner?.avatar || 'default'] || AVATAR_OPTIONS.default;
                          return (
                            <div className={`w-full h-full ${avatar.color} flex items-center justify-center text-4xl sm:text-5xl`}>
                              {avatar.icon}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                        <Phone className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                      </div>
                    )}
                    
                    {/* Status indicator */}
                    {callStatus === 'calling' && (
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white text-xs">...</span>
                      </div>
                    )}
                    {callStatus === 'connected' && (
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{activePartnerName}</h3>
                  
                  {/* Status text */}
                  <p className="text-gray-400 text-base sm:text-lg">
                    {callStatus === 'calling' && (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                        Calling...
                      </span>
                    )}
                    {callStatus === 'ringing' && (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Ringing...
                      </span>
                    )}
                    {callStatus === 'connected' && (
                      <span className="text-green-400 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Call in progress
                      </span>
                    )}
                    {callStatus === 'ended' && (
                      <span className="text-red-400">Call ended</span>
                    )}
                  </p>
                  
                  {/* Call duration */}
                  {callStatus === 'connected' && activeCallStartTime && (
                    <p className="text-gray-500 text-sm mt-2">
                      {(() => {
                        const duration = Math.floor((Date.now() - activeCallStartTime) / 1000);
                        const mins = Math.floor(duration / 60);
                        const secs = duration % 60;
                        return `${mins}:${secs.toString().padStart(2, '0')}`;
                      })()}
                    </p>
                  )}
                </div>
                
                {/* Controls */}
                <div className="flex justify-center items-center gap-4 sm:gap-6">
                  {(callStatus === 'ringing' || callStatus === 'calling') && (
                    <button 
                      onClick={handleEndCall}
                      className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center touch-manipulation transition-transform hover:scale-105"
                    >
                      <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </button>
                  )}
                  {callStatus === 'connected' && (
                    <>
                      {/* Mute */}
                      <button 
                        onClick={() => {
                          if (localStream) {
                            const audioTrack = localStream.getAudioTracks()[0];
                            if (audioTrack) {
                              audioTrack.enabled = !audioTrack.enabled;
                              setIsCallMuted(!audioTrack.enabled);
                            }
                          }
                        }}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center touch-manipulation transition-transform hover:scale-105 ${isCallMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                        title={isCallMuted ? 'Unmute' : 'Mute'}
                      >
                        {isCallMuted ? <MicOff className="w-6 h-6 sm:w-7 sm:h-7" /> : <Mic className="w-6 h-6 sm:w-7 sm:h-7" />}
                      </button>
                      
                      {/* End Call */}
                      <button 
                        onClick={handleEndCall}
                        className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center touch-manipulation transition-transform hover:scale-105"
                      >
                        <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </button>
                      
                      {/* Speaker */}
                      <button 
                        onClick={() => {
                          setIsSpeakerOn(!isSpeakerOn);
                          addNotification(isSpeakerOn ? 'Speaker off' : 'Speaker on', 'info');
                        }}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center touch-manipulation transition-transform hover:scale-105 ${isSpeakerOn ? 'bg-green-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                        title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
                      >
                        {isSpeakerOn ? <Volume2 className="w-6 h-6 sm:w-7 sm:h-7" /> : <VolumeX className="w-6 h-6 sm:w-7 sm:h-7" />}
                      </button>
                    </>
                  )}
                </div>
                
                {/* Hint text */}
                <p className="text-gray-500 text-sm mt-6">
                  {callStatus === 'connected' ? 'Swipe up to minimize' : 'Tap red button to cancel'}
                </p>
              </div>
            </div>
          )}

          {/* Video Call Modal */}
          {showVideoCallModal && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-3 sm:p-4">
              <div className="bg-gray-900 rounded-lg p-4 sm:p-6 max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">{activeConversation?.with}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      {videoCallStatus === 'ringing' && (
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></span>
                          Ringing...
                        </span>
                      )}
                      {videoCallStatus === 'calling' && 'Calling...'}
                      {videoCallStatus === 'connected' && 'Video Call Connected'}
                    </p>
                  </div>
                </div>
                
                {/* Video Display Area */}
                <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ height: '50vh', minHeight: '300px' }}>
                  {/* Main video - show local video while ringing/calling, remote when connected */}
                  <video 
                    ref={localVideoRef}
                    autoPlay 
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Self view picture-in-picture when connected */}
                  {videoCallStatus === 'connected' && (
                    <div className="absolute bottom-4 right-4 w-32 h-24 sm:w-48 sm:h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                      <video 
                        ref={localVideoRef}
                        autoPlay 
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                
                {/* Control Buttons */}
                <div className="flex justify-center items-center gap-4">
                  {/* Mute Button */}
                  <button 
                    onClick={() => {
                      if (localStream) {
                        const audioTrack = localStream.getAudioTracks()[0];
                        if (audioTrack) {
                          audioTrack.enabled = !audioTrack.enabled;
                          setIsCallMuted(!audioTrack.enabled);
                        }
                      }
                    }}
                    className={`p-3 sm:p-4 rounded-full touch-manipulation ${isCallMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                    title={isCallMuted ? 'Unmute' : 'Mute'}
                  >
                    {isCallMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </button>
                  
                  {/* Video Off Button */}
                  <button 
                    onClick={() => {
                      if (localStream) {
                        const videoTrack = localStream.getVideoTracks()[0];
                        if (videoTrack) {
                          videoTrack.enabled = !videoTrack.enabled;
                          setIsCameraVideoOff(!videoTrack.enabled);
                        }
                      }
                    }}
                    className={`p-3 sm:p-4 rounded-full touch-manipulation ${isCameraVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                    title={isCameraVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {isCameraVideoOff ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </button>
                  
                  {/* End Call Button */}
                  <button 
                    onClick={handleEndVideoCall}
                    className="p-3 sm:p-4 bg-red-500 hover:bg-red-600 rounded-full text-white touch-manipulation"
                    title="End Call"
                  >
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  
                  {/* Speaker Button */}
                  <button 
                    onClick={() => {
                      setIsSpeakerOn(!isSpeakerOn);
                      addNotification(isSpeakerOn ? 'Speaker off' : 'Speaker on', 'info');
                    }}
                    className={`p-3 sm:p-4 rounded-full touch-manipulation ${isSpeakerOn ? 'bg-green-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                    title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
                  >
                    {isSpeakerOn ? <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Camera Modal */}
          {showCameraModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-gray-900 rounded-xl p-4 sm:p-6 max-w-4xl w-full mx-auto max-h-[95vh] flex flex-col">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    {capturedPhoto ? 'Preview Photo' : 'Camera'}
                  </h3>
                  <button 
                    onClick={handleCloseCamera}
                    className="p-2 text-white hover:bg-gray-700 rounded-lg touch-manipulation"
                    aria-label="Close camera"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 relative bg-black rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: '50vh', maxHeight: '70vh' }}>
                  {!capturedPhoto ? (
                    <video 
                      ref={videoRef}
                      autoPlay 
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ maxHeight: '70vh' }}
                    />
                  ) : (
                    <img 
                      src={capturedPhoto} 
                      alt="Captured" 
                      className="w-full h-full object-contain"
                      style={{ maxHeight: '70vh' }}
                    />
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                
                <div className="flex justify-center items-center gap-4 mt-4 sm:mt-6">
                  {!capturedPhoto ? (
                    <button 
                      onClick={handleCapturePhoto}
                      className="p-4 sm:p-5 bg-white rounded-full touch-manipulation hover:bg-gray-200 transition-colors"
                      title="Take Photo"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 border-gray-800 bg-white"></div>
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={handleRetakePhoto}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-medium text-sm sm:text-base touch-manipulation flex items-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        Retake
                      </button>
                      <button 
                        onClick={handleSendPhoto}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium text-sm sm:text-base touch-manipulation flex items-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        Send Photo
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Confirm Modal */}
          {showConfirmModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
              <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-auto shadow-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">{confirmModalData.title}</h3>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">{confirmModalData.message}</p>
                <div className="flex justify-end space-x-2 sm:space-x-3">
                  <button 
                    onClick={() => setShowConfirmModal(false)}
                    className="px-3 py-2 sm:px-4 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
                  >
                    {confirmModalData.cancelText}
                  </button>
                  <button 
                    onClick={confirmModalData.onConfirm}
                    className={`px-3 py-2 sm:px-4 sm:py-2 text-white rounded-lg transition-colors text-sm sm:text-base touch-manipulation ${
                      confirmModalData.isDanger 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {confirmModalData.confirmText}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Group Chat Modal */}
      {showGroupChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Create Group Chat</h3>
              <button 
                onClick={() => setShowGroupChatModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Enter group name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Participants (minimum 2)
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {contacts.filter(contact => contact.id !== user?.id).map((contact) => (
                    <label key={contact.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(contact.id)}
                        onChange={() => toggleParticipantSelection(contact.id)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div className="flex items-center space-x-2 flex-1">
                        <div className={`w-8 h-8 ${AVATAR_OPTIONS[contact.avatar || 'default']?.color || 'bg-gray-400'} rounded-full flex items-center justify-center text-sm`}>
                          {AVATAR_OPTIONS[contact.avatar || 'default']?.icon || '👤'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{contact.name}</p>
                          <p className="text-xs text-gray-500">{contact.department} {contact.role === 'admin' ? '(Admin)' : '(Instructor)'}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowGroupChatModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateGroupChat}
                disabled={!groupName.trim() || selectedParticipants.length < 2}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
