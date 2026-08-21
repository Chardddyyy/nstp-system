import { useAuth } from '../context/AuthContext';
import { callsAPI, conversationsAPI } from '../services/api';
import heic2any from 'heic2any';
import {
  User, Users, Send, Search,
  Phone, Video, MoreVertical, Paperclip, Smile,
  Mic, Camera, Image, X, Download,
  Play, Menu, ArrowLeft, MicOff,
  Volume2, VolumeX, MessageSquare, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useState, useRef, useEffect } from 'react';

import { getAvatarSrc } from '../utils/avatars';

// Emoji list for reactions
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

// Image compression utility
const compressImage = (dataUrl, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
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
    img.onerror = () => reject(new Error('Image failed to load — file may be corrupted or an unsupported format.'));
    img.src = dataUrl;
  });
};

function Chat() {
  const { user, logout, allUsers, conversations, messages, sendMessage, getUserConversations,
          editMessage, deleteMessage, addReaction, clearMessages, deleteConversation, startConversation,
          _incomingCall, outgoingCallStatus, registerOutgoingCall, clearOutgoingCall,
          setMessages,
          pendingAnsweredCall, setPendingAnsweredCall } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showContacts, setShowContacts] = useState(false);
  const [readConversations, setReadConversations] = useState(() => {
    // Load read state from localStorage
    const saved = localStorage.getItem('nstp_read_conversations');
    return saved ? JSON.parse(saved) : {};
  });
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const attachMenuRef = useRef(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef(null);
  const recordingDurationRef = useRef(0);
  const fileInputRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesContainerRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const isSendingMediaRef = useRef(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Drawing board state
  const [showDrawModal, setShowDrawModal] = useState(false);
  const drawCanvasRef = useRef(null);
  const drawCanvasWrapRef = useRef(null); // wrapper div for overlay positioning
  const drawBgImageRef = useRef(null);
  const [isDrawingCanvas, setIsDrawingCanvas] = useState(false);
  const [drawColor, setDrawColor] = useState('#1a1a1a');
  const [drawBrushSize, setDrawBrushSize] = useState(4);
  const [drawTool, setDrawTool] = useState('pen');
  const drawHistoryRef = useRef([]);
  const [drawHistoryLen, setDrawHistoryLen] = useState(0);
  const drawLastPos = useRef(null);
  const [drawText, setDrawText] = useState('');
  const [drawTextPos, setDrawTextPos] = useState(null);
  const [drawSelectedEmoji, setDrawSelectedEmoji] = useState('😊');
  // Movable text layers — not burned into canvas until send
  const [textLayers, setTextLayers] = useState([]);
  const draggingTextRef = useRef(null); // { id, startMouseX, startMouseY, origCanvasX, origCanvasY }

  // Voice recording refs and state
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isPlaying, setIsPlaying] = useState(null); // message id being played
  const audioPlayerRef = useRef(null);

  const handleLogout = async () => {
    await logout();
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
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const getGroupAvatar = (conversation) => {
    if (!isGroupConversation(conversation)) return null;
    
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
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
          {groupName.charAt(0).toUpperCase()}
        </div>
      );
    }

    // Show combined avatars for group chats - display up to 3 avatars in a cluster
    return (
      <div className="w-9 h-9 sm:w-10 sm:h-10 relative flex items-center justify-center shrink-0">
        {participantUsers.slice(0, 3).map((participant, index) => {
          const positions = [
            { top: '0px', left: '1px' },
            { top: '0px', right: '1px' },
            { bottom: '0px', left: '50%', transform: 'translateX(-50%)' }
          ];
          const pos = positions[index] || { top: '0px', left: '0px' };

          return (
            <img
              key={participant?.id || index}
              src={getAvatarSrc(participant?.avatar, participant?.profilePicture)}
              alt={participant?.name || 'User'}
              className="absolute w-5 h-5 rounded-full border border-white shadow-xs object-cover"
              style={pos}
              title={participant?.name || 'User'}
            />
          );
        })}
        {(conversation.participants?.length > 3 || conversation.participantDetails?.length > 3) && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-[8px] text-white border border-white shadow-xs">
            +{(conversation.participants?.length || conversation.participantDetails?.length || 0) - 3}
          </div>
        )}
      </div>
    );
  };

  const handleSetActiveConversation = async (id) => {
    setActiveConversationId(id);
    setShowConversations(false); // Hide conversation list on mobile when chat opens
    setSidebarOpen(false); // Close main navigation sidebar
    
    // Mark conversation as read
    setReadConversations(prev => {
      const updated = { ...prev, [id]: Date.now() };
      try { localStorage.setItem('nstp_read_conversations', JSON.stringify(updated)); } catch {}
      return updated;
    });

    // Fetch messages IMMEDIATELY for this conversation so user doesn't wait 8 seconds!
    try {
      const msgs = await conversationsAPI.getMessages(id);
      if (msgs && Array.isArray(msgs)) {
        setMessages(prev => ({ ...prev, [id]: msgs }));
      }
    } catch (_) {}
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
    if (file && activeConversation && !isSendingMediaRef.current) {
      // 150MB client limit (base64 adds ~33% → ~200MB on wire, matches server limit)
      const maxSize = 150 * 1024 * 1024;
      if (file.size > maxSize) {
        addNotification('File too large. Maximum 150MB allowed.', 'error');
        e.target.value = '';
        return;
      }
      
      isSendingMediaRef.current = true;
      setIsSendingMedia(true);
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
      } finally {
        isSendingMediaRef.current = false;
        setIsSendingMedia(false);
      }
    }
    e.target.value = '';
  };

  const handleGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleGallerySelect = async (e) => {
    const file = e.target.files[0];
    if (file && activeConversation && !isSendingMediaRef.current) {
      isSendingMediaRef.current = true;
      setIsSendingMedia(true);
      try {
        // Convert HEIC/HEIF (iPhone format) to JPEG so browsers can display it
        let readableFile = file;
        const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
          file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
        if (isHeic) {
          const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
          readableFile = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        }

        const imageData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target.result);
          reader.onerror = () => reject(new Error('Failed to read image'));
          reader.readAsDataURL(readableFile);
        });
        let finalImage = imageData;
        try {
          finalImage = await compressImage(imageData, 800, 800, 0.7);
        } catch {
          // unsupported format — use original
        }
        await sendMessage(activeConversation.id, {
          sender: 'me',
          text: '',
          type: 'image',
          imageUrl: finalImage
        });
        addNotification('Image sent!', 'success');
      } catch (error) {
        console.error('Gallery image load error:', error);
        addNotification('Failed to send image. Please try a different format.', 'error');
      } finally {
        isSendingMediaRef.current = false;
        setIsSendingMedia(false);
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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // Capture photo directly without mirror flip
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoData = canvas.toDataURL('image/png');
    // Reset draw state — image will be loaded onto drawCanvasRef via useEffect after re-render
    drawHistoryRef.current = [];
    setDrawHistoryLen(0);
    setDrawTool('pen');
    setDrawColor('#ff0000');
    setDrawBrushSize(4);
    setDrawText('');
    setDrawTextPos(null);
    setCapturedPhoto(photoData);
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    drawHistoryRef.current = [];
    setDrawHistoryLen(0);
    setDrawText('');
    setDrawTextPos(null);
  };

  const handleSendPhoto = async () => {
    if (!capturedPhoto || !activeConversation || isSendingMediaRef.current) return;
    isSendingMediaRef.current = true;
    setIsSendingMedia(true);
    try {
      await sendMessage(activeConversation.id, {
        sender: 'me',
        text: '📸 Camera Photo',
        type: 'image',
        imageUrl: capturedPhoto
      });
      addNotification('Photo sent!', 'success');
      handleCloseCamera();
    } catch (error) {
      console.error('Photo send error:', error);
      addNotification('Failed to send photo', 'error');
    } finally {
      isSendingMediaRef.current = false;
      setIsSendingMedia(false);
    }
  };

  // ── Drawing board ──────────────────────────────────────────
  const _openDrawModal = (bgImage = null) => {
    drawBgImageRef.current = bgImage;
    setShowDrawModal(true);
    setDrawTool('pen');
    setDrawColor('#1a1a1a');
    setDrawBrushSize(4);
    drawHistoryRef.current = [];
    setDrawHistoryLen(0);
    setDrawText('');
    setDrawTextPos(null);
    setTextLayers([]);
  };

  const getDrawPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  };

  const saveDrawSnapshot = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawHistoryRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    setDrawHistoryLen(drawHistoryRef.current.length);
  };

  const handleDrawUndo = () => {
    // First undo: remove last text layer if any
    if (textLayers.length > 0) {
      setTextLayers(prev => prev.slice(0, -1));
      return;
    }
    if (drawHistoryRef.current.length === 0) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(drawHistoryRef.current.pop(), 0, 0);
    setDrawHistoryLen(drawHistoryRef.current.length);
  };

  const handleDrawClear = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    saveDrawSnapshot();
    setTextLayers([]);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleDrawPointerDown = (e) => {
    e.preventDefault();
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const pos = getDrawPos(e, canvas);
    if (drawTool === 'pen' || drawTool === 'eraser') {
      saveDrawSnapshot();
      setIsDrawingCanvas(true);
      drawLastPos.current = pos;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, drawBrushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = drawTool === 'eraser' ? '#ffffff' : drawColor;
      ctx.fill();
    } else if (drawTool === 'text') {
      setDrawTextPos(pos);
    } else if (drawTool === 'emoji') {
      saveDrawSnapshot();
      const ctx = canvas.getContext('2d');
      const fontSize = drawBrushSize * 7 + 14;
      ctx.font = `${fontSize}px serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(drawSelectedEmoji, pos.x, pos.y);
    }
  };

  const handleDrawPointerMove = (e) => {
    e.preventDefault();
    if (!isDrawingCanvas || (drawTool !== 'pen' && drawTool !== 'eraser')) return;
    const canvas = drawCanvasRef.current;
    if (!canvas || !drawLastPos.current) return;
    const ctx = canvas.getContext('2d');
    const pos = getDrawPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(drawLastPos.current.x, drawLastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = drawTool === 'eraser' ? '#ffffff' : drawColor;
    ctx.lineWidth = drawBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    drawLastPos.current = pos;
  };

  const handleDrawPointerUp = () => setIsDrawingCanvas(false);

  const commitDrawText = () => {
    if (!drawText.trim() || !drawTextPos) return;
    const fontSize = drawBrushSize * 4 + 14;
    setTextLayers(prev => [...prev, {
      id: Date.now(),
      text: drawText,
      color: drawColor,
      fontSize,
      canvasX: drawTextPos.x,
      canvasY: drawTextPos.y,
    }]);
    setDrawText('');
    setDrawTextPos(null);
  };

  // Flatten all text layers onto the canvas (called before sending or clearing)
  const flattenTextLayers = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas || textLayers.length === 0) return;
    const ctx = canvas.getContext('2d');
    textLayers.forEach(layer => {
      ctx.font = `bold ${layer.fontSize}px sans-serif`;
      ctx.fillStyle = layer.color;
      ctx.textBaseline = 'top';
      ctx.fillText(layer.text, layer.canvasX, layer.canvasY);
    });
    setTextLayers([]);
  };

  // Text layer drag handlers
  const startDragText = (e, id) => {
    e.stopPropagation();
    const src = e.touches ? e.touches[0] : e;
    const layer = textLayers.find(l => l.id === id);
    if (!layer) return;
    draggingTextRef.current = { id, startMouseX: src.clientX, startMouseY: src.clientY, origX: layer.canvasX, origY: layer.canvasY };
  };

  const onDragTextMove = (e) => {
    if (!draggingTextRef.current) return;
    const src = e.touches ? e.touches[0] : e;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const { id, startMouseX, startMouseY, origX, origY } = draggingTextRef.current;
    const dx = (src.clientX - startMouseX) * scaleX;
    const dy = (src.clientY - startMouseY) * scaleY;
    setTextLayers(prev => prev.map(l => l.id === id ? { ...l, canvasX: origX + dx, canvasY: origY + dy } : l));
  };

  const onDragTextEnd = () => { draggingTextRef.current = null; };

  const resizeTextLayer = (id, delta) => {
    setTextLayers(prev => prev.map(l => l.id === id ? { ...l, fontSize: Math.max(10, Math.min(120, l.fontSize + delta)) } : l));
  };

  const handleDrawSend = async () => {
    const canvas = drawCanvasRef.current;
    if (!canvas || !activeConversation || isSendingMediaRef.current) return;
    isSendingMediaRef.current = true;
    setIsSendingMedia(true);
    flattenTextLayers(); // burn movable text onto canvas before export
    const dataUrl = canvas.toDataURL('image/png');
    setShowDrawModal(false);
    try {
      await sendMessage(activeConversation.id, {
        sender: 'me',
        text: '🎨 Drawing',
        type: 'image',
        imageUrl: dataUrl,
      });
      addNotification('Drawing sent!', 'success');
    } catch {
      addNotification('Failed to send drawing.', 'error');
    } finally {
      isSendingMediaRef.current = false;
      setIsSendingMedia(false);
    }
  };

  const handleCameraCapture = async (e) => {
    const file = e.target.files[0];
    if (file && activeConversation && !isSendingMediaRef.current) {
      isSendingMediaRef.current = true;
      setIsSendingMedia(true);
      try {
        const imageData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target.result);
          reader.onerror = () => reject(new Error('Failed to read photo'));
          reader.readAsDataURL(file);
        });
        const compressedImage = await compressImage(imageData, 800, 800, 0.7);
        await sendMessage(activeConversation.id, {
          sender: 'me',
          text: '📸 Camera Photo',
          type: 'image',
          imageUrl: compressedImage
        });
        addNotification('Photo sent!', 'success');
      } catch (error) {
        console.error('Camera capture send error:', error);
        addNotification('Failed to send photo. Please try again.', 'error');
      } finally {
        isSendingMediaRef.current = false;
        setIsSendingMedia(false);
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
      // Stop recording — onstop will auto-send
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Pick best supported MIME type (iOS needs mp4, Chrome prefers webm)
        const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
          .find(t => MediaRecorder.isTypeSupported(t)) || '';

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        // Use a ref so onstop always reads the latest duration regardless of re-renders
        recordingDurationRef.current = 0;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const finalDuration = recordingDurationRef.current;
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

          if (activeConversation && finalDuration > 0) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Audio = reader.result;
              const formattedDuration = finalDuration < 60
                ? `${finalDuration}s`
                : `${Math.floor(finalDuration / 60)}:${(finalDuration % 60).toString().padStart(2, '0')}`;
              sendMessage(activeConversation.id, {
                sender: 'me',
                text: `🎤 Voice message (${formattedDuration})`,
                type: 'voice',
                duration: formattedDuration,
                audioUrl: base64Audio,
              });
              addNotification('Voice message sent!', 'success');
            };
            reader.readAsDataURL(audioBlob);
          }

          stream.getTracks().forEach(track => track.stop());
          setRecordingTime(0);
        };

        // Use 250ms timeslice — large enough to avoid excessive events, small enough for responsiveness
        mediaRecorder.start(250);
        setIsRecording(true);
        setRecordingTime(0);
        recordingDurationRef.current = 0;

        recordingIntervalRef.current = setInterval(() => {
          recordingDurationRef.current += 1;
          setRecordingTime(recordingDurationRef.current);
        }, 1000);
      } catch (err) {
        addNotification('Could not access microphone. Please allow microphone access.', 'error');
        console.error('Error accessing microphone:', err);
      }
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    }
    setIsRecording(false);
    clearInterval(recordingIntervalRef.current);
    setRecordingTime(0);
    recordingDurationRef.current = 0;
    addNotification('Voice recording cancelled.', 'info');
  };

  // Tracks blob URLs we created so we can revoke them to free memory
  const audioBlobUrlRef = useRef(null);

  const handlePlayVoice = (message) => {
    const audioUrl = message.audioUrl || message.audio_url;

    if (!audioUrl) {
      addNotification('Voice message not available', 'error');
      return;
    }

    if (isPlaying === message.id) {
      // Stop playing
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }
      setIsPlaying(null);
      return;
    }

    // Stop any currently playing audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }

    try {
      // Convert base64 data URL → Blob URL so the browser can stream it
      // instead of decoding the entire string up-front (which causes buffering pauses)
      let playbackUrl = audioUrl;
      if (audioUrl.startsWith('data:')) {
        const [header, base64Data] = audioUrl.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'audio/webm';
        const binary = atob(base64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: mimeType });
        playbackUrl = URL.createObjectURL(blob);
        audioBlobUrlRef.current = playbackUrl;
      }

      const audio = new Audio(playbackUrl);
      audioPlayerRef.current = audio;

      audio.onerror = () => {
        addNotification('Voice message format not supported', 'error');
        setIsPlaying(null);
        audioPlayerRef.current = null;
      };

      audio.onended = () => {
        setIsPlaying(null);
        audioPlayerRef.current = null;
        if (audioBlobUrlRef.current) {
          URL.revokeObjectURL(audioBlobUrlRef.current);
          audioBlobUrlRef.current = null;
        }
      };

      audio.play().catch(err => {
        console.error('Failed to play voice message:', err);
        addNotification('Cannot play voice message', 'error');
        setIsPlaying(null);
        audioPlayerRef.current = null;
      });

      setIsPlaying(message.id);
    } catch (err) {
      console.error('Error creating audio player:', err);
      addNotification('Voice message unavailable', 'error');
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
  const localStreamRef = useRef(null); // always current, safe in closures
  const [remoteStream, setRemoteStream] = useState(null);
  const peerConnectionRef = useRef(null);
  const currentCallIdRef = useRef(null);
  const callConversationIdRef = useRef(null); // conversation the call belongs to
  const callTypeRef = useRef(null);
  const isCallerRef = useRef(false);
  const audioCtxRef = useRef(null);
  const callDurationIntervalRef = useRef(null);
  const [_callTimerTick, setCallTimerTick] = useState(0);
  const callEndPollRef = useRef(null);

  // Image viewer and editor state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [_blockedBy, setBlockedBy] = useState(null);
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

  // ── Ringtone ──────────────────────────────────────────────────────
  const startRingtone = () => {
    try {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      let active = true;
      const ring = () => {
        if (!active || !audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 440; osc.type = 'sine';
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.9);
        setTimeout(ring, 1600);
      };
      audioCtxRef.current._stop = () => { active = false; };
      ring();
    } catch { /* ignore */ }
  };

  const stopRingtone = () => {
    if (audioCtxRef.current) {
      try { if (audioCtxRef.current._stop) audioCtxRef.current._stop(); audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
  };

  // ── WebRTC helpers ─────────────────────────────────────────────────
  const RTC_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

  const waitForIceDone = (pc) => new Promise(resolve => {
    if (pc.iceGatheringState === 'complete') { resolve(pc.localDescription); return; }
    const fn = () => { if (pc.iceGatheringState === 'complete') { pc.removeEventListener('icegatheringstatechange', fn); resolve(pc.localDescription); } };
    pc.addEventListener('icegatheringstatechange', fn);
    setTimeout(() => { pc.removeEventListener('icegatheringstatechange', fn); resolve(pc.localDescription); }, 8000);
  });

  const stopLocalStream = () => {
    const s = localStreamRef.current;
    if (s) { s.getTracks().forEach(t => t.stop()); }
    localStreamRef.current = null;
    setLocalStream(null);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  };

  const startWebRTC = async (callId, isCaller, callType) => {
    try {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;
      const constraints = callType === 'video' ? { audio: true, video: true } : { audio: true };
      // Stop the preview stream before creating the WebRTC stream
      stopLocalStream();
      let stream = window.__nstp_preacquired_stream__;
      window.__nstp_preacquired_stream__ = null;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia(constraints).catch(() => null);
      }
      if (!stream) { addNotification('Could not access ' + (callType === 'video' ? 'camera/microphone' : 'microphone'), 'error'); return false; }
      localStreamRef.current = stream;
      setLocalStream(stream);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      if (callType === 'video' && localVideoRef.current) localVideoRef.current.srcObject = stream;
      pc.ontrack = (e) => { if (e.streams[0]) setRemoteStream(e.streams[0]); };

      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const finalOffer = await waitForIceDone(pc);
        await callsAPI.sendOffer(callId, finalOffer.sdp);
        let tries = 0;
        const pollAns = setInterval(async () => {
          if (++tries > 30 || !peerConnectionRef.current) { clearInterval(pollAns); return; }
          try {
            const sig = await callsAPI.getWebRTCSignaling(callId);
            if (sig.answer_sdp && peerConnectionRef.current && !peerConnectionRef.current.remoteDescription) {
              clearInterval(pollAns);
              await peerConnectionRef.current.setRemoteDescription({ type: 'answer', sdp: sig.answer_sdp });
            }
          } catch {}
        }, 2000);
      } else {
        let tries = 0;
        const waitOffer = setInterval(async () => {
          if (++tries > 15 || !peerConnectionRef.current) { clearInterval(waitOffer); return; }
          try {
            const sig = await callsAPI.getWebRTCSignaling(callId);
            if (sig.offer_sdp && peerConnectionRef.current && !peerConnectionRef.current.remoteDescription) {
              clearInterval(waitOffer);
              await peerConnectionRef.current.setRemoteDescription({ type: 'offer', sdp: sig.offer_sdp });
              const answer = await peerConnectionRef.current.createAnswer();
              await peerConnectionRef.current.setLocalDescription(answer);
              const finalAns = await waitForIceDone(peerConnectionRef.current);
              await callsAPI.sendAnswer(callId, finalAns.sdp);
            }
          } catch {}
        }, 2000);
      }
      return true;
    } catch (e) { console.error('WebRTC error:', e); return false; }
  };

  const startCallEndPoll = (callId, type) => {
    if (callEndPollRef.current) clearInterval(callEndPollRef.current);
    callEndPollRef.current = setInterval(async () => {
      try {
        const call = await callsAPI.getById(callId);
        const done = !call || call.status === 'ended' || call.status === 'missed' || call.status === 'declined';
        if (done) {
          clearInterval(callEndPollRef.current);
          callEndPollRef.current = null;
          cleanupCall(false);
          if (type === 'video') { setShowVideoCallModal(false); setVideoCallStatus('ended'); }
          else { setShowCallModal(false); setCallStatus('ended'); }
          setActiveCallStartTime(null);
          addNotification('Call ended.', 'info');
        }
      } catch (err) {
        if (err?.status === 404) {
          clearInterval(callEndPollRef.current);
          callEndPollRef.current = null;
          cleanupCall(false);
          if (type === 'video') { setShowVideoCallModal(false); setVideoCallStatus('ended'); }
          else { setShowCallModal(false); setCallStatus('ended'); }
          setActiveCallStartTime(null);
          addNotification('Call ended.', 'info');
        }
      }
    }, 1500);
  };

  const cleanupCall = (shouldClearOutgoing = true) => {
    stopRingtone();
    if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }
    // Use ref (not state) so the correct stream is always stopped even in stale closures
    stopLocalStream();
    setRemoteStream(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (callDurationIntervalRef.current) { clearInterval(callDurationIntervalRef.current); callDurationIntervalRef.current = null; }
    if (callEndPollRef.current) { clearInterval(callEndPollRef.current); callEndPollRef.current = null; }
    if (shouldClearOutgoing) clearOutgoingCall();
    currentCallIdRef.current = null;
  };

  const handleJoinAnsweredCall = async (call) => {
    if (!call) return;
    const callId = typeof call === 'object' ? call.id : call;
    const isVideo = call?.call_type === 'video';
    
    currentCallIdRef.current = callId;
    callConversationIdRef.current = call?.conversation_id || activeConversationId;
    callTypeRef.current = isVideo ? 'video' : 'voice';
    isCallerRef.current = false;

    if (isVideo) {
      setShowVideoCallModal(true);
      setVideoCallStatus('connected');
    } else {
      setShowCallModal(true);
      setCallStatus('connected');
    }

    setActiveCallStartTime(Date.now());

    // Start WebRTC receiver peer connection
    const success = await startWebRTC(callId, false, isVideo ? 'video' : 'voice');
    if (!success) {
      addNotification('Could not establish media stream', 'error');
    }
    startCallEndPoll(callId, isVideo ? 'video' : 'voice');
  };

  useEffect(() => {
    if (pendingAnsweredCall) {
      const call = pendingAnsweredCall;
      setPendingAnsweredCall(null);
      handleJoinAnsweredCall(call);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAnsweredCall]);

  useEffect(() => {
    const handleCallAnsweredEvent = (e) => {
      if (e.detail) {
        handleJoinAnsweredCall(e.detail);
      }
    };
    window.addEventListener('nstp-call-answered', handleCallAnsweredEvent);
    return () => window.removeEventListener('nstp-call-answered', handleCallAnsweredEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Group call ─────────────────────────────────────────────────────
  const _handleGroupCall = async (type) => {
    if (!activeConversation) return;
    try {
      const callData = await callsAPI.initiate(activeConversation.id, type);
      // Group call: just notify and show outgoing screen; individual WebRTC answers come back via incoming call overlay
      if (callData.is_group) {
        const label = type === 'video' ? 'Video' : 'Voice';
        addNotification(`${label} call started — ringing all members...`, 'info');
        // Register all call ids so we can track any of them
        if (callData.call_ids && callData.call_ids.length > 0) {
          registerOutgoingCall(callData.call_ids[0]);
        }
      }
    } catch (err) {
      addNotification(err?.message || 'Could not start group call', 'error');
    }
  };

  // ── Voice call ─────────────────────────────────────────────────────
  const _handleCall = async () => {
    if (isBlocked) { addNotification('Cannot call a blocked user.', 'error'); return; }
    try {
      const callData = await callsAPI.initiate(activeConversation.id, 'voice');
      currentCallIdRef.current = callData.id;
      callConversationIdRef.current = activeConversation.id;
      callTypeRef.current = 'voice';
      isCallerRef.current = true;
      registerOutgoingCall(callData.id);
      setShowCallModal(true);
      setCallStatus('calling');
      startRingtone();
      addNotification(`Calling ${activeConversation?.with}...`, 'info');
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('busy') || msg.includes('already in a call')) {
        addNotification(msg, 'error');
      } else {
        addNotification('Could not start call. Please try again.', 'error');
      }
    }
  };

  const handleEndCall = async () => {
    const callId = currentCallIdRef.current;
    const convId = callConversationIdRef.current || activeConversation?.id;
    const wasConnected = callStatus === 'connected';
    const duration = wasConnected && activeCallStartTime ? Math.floor((Date.now() - activeCallStartTime) / 1000) : 0;
    cleanupCall(isCallerRef.current);
    setShowCallModal(false);
    setCallStatus('ended');
    setActiveCallStartTime(null);
    if (callId) { try { await callsAPI.end(callId, wasConnected ? 'ended' : 'missed'); } catch {} }
    if (convId) {
      if (!wasConnected) {
        sendMessage(convId, { sender: 'me', text: '📞 No answer', type: 'system', callType: 'voice', answered: false });
      } else {
        const m = Math.floor(duration / 60), s = duration % 60;
        const dur = m > 0 ? `${m}:${s.toString().padStart(2,'0')} min` : `${s} sec`;
        sendMessage(convId, { sender: 'me', text: `📞 Call ended • ${dur}`, type: 'system', callType: 'voice', answered: true, duration: dur });
      }
    }
  };

  // ── Video call ─────────────────────────────────────────────────────
  const _handleVideoCall = async () => {
    if (isBlocked) { addNotification('Cannot call a blocked user.', 'error'); return; }
    try {
      const callData = await callsAPI.initiate(activeConversation.id, 'video');

      currentCallIdRef.current = callData.id;
      callConversationIdRef.current = activeConversation.id;
      callTypeRef.current = 'video';
      isCallerRef.current = true;
      registerOutgoingCall(callData.id);
      setShowVideoCallModal(true);
      setVideoCallStatus('calling');
      startRingtone();
      addNotification(`Video calling ${activeConversation?.with}...`, 'info');
      // Show self-preview immediately
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch {
        addNotification('Could not access camera/microphone', 'error');
        cleanupCall(true);
        setShowVideoCallModal(false);
        try { await callsAPI.end(callData.id, 'ended'); } catch (_) {}
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('busy') || msg.includes('already in a call')) {
        addNotification(msg, 'error');
      } else {
        addNotification('Could not start video call. Please try again.', 'error');
      }
    }
  };

  const handleEndVideoCall = async () => {
    const callId = currentCallIdRef.current;
    const convId = callConversationIdRef.current;
    const wasConnected = videoCallStatus === 'connected';
    const duration = wasConnected && activeCallStartTime ? Math.floor((Date.now() - activeCallStartTime) / 1000) : 0;
    cleanupCall(isCallerRef.current);
    setShowVideoCallModal(false);
    setVideoCallStatus('ended');
    setActiveCallStartTime(null);
    if (callId) { try { await callsAPI.end(callId, wasConnected ? 'ended' : 'missed'); } catch {} }
    if (convId) {
      if (wasConnected) {
        const m = Math.floor(duration / 60), s = duration % 60;
        const dur = m > 0 ? `${m}:${s.toString().padStart(2,'0')} min` : `${s} sec`;
        sendMessage(convId, { sender: 'me', text: `📹 Video call ended • ${dur}`, type: 'system', callType: 'video', answered: true, duration: dur });
      } else {
        sendMessage(convId, { sender: 'me', text: '📹 No answer', type: 'system', callType: 'video', answered: false });
      }
    }
  };

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiList = ['😊', '👍', '❤️', '😂', '🎉', '👏', '🔥', '✅', '🙏', '😎', '🤔', '👋', '🌟', '💪', '✨', '🎵', '📸', '🎁', '🍕', '☕', '🌈', '🌺', '🌞', '💯', '🆗', '🎊', '🎈', '🎀', '🎄', '🎃', '🎅', '🤶', '🦃', '🐰', '🐣', '🌸', '🌼', '🌻', '🌹', '🌷', '🌱', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍄', '🌰', '🦋', '🐛', '🐝', '🐞', '🐜', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦛', '🐪', '🐫', '🦙', '🦒', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showChatMenu && chatMenuRef.current && !chatMenuRef.current.contains(e.target)) {
        setShowChatMenu(false);
      }
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (showAttachMenu && attachMenuRef.current && !attachMenuRef.current.contains(e.target) && !e.target.closest('[title="Add attachment"]')) {
        setShowAttachMenu(false);
      }
      if (showMessageMenu && !e.target.closest('[data-message-menu]')) {
        setShowMessageMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showChatMenu, showEmojiPicker, showAttachMenu, showMessageMenu]);

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
    setShowEmojiPicker(false);
  };

  const isMessageDeletedForMe = (message) => {
    if (message.deletedForMe) return true;
    const raw = message.deleted_for ?? message.deletedFor;
    if (!raw || !user?.id) return false;
    try {
      const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(arr) && arr.includes(user.id);
    } catch { return false; }
  };

  const isMessageDeletedForEveryone = (message) => {
    return message.deleted_for_everyone === true || message.deleted_for_everyone === 1 || message.type === 'deleted';
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsNearBottom(isBottom);
  };

  // Keep a ref to cameraStream so cleanup can always access latest value
  const cameraStreamRef = useRef(null);
  cameraStreamRef.current = cameraStream;

  // Set srcObject via effect (not inline callback ref) to prevent blinking on re-renders
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Initialise the drawing canvas when the modal opens — load background image if provided
  useEffect(() => {
    if (!showDrawModal) return;
    const tryInit = (attempts = 0) => {
      const canvas = drawCanvasRef.current;
      if (!canvas) {
        if (attempts < 25) requestAnimationFrame(() => tryInit(attempts + 1));
        return;
      }
      const bg = drawBgImageRef.current;
      if (bg) {
        const img = document.createElement('img');
        img.onload = () => {
          canvas.width = img.naturalWidth || 800;
          canvas.height = img.naturalHeight || 560;
          canvas.getContext('2d').drawImage(img, 0, 0);
        };
        img.src = bg;
      } else {
        canvas.width = 800;
        canvas.height = 560;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    // Small delay to let the modal render first
    setTimeout(() => tryInit(), 50);
  }, [showDrawModal]);

  // Attach local stream to local video element (self-preview / PIP)
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, videoCallStatus]);

  // Attach local & remote streams to video elements whenever call state or modals change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, videoCallStatus, showVideoCallModal]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, videoCallStatus, showVideoCallModal]);

  // Reset mobile soft-keyboard viewport scroll offset
  useEffect(() => {
    if (!window.visualViewport) return;
    const handleViewportReset = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    window.visualViewport.addEventListener('resize', handleViewportReset);
    return () => window.visualViewport.removeEventListener('resize', handleViewportReset);
  }, []);

  // After capturedPhoto state is set, the drawCanvasRef is now in the DOM — load the photo onto it
  useEffect(() => {
    if (!capturedPhoto) return;
    const tryLoad = (attempts = 0) => {
      const drawCanvas = drawCanvasRef.current;
      if (!drawCanvas) {
        // Canvas not mounted yet — retry on next frame
        if (attempts < 20) requestAnimationFrame(() => tryLoad(attempts + 1));
        return;
      }
      const img = document.createElement('img');
      img.onload = () => {
        drawCanvas.width = img.naturalWidth;
        drawCanvas.height = img.naturalHeight;
        drawCanvas.getContext('2d').drawImage(img, 0, 0);
      };
      img.src = capturedPhoto;
    };
    tryLoad();
  }, [capturedPhoto]);

  // Watch outgoing call status polled from App.jsx
  useEffect(() => {
    if (!outgoingCallStatus) return;
    const callId = currentCallIdRef.current;
    const type = callTypeRef.current;
    if (outgoingCallStatus === 'connected') {
      stopRingtone();
      const now = Date.now();
      setActiveCallStartTime(now);
      if (type === 'video') setVideoCallStatus('connected');
      else setCallStatus('connected');
      addNotification('Call connected!', 'success');
      if (callId) {
        startWebRTC(callId, true, type);
        startCallEndPoll(callId, type);
      }
      callDurationIntervalRef.current = setInterval(() => setCallTimerTick(t => t + 1), 1000);
    } else if (outgoingCallStatus === 'declined') {
      stopRingtone();
      addNotification('Call was declined', 'info');
      if (type === 'video') { setShowVideoCallModal(false); setVideoCallStatus('ended'); }
      else { setShowCallModal(false); setCallStatus('ended'); }
      cleanupCall(true);
      const convId = callConversationIdRef.current;
      if (convId) {
        const icon = type === 'video' ? '📹' : '📞';
        sendMessage(convId, { sender: 'me', text: `${icon} Call declined`, type: 'system', callType: type, answered: false });
      }
    } else if (outgoingCallStatus === 'missed') {
      stopRingtone();
      addNotification('Call was not answered', 'info');
      if (type === 'video') { setShowVideoCallModal(false); setVideoCallStatus('ended'); }
      else { setShowCallModal(false); setCallStatus('ended'); }
      cleanupCall(true);
      const convId = callConversationIdRef.current;
      if (convId) {
        const icon = type === 'video' ? '📹' : '📞';
        sendMessage(convId, { sender: 'me', text: `${icon} No answer`, type: 'system', callType: type, answered: false });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outgoingCallStatus]);

  // Handle call answered from IncomingCallOverlay (user was on a different page)
  useEffect(() => {
    const handleCallAnswered = (e) => {
      const call = e.detail || pendingAnsweredCall;
      if (!call) return;
      if (currentCallIdRef.current === call.id && (showCallModal || showVideoCallModal)) return;
      currentCallIdRef.current = call.id;
      callConversationIdRef.current = call.conversation_id;
      callTypeRef.current = call.call_type || 'voice';
      isCallerRef.current = false;
      setActiveCallStartTime(Date.now());
      if (call.call_type === 'video') {
        setShowVideoCallModal(true);
        setVideoCallStatus('connected');
      } else {
        setShowCallModal(true);
        setCallStatus('connected');
      }
      startCallEndPoll(call.id, call.call_type || 'voice');
      startWebRTC(call.id, false, call.call_type || 'voice');
    };

    window.addEventListener('nstp-call-answered', handleCallAnswered);
    if (pendingAnsweredCall) {
      handleCallAnswered({ detail: pendingAnsweredCall });
    }

    return () => window.removeEventListener('nstp-call-answered', handleCallAnswered);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAnsweredCall]);

  // Save active conversation ID to localStorage whenever it changes
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem('nstp_active_chat', activeConversationId);
    }
  }, [activeConversationId]);

  const isGroupConversation = (conversation) => {
    return !!(conversation?.isGroup || conversation?.is_group);
  };

  // Helper function to get the correct conversation partner name
  const getConversationPartnerName = (conversation) => {
    if (!conversation || !user) return '';
    
    // If it's a group chat, return the group name
    if (isGroupConversation(conversation)) {
      return conversation.groupName || conversation.group_name || conversation.name || 'All Instructors';
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
    if (!conversation || !user || isGroupConversation(conversation)) return null;
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
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMessages.length]);

  // Get user's own conversations only (private)
  const userConversations = getUserConversations();

  const filteredConversations = userConversations
    .filter(c => getConversationPartnerName(c).toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((c, idx, arr) => {
      // Deduplicate group chats by name — keep only the first occurrence
      if (!c.isGroup && !c.is_group) return true;
      const name = c.groupName || c.group_name || c.name;
      return arr.findIndex(x => (x.isGroup || x.is_group) && (x.groupName || x.group_name || x.name) === name) === idx;
    })
    .sort((a, b) => {
      const aName = getConversationPartnerName(a);
      const bName = getConversationPartnerName(b);
      if (aName === 'All Instructors') return -1;
      if (bName === 'All Instructors') return 1;
      return 0;
    });

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


  const handleClearChat = () => {
    if (!activeConversation) return;
    setConfirmModalData({
      title: 'Clear Chat',
      message: `Clear all messages in ${isGroupConversation(activeConversation) ? (activeConversation.groupName || activeConversation.group_name || 'this group') : activeConversation.with}?`,
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

  const handleDeleteConversation = () => {
    if (!activeConversation) return;
    setConfirmModalData({
      title: 'Delete Conversation',
      message: `Delete this conversation with ${activeConversation.with}? This removes it for both parties and cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: async () => {
        try {
          const targetId = activeConversation.id;
          await deleteConversation(targetId);

          // Auto-switch to next available conversation
          const remaining = (conversations || []).filter(c => String(c.id) !== String(targetId));
          if (remaining.length > 0) {
            setActiveConversationId(remaining[0].id);
          } else {
            setActiveConversationId(null);
          }

          setShowChatMenu(false);
          setShowConfirmModal(false);
        } catch {
          addNotification('Could not delete conversation.', 'error');
          setShowConfirmModal(false);
        }
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


  useEffect(() => {
    return () => {
      // Stop camera tracks on unmount only (not on every cameraStream change)
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  // Save active conversation ID to localStorage whenever it changes
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem('nstp_active_chat', activeConversationId);
    }
  }, [activeConversationId]);

  // Get user online status dynamically from backend last_active_at timestamp
  const getUserStatus = (userId) => {
    if (userId === user?.id) return 'online';
    const targetUser = (allUsers || []).find(u => Number(u.id) === Number(userId));
    if (!targetUser || !targetUser.last_active_at) return 'offline';
    const lastActive = new Date(targetUser.last_active_at).getTime();
    if (isNaN(lastActive)) return 'offline';
    const diffMs = Date.now() - lastActive;
    // Mark online if active within last 3 minutes
    return diffMs < 3 * 60 * 1000 ? 'online' : 'offline';
  };

  const getLastSeen = (userId) => {
    const targetUser = (allUsers || []).find(u => Number(u.id) === Number(userId));
    if (!targetUser || !targetUser.last_active_at) return 'recently';
    const lastActive = new Date(targetUser.last_active_at).getTime();
    if (isNaN(lastActive)) return 'recently';
    const diffSec = Math.floor((Date.now() - lastActive) / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min${diffMin !== 1 ? 's' : ''} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr${diffHr !== 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  };


  // Simple notification system
  const addNotification = (message, type = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 2000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Helper function to format civilian date & time: e.g. "August 18, 2026 12:00am"
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12

    return `${month} ${day}, ${year} ${hours}:${minutes}${ampm}`;
  };

  // Get user avatar display
  const getUserAvatar = (u) => {
    return (
      <img
        src={getAvatarSrc(u?.avatar, u?.profilePicture)}
        alt={u?.name || 'User'}
        className="w-9 h-9 sm:w-10 sm:h-10 object-cover rounded-full shadow-xs shrink-0 border border-emerald-600/30"
      />
    );
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-emerald-50/20 to-slate-50">
      {/* Simple Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`px-4 py-3 rounded-2xl shadow-xl text-white text-sm w-[min(20rem,90vw)] font-semibold ${
              n.type === 'success' ? 'bg-emerald-600' : 
              n.type === 'error' ? 'bg-rose-600' : 'bg-emerald-950'
            }`}
          >
            <div className="flex items-start justify-between">
              <p className="font-medium">{n.message}</p>
              <button type="button" 
                onClick={() => removeNotification(n.id)} 
                className="ml-2 text-white/70 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'lg:ml-64' : ''} h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden w-full max-w-full relative`}>
        {/* Conversations List - Hidden on mobile when chat is active */}
        <div className={`${showConversations ? 'flex' : 'hidden'} w-full bg-white/95 backdrop-blur-md border-r border-emerald-100 flex-col h-full overflow-hidden shadow-lg`}>
          <div className="p-3 sm:p-4">
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl border border-emerald-800/40 relative mb-3 w-full">
              <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 mb-3 relative z-10 w-full">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <button type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSidebarOpen(!sidebarOpen); }}
                    className="p-1.5 sm:p-2 bg-emerald-800/80 hover:bg-emerald-700 rounded-xl text-emerald-200 hover:text-white flex-shrink-0 touch-manipulation cursor-pointer"
                    title="Toggle menu"
                  >
                    <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-xl sm:rounded-2xl p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
                    <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain filter drop-shadow-xs scale-105" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h1 className="text-xs sm:text-lg lg:text-xl font-black tracking-tight text-white truncate">
                      {showContacts ? 'Contacts' : 'Messages'}
                    </h1>
                  </div>
                </div>

                {/* Toggle between conversations and contacts */}
                <button type="button"
                  onClick={() => setShowContacts(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0 ${showContacts ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-emerald-950 shadow-md' : 'bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-700/60'}`}
                  title={showContacts ? 'Back to chats' : 'View all contacts'}
                >
                  {showContacts
                    ? <><MessageSquare className="w-4 h-4" /> <span>Chats</span></>
                    : <><Users className="w-4 h-4" /> <span>Contacts</span></>}
                </button>
              </div>
              {!showContacts && (
                <div className="relative z-10">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-emerald-800/40 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-gray-900 font-medium"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">

                {/* ── Contacts panel ── */}
                {showContacts && (() => {
                  const contacts = (allUsers || []).filter(u => u.id !== user?.id && (u.role === 'admin' || u.role === 'instructor'));
                  if (contacts.length === 0) return (
                    <div className="text-center py-8 text-gray-500 px-4">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No other staff members yet</p>
                    </div>
                  );
                  const deptColor = { CWTS: 'bg-green-100 text-green-700', LTS: 'bg-purple-100 text-purple-700', ROTC: 'bg-red-100 text-red-700' };
                  return contacts.map(contact => (
                    <button key={contact.id}
                      type="button"
                      onClick={async () => {
                        setShowContacts(false);
                        const conv = await startConversation(contact);
                        if (conv?.id) {
                          handleSetActiveConversation(conv.id);
                        }
                      }}
                      className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-100 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold text-sm flex-shrink-0">
                        {contact.profilePicture
                          ? <img src={contact.profilePicture} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                          : contact.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{contact.name}</p>
                        <p className="text-xs text-gray-400 truncate">{contact.email}</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${contact.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : deptColor[contact.department] || 'bg-gray-100 text-gray-600'}`}>
                        {contact.role === 'admin' ? 'Admin' : contact.department}
                      </span>
                    </button>
                  ));
                })()}

                {/* ── Conversations list ── */}
                {!showContacts && filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 px-4">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No conversations yet</p>
                    <p className="mt-2 text-sm text-gray-400">Tap <strong>Contacts</strong> to message someone.</p>
                  </div>
                ) : !showContacts && (
                  filteredConversations.map((conversation) => {
                    const partner = getConversationPartner(conversation);
                    const conversationMessages = messages[conversation.id] || [];
                    const lastReadTime = readConversations[conversation.id] || 0;
                    const userCreatedTime = user?.created_at ? new Date(user.created_at).getTime() : 0;
                    const effectiveReadTime = lastReadTime || userCreatedTime || Date.now();
                    
                    // Count unread messages (messages that arrived after effective read time and not from current user)
                    const unreadCount = conversationMessages.filter(msg => {
                      const msgTime = new Date(msg.created_at || msg.timestamp || Date.now()).getTime();
                      const isOwnMessage = msg.senderId === user?.id || msg.sender_id === user?.id;
                      return msgTime > effectiveReadTime && !isOwnMessage;
                    }).length;
                    
                    // Check if there are new messages (red dot indicator)
                    const hasNewMessages = unreadCount > 0 && activeConversationId !== conversation.id;
                    
                    return (
                      <button type="button"
                        key={conversation.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSetActiveConversation(conversation.id);
                        }}
                        className={`w-full p-4 lg:p-5 flex items-center space-x-4 hover:bg-gray-50 transition-colors border-b border-gray-100 active:bg-gray-100 touch-manipulation cursor-pointer ${activeConversationId === conversation.id ? 'bg-green-50 border-l-4 border-l-green-600' : ''}`}
                      >
                        <div className="relative">
                          {isGroupConversation(conversation) ? getGroupAvatar(conversation) : getUserAvatar(partner)}
                          {/* Red dot indicator for new messages */}
                          {hasNewMessages && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800 text-base lg:text-lg truncate">
                              {getConversationPartnerName(conversation)}
                            </h3>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {(conversation.last_message_time || conversation.time)
                                ? new Date(conversation.last_message_time || conversation.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.last_message || conversation.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                        {/* Show unread count badge */}
                        {hasNewMessages && (
                          <span className="w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
          </div>
        </div>

        {/* Chat Area - Full width on mobile when active */}
        <div className={`${!showConversations ? 'flex' : 'hidden'} flex-1 flex-col bg-gray-50 w-full max-w-full h-full min-h-0 max-h-full overflow-hidden relative`}>
          {activeConversation ? (
            <>
              {/* Hidden audio element for remote WebRTC audio stream */}
              <audio ref={(el) => { if (el && remoteStream) el.srcObject = remoteStream; }} autoPlay playsInline className="hidden" />

              {/* Chat Header */}
              <div className="bg-white px-2.5 py-2 sm:p-3 lg:p-4 border-b border-gray-200 flex items-center justify-between gap-1.5 flex-shrink-0 w-full max-w-full relative z-30">
                <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0 flex-1">
                  {/* Back button - only needed on mobile */}
                  <button type="button"
                    onClick={handleBackToConversations}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 active:scale-95 rounded-lg flex-shrink-0 touch-manipulation cursor-pointer transition-transform"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-shrink-0">
                    {isGroupConversation(activeConversation) ? getGroupAvatar(activeConversation) : getUserAvatar(getConversationPartner(activeConversation))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base truncate leading-tight">{activePartnerName}</h3>
                    {isGroupConversation(activeConversation) ? (
                      <p className="text-[10px] sm:text-xs text-gray-500 flex items-center leading-tight">
                        <span className="truncate">{activeConversation.participants?.length || 2} participants</span>
                      </p>
                    ) : (
                      (() => {
                        const partner = getConversationPartner(activeConversation);
                        const partnerId = partner?.id;
                        const status = getUserStatus(partnerId);
                        const isOnline = status === 'online';
                        return (
                          <p className={`text-[10px] sm:text-xs flex items-center leading-tight ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            <span className="truncate">{isOnline ? 'Online' : `Last seen ${getLastSeen(partnerId)}`}</span>
                          </p>
                        );
                      })()
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-0.5 sm:space-x-1 flex-shrink-0">
                  {!isGroupConversation(activeConversation) && (
                  <div className="relative" ref={chatMenuRef}>
                    <button type="button"
                      onClick={() => setShowChatMenu(!showChatMenu)}
                      className="p-1.5 sm:p-2 text-gray-700 hover:bg-gray-100 active:scale-95 rounded-full transition-all touch-manipulation cursor-pointer"
                      title="More Options"
                      aria-label="More options"
                    >
                      <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    {showChatMenu && (
                      <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-2xl border border-gray-200/90 py-1.5 z-[999] min-w-[190px] font-bold text-xs sm:text-sm animate-fade-in">
                        <button type="button"
                          onClick={handleClearChat}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                        >
                          Clear Chat
                        </button>
                        <button type="button"
                          onClick={handleDeleteConversation}
                          className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                        >
                          Delete Conversation
                        </button>
                        <button type="button"
                          onClick={handleBlockUser}
                          className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 transition-colors cursor-pointer ${isBlocked ? 'text-emerald-700 font-extrabold' : 'text-rose-600'}`}
                        >
                          {isBlocked ? 'Unblock User' : 'Block User'}
                        </button>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              </div>

              {/* Active Voice Recording Notification Banner - Highly Visible on Mobile & Desktop */}
              {isRecording && (
                <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-3 sm:px-4 py-2.5 shadow-lg flex items-center justify-between gap-2 z-40 animate-pulse border-b border-red-500 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-3 w-3 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    <Mic className="w-4 h-4 text-white animate-bounce shrink-0" />
                    <span className="font-black text-xs sm:text-sm tracking-wider uppercase truncate">
                      RECORDING VOICE MESSAGE ({Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={cancelVoiceRecording}
                      className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-extrabold transition-colors cursor-pointer touch-manipulation"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleVoiceToggle}
                      className="px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-black transition-colors cursor-pointer shadow-xs touch-manipulation"
                    >
                      Send 🚀
                    </button>
                  </div>
                </div>
              )}

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
                        <span className="font-bold">Blocked</span> — You cannot send messages or call this user. <button type="button" onClick={handleBlockUser} className="underline font-medium">Unblock</button>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-3 overscroll-contain w-full max-w-full"
              >
              <div className="space-y-3 w-full max-w-full overflow-hidden">
                {currentMessages.map((message) => {
                  const isOwn = message.senderId === user?.id || message.sender_id === user?.id;
                  const deletedForEveryone = isMessageDeletedForEveryone(message);
                  const deletedForMe = isMessageDeletedForMe(message) || deletedForEveryone;
                  
                  if (deletedForMe) {
                    return (
                      <div key={message.id} className={`flex w-full items-end gap-1.5 sm:gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} overflow-hidden max-w-full`}>
                        {/* Avatar always first in DOM — flex-row-reverse keeps it on the right for own messages */}
                        <div className="flex-shrink-0 self-end mb-1">
                          {isOwn ? (
                            <img src={getAvatarSrc(user?.avatar, user?.profilePicture)} alt="Me" className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-full shadow-xs" />
                          ) : (
                            (() => {
                              const senderUser = allUsers.find(u => u.id === message.senderId) || allUsers.find(u => u.id === message.sender_id);
                              return (
                                <img src={getAvatarSrc(senderUser?.avatar, senderUser?.profilePicture)} alt={senderUser?.name || 'User'} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-full shadow-xs" />
                              );
                            })()
                          )}
                        </div>
                        <div className={`max-w-[78%] sm:max-w-[85%] px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl ${isOwn ? 'bg-blue-200 text-blue-400 rounded-br-none' : 'bg-gray-100 text-gray-500 rounded-bl-none'}`}>
                          <p className="italic text-xs sm:text-sm">Message deleted</p>
                        </div>
                      </div>
                    );
                  }

                  // ── System messages (call logs, join notifications): centred pill ──
                  const isSystemCall = message.type === 'system' || message.message_type === 'system';
                  if (isSystemCall) {
                    const answered = message.answered === true || message.answered === 1;
                    const callText = message.text || '';
                    const isJoin = callText.includes('joined the group');
                    return (
                      <div key={message.id} className="flex justify-center my-1 max-w-full overflow-hidden">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium shadow-xs truncate max-w-[90%]
                          ${isJoin
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : answered
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                          {isJoin && <span>👋</span>}
                          <span className="truncate">{callText}</span>
                          <span className="text-gray-400 text-[10px] flex-shrink-0">
                            {formatDate(message.created_at || message.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={message.id}
                         data-is-own={isOwn}
                         className={`flex w-full items-end gap-1.5 sm:gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} overflow-hidden max-w-full`}>
                      {/* Avatar */}
                      <div className="flex-shrink-0 self-end mb-1">
                        {isOwn ? (
                          <img 
                            src={getAvatarSrc(user?.avatar, user?.profilePicture)} 
                            alt="Me" 
                            className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-full shadow-xs"
                          />
                        ) : (
                          (() => {
                            const senderUser = allUsers.find(u => u.id === message.senderId) || 
                                               allUsers.find(u => u.id === message.sender_id) ||
                                               activeConversation?.participantDetails?.find(p => p.id === message.senderId || p.id === message.sender_id);
                            return (
                              <img 
                                src={getAvatarSrc(senderUser?.avatar, senderUser?.profilePicture)} 
                                alt={senderUser?.name || 'User'} 
                                className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-full shadow-xs"
                              />
                            );
                          })()
                        )}
                      </div>
                      
                      {/* Message Content */}
                      <div className="group relative max-w-[78%] sm:max-w-[85%] min-w-0">
                        {/* Sender name - only for others */}
                        {!isOwn && (
                          <span className="text-[11px] sm:text-xs font-medium text-gray-500 block mb-0.5 ml-1 truncate">
                            {message.senderName}
                          </span>
                        )}
                        
                        <div
                          className={`rounded-2xl ${
                            (message.type === 'image' || message.message_type === 'image') && (message.imageUrl || message.image_url || message.file_url)
                              ? `overflow-hidden ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'}`
                              : `px-3 py-1.5 sm:px-4 sm:py-2 ${isOwn ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-xs'}`
                          }`}
                        >
                          {editingMessage?.id === message.id ? (
                            <div className="flex items-center space-x-2 px-2 py-1">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="flex-1 px-2 py-1 text-xs sm:text-sm bg-white text-gray-800 rounded border"
                                onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(); } }}
                              />
                              <button type="button" onClick={handleSaveEdit} className="text-green-600 hover:text-green-700 font-bold">✓</button>
                              <button type="button" onClick={handleCancelEdit} className="text-red-500 hover:text-red-600 font-bold">✕</button>
                            </div>
                          ) : (
                            <>
                              {/* Image Messages - no bubble, just the image with matching rounded corners */}
                              {(message.type === 'image' || message.message_type === 'image') && (message.imageUrl || message.image_url || message.file_url) ? (
                                <img
                                  src={message.imageUrl || message.image_url || message.file_url}
                                  alt="Shared"
                                  className="max-w-full max-h-56 sm:max-h-64 rounded-xl block cursor-pointer hover:opacity-90 object-cover"
                                  onClick={() => handleImageClick(message.imageUrl || message.image_url || message.file_url)}
                                />
                              ) : (message.type === 'file' || message.message_type === 'file') && (message.fileName || message.file_name) ? (
                                /* File Messages with download */
                                <button type="button"
                                  onClick={async () => {
                                    const fileUrl = message.fileUrl || message.file_url || message.image_url;
                                    const fileName = message.fileName || message.file_name || 'download';
                                    if (!fileUrl) {
                                      addNotification('File not available for download', 'error');
                                      return;
                                    }
                                    
                                    try {
                                      if (fileUrl.startsWith('data:')) {
                                        const link = document.createElement('a');
                                        link.href = fileUrl;
                                        link.download = fileName;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        addNotification('File downloaded!', 'success');
                                      } else {
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
                                  className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-colors border border-gray-200 cursor-pointer text-left w-full overflow-hidden"
                                >
                                  <Paperclip className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-xs font-medium text-gray-800 truncate">{message.fileName || message.file_name}</span>
                                    <span className="text-[10px] text-blue-600 underline">Click to download</span>
                                  </div>
                                </button>
                              ) : (message.type === 'voice' || message.message_type === 'voice') && (message.audioUrl || message.audio_url) ? (
                                /* Voice Messages with play button */
                                <button type="button" 
                                  onClick={() => handlePlayVoice(message)}
                                  className={`flex items-center space-x-2 rounded-lg p-2 transition-colors min-w-[130px] max-w-full ${
                                    isPlaying === message.id
                                      ? 'bg-green-100 border border-green-500 text-green-700' 
                                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {isPlaying === message.id ? (
                                    <>
                                      <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      </div>
                                      <div className="flex flex-col items-start min-w-0">
                                        <span className="text-xs font-medium">Playing...</span>
                                        <div className="w-16 h-1 bg-gray-300 rounded-full mt-0.5 overflow-hidden">
                                          <div className="h-full bg-green-500 animate-pulse" style={{width: '60%'}}></div>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                                      </div>
                                      <div className="flex flex-col items-start min-w-0">
                                        <span className="text-xs font-medium">Voice Note</span>
                                        <span className="text-[10px] text-gray-500">{message.duration || message.text || 'Click to play'}</span>
                                      </div>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <p className="break-words whitespace-pre-wrap overflow-hidden text-xs sm:text-sm leading-relaxed">{message.text || message.content || ''}</p>
                              )}
                            </>
                          )}
                        </div>
                        
                        {/* Time outside bubble */}
                        <div className={`text-[10px] mt-0.5 ${isOwn ? 'text-right mr-1 text-gray-400' : 'ml-1 text-gray-400'}`}>
                          {(() => {
                              const messageTime = message.created_at ? formatDate(message.created_at) : 
                                                  message.timestamp ? formatDate(message.timestamp) : 
                                                  message.time ? message.time : '';
                              return (
                                <>
                                  <span>{messageTime}</span>
                                  {Boolean(message.edited) && <span className="ml-1">(edited)</span>}
                                </>
                              );
                            })()}
                        </div>

                        {/* Reactions */}
                        {message.reactions && Object.keys(message.reactions).length > 0 && (
                          <div className={`flex gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {Object.entries(message.reactions).map(([emoji, users]) => (
                              users.length > 0 && (
                                <button type="button"
                                  key={emoji}
                                  onClick={() => handleReaction(message.id, emoji)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${users.includes(user?.id) ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}
                                >
                                  {emoji} {users.length}
                                </button>
                              )
                            ))}
                          </div>
                        )}

                        {/* Message Menu Button */}
                        {editingMessage?.id !== message.id && (
                          <div data-message-menu className={`absolute top-1 ${isOwn ? '-left-6' : '-right-6'} opacity-75 sm:opacity-0 group-hover:opacity-100 transition-opacity`}>
                            <button type="button"
                              onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
                              className="p-1 text-gray-500 hover:text-gray-700 active:scale-95 touch-manipulation cursor-pointer"
                              title="Options"
                            >
                              <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        )}

                        {/* Message Options Menu */}
                        {showMessageMenu === message.id && (
                          <div data-message-menu className={`absolute top-7 ${isOwn ? 'right-0' : 'left-0'} bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 z-40 min-w-[150px] max-w-[200px] animate-fade-in`}>
                            {/* Emoji Reactions */}
                            <div className="flex gap-1 px-2 py-1 border-b border-gray-100">
                              {EMOJI_LIST.map(emoji => (
                                <button type="button"
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
                              <button type="button"
                                onClick={() => handleStartEdit(message)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                Edit
                              </button>
                            )}
                            
                            {/* Delete options */}
                            {isOwn ? (
                              <>
                                <button type="button"
                                  onClick={() => handleDelete(message.id, false)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600"
                                >
                                  Delete for me
                                </button>
                                <button type="button"
                                  onClick={() => handleDelete(message.id, true)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600"
                                >
                                  Delete for everyone
                                </button>
                              </>
                            ) : (
                              <button type="button"
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
              </div>

              {/* Input Area - Ultra Sleek Single Line Height */}
              <div className="bg-white px-2 py-1.5 sm:px-3 sm:py-2 border-t border-gray-200 flex-shrink-0 relative">
                {/* Hidden File Inputs */}
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <input type="file" ref={galleryInputRef} onChange={handleGallerySelect} accept="image/*" className="hidden" />
                <input type="file" ref={cameraInputRef} onChange={handleCameraCapture} accept="image/*" capture="environment" className="hidden" />
                
                {/* Mobile Attachment Popover */}
                {showAttachMenu && (
                  <div ref={attachMenuRef} className="absolute bottom-14 left-2 bg-white rounded-2xl shadow-2xl border border-emerald-100 p-2 z-40 flex flex-col gap-1 min-w-[160px] animate-fade-in sm:hidden">
                    <button type="button" onClick={() => { handleFileAttach(); setShowAttachMenu(false); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 rounded-xl active:bg-emerald-100">
                      <Paperclip className="w-4 h-4 text-emerald-600" /> Attach File
                    </button>
                    <button type="button" onClick={() => { handleGallery(); setShowAttachMenu(false); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 rounded-xl active:bg-emerald-100">
                      <Image className="w-4 h-4 text-blue-600" /> Photo Gallery
                    </button>
                    <button type="button" onClick={() => { handleCamera(); setShowAttachMenu(false); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 rounded-xl active:bg-emerald-100">
                      <Camera className="w-4 h-4 text-amber-600" /> Live Camera
                    </button>
                    <button type="button" onClick={() => { handleVoiceToggle(); setShowAttachMenu(false); }} className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 rounded-xl active:bg-emerald-100">
                      <Mic className="w-4 h-4 text-rose-600" /> Voice Message
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Mobile Single Plus Button */}
                  <button type="button"
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className="sm:hidden p-1.5 text-gray-600 hover:bg-gray-100 active:scale-95 rounded-full touch-manipulation cursor-pointer transition-transform flex-shrink-0"
                    title="Add attachment"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  {/* Desktop Side-by-side Attachment Buttons */}
                  <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={handleFileAttach} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg active:scale-95 transition-all touch-manipulation flex-shrink-0" title="Attach File">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={handleGallery} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg active:scale-95 transition-all touch-manipulation flex-shrink-0" title="Gallery">
                      <Image className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={handleCamera} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg active:scale-95 transition-all touch-manipulation flex-shrink-0" title="Live Camera">
                      <Camera className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={handleVoiceToggle} className={`p-1.5 rounded-lg active:scale-95 transition-all touch-manipulation flex-shrink-0 ${isRecording ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`} title={isRecording ? 'Stop Recording' : 'Voice Message'}>
                      <Mic className="w-5 h-5" />
                      {isRecording && <span className="ml-1 text-xs">{recordingTime}s</span>}
                    </button>
                  </div>

                  {isRecording ? (
                    <div className="flex-1 flex items-center justify-between bg-red-50 border-2 border-red-500/80 rounded-2xl px-3 py-1.5 shadow-xs gap-2 min-w-0 animate-pulse">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                        </span>
                        <Mic className="w-4 h-4 text-red-600 shrink-0 animate-bounce" />
                        <span className="text-xs font-black text-red-700 truncate">
                          Recording ({recordingTime}s)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={cancelVoiceRecording}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-[11px] font-extrabold transition-colors cursor-pointer touch-manipulation"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleVoiceToggle}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-black transition-colors cursor-pointer shadow-xs touch-manipulation"
                        >
                          Send 🚀
                        </button>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onBlur={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                      placeholder="Type a message..."
                      className="flex-1 min-w-0 px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-full sm:rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  )}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 active:scale-95 rounded-full transition-all touch-manipulation flex-shrink-0"
                      title="Add Emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div ref={emojiPickerRef} className="absolute bottom-14 right-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 z-30 w-64 max-w-[calc(100vw-1rem)]">
                        <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                          {emojiList.map((emoji, index) => (
                            <button key={index}
                              type="button"
                              onClick={() => handleEmojiSelect(emoji)}
                              className="text-lg hover:bg-gray-100 rounded p-1 transition-colors touch-manipulation active:scale-125"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <button type="button"
                          onClick={() => setShowEmojiPicker(false)}
                          className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 py-1.5 touch-manipulation font-semibold"
                        >
                          Close
                        </button>
                      </div>
                    )}
                    <button type="button"
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className="p-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-full transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation flex-shrink-0 shadow-sm"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 bg-gray-50/50">
              <div className="text-center max-w-sm mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Select a Conversation</h3>
                <p className="text-sm text-gray-500 mb-6">Choose someone from your contact list or start a new chat to begin messaging.</p>
                <button
                  type="button"
                  onClick={() => setShowContacts(true)}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium text-sm rounded-xl transition-all shadow-sm shadow-green-700/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Chat
                </button>
              </div>
            </div>
          )}
          {/* Image Viewer Modal with Inline Editing */}
          {imageViewerOpen && selectedImageUrl && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
              <div className="bg-gray-900 rounded-lg p-3 sm:p-4 max-w-5xl w-full mx-auto max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Image Viewer</h3>
                  <div className="flex items-center gap-2">
                    <button type="button"
                      onClick={handleDownloadImage}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 sm:gap-2 text-sm touch-manipulation"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                    <button type="button"
                      onClick={handleCloseImageViewer}
                      className="p-1.5 sm:p-2 text-white hover:bg-gray-700 rounded-lg touch-manipulation"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-800 rounded-lg">
                  <img
                    src={selectedImageUrl}
                    alt="Full size"
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Call Modal */}
          {showCallModal && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in">
              <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 max-w-sm w-full mx-auto text-center max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="mb-6 sm:mb-8">
                  {/* Avatar */}
                  <div className="relative mx-auto mb-4">
                    {activeConversation && !isGroupConversation(activeConversation) ? (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full overflow-hidden bg-gray-700 border-4 border-gray-700">
                        {(() => {
                          const partner = getConversationPartner(activeConversation);
                          return (
                            <img
                              src={getAvatarSrc(partner?.avatar, partner?.profilePicture)}
                              alt={partner?.name || 'Partner'}
                              className="w-full h-full object-cover"
                            />
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
                    <button type="button" 
                      onClick={handleEndCall}
                      className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center touch-manipulation transition-transform hover:scale-105"
                    >
                      <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </button>
                  )}
                  {callStatus === 'connected' && (
                    <>
                      {/* Mute */}
                      <button type="button" 
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
                      <button type="button" 
                        onClick={handleEndCall}
                        className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center touch-manipulation transition-transform hover:scale-105"
                      >
                        <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </button>
                      
                      {/* Speaker */}
                      <button type="button" 
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
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in">
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
                  {/* Main area: other person's camera when connected, own camera while calling */}
                  {videoCallStatus === 'connected' ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Self view PIP — own camera, small, bottom-right */}
                  {videoCallStatus === 'connected' && (
                    <div className="absolute bottom-4 right-4 w-32 h-24 sm:w-40 sm:h-32 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Waiting for remote video overlay */}
                  {videoCallStatus === 'connected' && !remoteStream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <p className="text-white text-sm animate-pulse">Connecting video...</p>
                    </div>
                  )}
                </div>
                
                {/* Control Buttons */}
                <div className="flex justify-center items-center gap-4">
                  {/* Mute Button */}
                  <button type="button" 
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
                  <button type="button" 
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
                  <button type="button" 
                    onClick={handleEndVideoCall}
                    className="p-3 sm:p-4 bg-red-500 hover:bg-red-600 rounded-full text-white touch-manipulation"
                    title="End Call"
                  >
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  
                  {/* Speaker Button */}
                  <button type="button" 
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
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
              <div className="bg-gray-900 rounded-xl p-4 sm:p-6 max-w-4xl w-full mx-auto max-h-[95vh] flex flex-col">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    {capturedPhoto ? 'Preview Photo' : 'Camera'}
                  </h3>
                  <button type="button" 
                    onClick={handleCloseCamera}
                    className="p-2 text-white hover:bg-gray-700 rounded-lg touch-manipulation"
                    aria-label="Close camera"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 relative bg-black rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: '50vh', maxHeight: '70vh' }}>
                  {!capturedPhoto ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ maxHeight: '70vh' }} />
                  ) : (
                    <img src={capturedPhoto} alt="Captured" className="w-full h-full object-contain" style={{ maxHeight: '70vh' }} />
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="flex justify-center items-center gap-4 mt-4 sm:mt-6">
                  {!capturedPhoto ? (
                    <button type="button" onClick={handleCapturePhoto} className="p-4 sm:p-5 bg-white rounded-full touch-manipulation hover:bg-gray-200 transition-colors" title="Take Photo">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 border-gray-800 bg-white"></div>
                    </button>
                  ) : (
                    <>
                      <button type="button" onClick={handleRetakePhoto} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-medium text-sm sm:text-base touch-manipulation flex items-center gap-2">
                        <X className="w-5 h-5" /> Retake
                      </button>
                      <button 
                        type="button" 
                        onClick={handleSendPhoto} 
                        disabled={isSendingMedia}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-full font-medium text-sm sm:text-base touch-manipulation flex items-center gap-2 cursor-pointer"
                      >
                        <Send className="w-5 h-5" /> {isSendingMedia ? 'Sending...' : 'Send Photo'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Drawing Board Modal */}
          {showDrawModal && (
            <div className="fixed inset-0 bg-black/80 flex flex-col z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white flex-shrink-0">
                <span className="font-semibold text-sm">🎨 Drawing Board</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleDrawUndo} disabled={drawHistoryLen === 0 && textLayers.length === 0}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 hover:bg-gray-600 disabled:opacity-30 transition-colors">
                    ↩ Undo
                  </button>
                  <button type="button" onClick={handleDrawClear}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 hover:bg-gray-600 transition-colors">
                    Clear
                  </button>
                  <button type="button" onClick={() => setShowDrawModal(false)}
                    className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Canvas + text overlays */}
              <div className="flex-1 overflow-hidden bg-gray-800 flex items-center justify-center p-2"
                onMouseMove={onDragTextMove} onMouseUp={onDragTextEnd}
                onTouchMove={onDragTextMove} onTouchEnd={onDragTextEnd}>
                <div ref={drawCanvasWrapRef} style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '100%' }}>
                  <canvas
                    ref={drawCanvasRef}
                    className="rounded-lg touch-none block"
                    style={{ maxWidth: '100%', maxHeight: '100%', cursor: drawTool === 'text' ? 'text' : 'crosshair', background: '#fff' }}
                    onMouseDown={handleDrawPointerDown}
                    onMouseMove={handleDrawPointerMove}
                    onMouseUp={handleDrawPointerUp}
                    onMouseLeave={handleDrawPointerUp}
                    onTouchStart={handleDrawPointerDown}
                    onTouchMove={handleDrawPointerMove}
                    onTouchEnd={handleDrawPointerUp}
                  />
                  {/* Movable text overlays */}
                  {textLayers.map(layer => {
                    const canvas = drawCanvasRef.current;
                    const rect = canvas ? canvas.getBoundingClientRect() : null;
                    const scaleX = rect && canvas ? rect.width / canvas.width : 1;
                    const scaleY = rect && canvas ? rect.height / canvas.height : 1;
                    const cssX = layer.canvasX * scaleX;
                    const cssY = layer.canvasY * scaleY;
                    const cssFontSize = Math.max(8, layer.fontSize * scaleY);
                    return (
                      <div key={layer.id} style={{
                        position: 'absolute', left: cssX, top: cssY,
                        color: layer.color, fontSize: cssFontSize,
                        fontWeight: 'bold', fontFamily: 'sans-serif',
                        whiteSpace: 'nowrap', userSelect: 'none', touchAction: 'none',
                        cursor: 'move', lineHeight: 1,
                        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                        display: 'flex', alignItems: 'flex-start', gap: 2,
                      }}
                        onMouseDown={(e) => startDragText(e, layer.id)}
                        onTouchStart={(e) => startDragText(e, layer.id)}
                      >
                        <span>{layer.text}</span>
                        {/* Resize and delete controls */}
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 1, marginLeft: 2 }}>
                          <button type="button"
                            style={{ fontSize: 9, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', padding: '1px 3px', lineHeight: 1 }}
                            onMouseDown={e => e.stopPropagation()} onClick={() => resizeTextLayer(layer.id, 4)}>+</button>
                          <button type="button"
                            style={{ fontSize: 9, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', padding: '1px 3px', lineHeight: 1 }}
                            onMouseDown={e => e.stopPropagation()} onClick={() => resizeTextLayer(layer.id, -4)}>−</button>
                          <button type="button"
                            style={{ fontSize: 9, background: 'rgba(200,0,0,0.7)', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', padding: '1px 3px', lineHeight: 1 }}
                            onMouseDown={e => e.stopPropagation()} onClick={() => setTextLayers(prev => prev.filter(l => l.id !== layer.id))}>✕</button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Controls */}
              <div className="bg-gray-900 text-white px-4 py-3 space-y-3 flex-shrink-0">

                {/* Tool row */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-10">Tool</span>
                  <div className="flex gap-2">
                    {[
                      { id: 'pen', label: '✏️ Draw' },
                      { id: 'eraser', label: '🧹 Erase' },
                      { id: 'text', label: '🔤 Text' },
                      { id: 'emoji', label: '😊 Emoji' },
                    ].map(t => (
                      <button key={t.id} type="button" onClick={() => { setDrawTool(t.id); setDrawTextPos(null); }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${drawTool === t.id ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color row */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-10">Color</span>
                  <div className="flex gap-2 flex-wrap">
                    {['#1a1a1a', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#ffffff'].map(c => (
                      <button key={c} type="button" onClick={() => setDrawColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${drawColor === c ? 'border-white scale-110' : 'border-gray-600'}`}
                        style={{ background: c }} />
                    ))}
                    <label className="w-7 h-7 rounded-full border-2 border-gray-600 overflow-hidden cursor-pointer" title="Custom color">
                      <input type="color" value={drawColor} onChange={e => setDrawColor(e.target.value)} className="w-full h-full opacity-0 cursor-pointer" />
                      <div className="w-full h-full -mt-7 flex items-center justify-center text-xs">🎨</div>
                    </label>
                  </div>
                </div>

                {/* Size row */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-10">Size</span>
                  <div className="flex gap-2">
                    {[{ v: 2, label: 'S' }, { v: 4, label: 'M' }, { v: 8, label: 'L' }, { v: 16, label: 'XL' }].map(s => (
                      <button key={s.v} type="button" onClick={() => setDrawBrushSize(s.v)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${drawBrushSize === s.v ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text tool input */}
                {drawTool === 'text' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-10 flex-shrink-0">{drawTextPos ? '📍 Set' : '📍 Tap'}</span>
                    <input
                      type="text"
                      value={drawText}
                      onChange={e => setDrawText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && commitDrawText()}
                      placeholder={drawTextPos ? 'Type then press Place...' : 'Tap on canvas first...'}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-gray-700 text-white text-sm outline-none border border-gray-600 focus:border-green-500"
                    />
                    <button type="button" onClick={commitDrawText} disabled={!drawText.trim() || !drawTextPos}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-30 rounded-lg text-xs font-semibold transition-colors">
                      Place
                    </button>
                  </div>
                )}

                {/* Emoji tool */}
                {drawTool === 'emoji' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-10 flex-shrink-0">Pick</span>
                    <div className="flex gap-1 flex-wrap">
                      {['😊', '😂', '❤️', '👍', '🔥', '🎉', '😎', '🙏', '✨', '💯', '👋', '🌟', '🤔', '😍', '🎨', '⭐'].map(em => (
                        <button type="button" key={em} onClick={() => setDrawSelectedEmoji(em)}
                          className={`text-lg w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${drawSelectedEmoji === em ? 'bg-green-600' : 'hover:bg-gray-700'}`}>
                          {em}
                        </button>
                      ))}
                    </div>
                    <span className="text-2xl ml-1">{drawSelectedEmoji}</span>
                  </div>
                )}

                {/* Send button */}
                <div className="flex justify-end">
                  <button type="button" onClick={handleDrawSend}
                    className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm">
                    <Send className="w-4 h-4" /> Send Drawing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Modal */}
          {showConfirmModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in">
              <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-auto shadow-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">{confirmModalData.title}</h3>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">{confirmModalData.message}</p>
                <div className="flex justify-end space-x-2 sm:space-x-3">
                  <button type="button" 
                    onClick={() => setShowConfirmModal(false)}
                    className="px-3 py-2 sm:px-4 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
                  >
                    {confirmModalData.cancelText}
                  </button>
                  <button type="button" 
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
    </div>
  );
}

export default Chat;
