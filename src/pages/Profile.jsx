import { useAuth } from '../App';
import {
  LayoutDashboard, Users, FileText, MessageSquare,
  LogOut, User, Camera, Mail, Phone,
  Building, Shield, Save, Lock, Eye, EyeOff, Upload, X, Menu,
  Calendar, CheckCircle, AlertCircle, Pencil, Type, Smile, RotateCcw, Check, SwitchCamera,
  UserPlus, Trash2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { usersAPI, getAllInstructorsGroup } from '../services/api';

const QUICK_EMOJIS = ['😊','😂','❤️','👍','🎉','🔥','✨','😎','🙏','💪','🤩','😍','🥳','😘','👏','🌟','💯','🥰','😆','🤔'];
const DRAW_COLORS = ['#000000','#ffffff','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#06b6d4'];

// Pre-defined avatar options
const AVATAR_OPTIONS = [
  { id: 'default', color: 'bg-gray-400', icon: '👤' },
  { id: 'green', color: 'bg-green-500', icon: '🎓' },
  { id: 'blue', color: 'bg-blue-500', icon: '👨‍🏫' },
  { id: 'purple', color: 'bg-purple-500', icon: '👩‍🏫' },
  { id: 'red', color: 'bg-red-500', icon: '👮' },
  { id: 'yellow', color: 'bg-yellow-500', icon: '⭐' },
];

function Profile() {
  const { user, logout, updateUser, changePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: user?.avatar || 'default',
    profilePicture: user?.profilePicture || null
  });

  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const fileInputRef = useRef(null);

  // Camera + editor state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [capturedImage, setCapturedImage] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editorMode, setEditorMode] = useState('draw'); // 'draw' | 'text' | 'emoji'
  const [drawColor, setDrawColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [editorText, setEditorText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [history, setHistory] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const videoRef = useRef(null);
  const editorCanvasRef = useRef(null);
  const drawLastPos = useRef(null);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
      setCameraStream(stream);
      setShowCameraModal(true);
      setCapturedImage(null);
      setShowEditor(false);
    } catch {
      setNotification({ type: 'error', message: 'Camera access denied. Please allow camera in browser settings.' });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const flipCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newMode }, audio: false });
        setCameraStream(stream);
      } catch { /* ignore */ }
    }
  };

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    // No mirror — draw as-is (natural orientation)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
    setShowEditor(true);
    setHistory([dataUrl]);
    setEditorMode('draw');
  };

  useEffect(() => {
    if (showEditor && capturedImage && editorCanvasRef.current) {
      const canvas = editorCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = capturedImage;
    }
  }, [showEditor, capturedImage]);

  const saveHistoryState = () => {
    if (!editorCanvasRef.current) return;
    const snap = editorCanvasRef.current.toDataURL('image/jpeg', 0.9);
    setHistory(prev => [...prev.slice(-19), snap]);
  };

  const undoEditor = () => {
    if (history.length <= 1) return;
    const prev = history[history.length - 2];
    setHistory(h => h.slice(0, -1));
    const canvas = editorCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); };
    img.src = prev;
  };

  const getCanvasPos = (e) => {
    const canvas = editorCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const onCanvasPointerDown = (e) => {
    e.preventDefault();
    if (editorMode === 'draw') {
      saveHistoryState();
      setIsDrawing(true);
      drawLastPos.current = getCanvasPos(e);
    } else if (editorMode === 'text' && editorText.trim()) {
      saveHistoryState();
      const pos = getCanvasPos(e);
      const canvas = editorCanvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.font = `bold ${Math.max(canvas.width * 0.05, 24)}px Arial`;
      ctx.fillStyle = drawColor;
      ctx.strokeStyle = drawColor === '#ffffff' ? '#000' : '#fff';
      ctx.lineWidth = 2;
      ctx.strokeText(editorText, pos.x, pos.y);
      ctx.fillText(editorText, pos.x, pos.y);
    } else if (editorMode === 'emoji') {
      saveHistoryState();
      const pos = getCanvasPos(e);
      const canvas = editorCanvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.font = `${Math.max(canvas.width * 0.07, 32)}px Arial`;
      ctx.fillText(selectedEmoji, pos.x - 16, pos.y + 16);
    }
  };

  const onCanvasPointerMove = (e) => {
    e.preventDefault();
    if (!isDrawing || editorMode !== 'draw') return;
    const canvas = editorCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(drawLastPos.current.x, drawLastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    drawLastPos.current = pos;
  };

  const onCanvasPointerUp = () => { setIsDrawing(false); };

  const applyEditorImage = () => {
    if (!editorCanvasRef.current) return;
    const dataUrl = editorCanvasRef.current.toDataURL('image/jpeg', 0.85);
    // Compress to 300px max for storage
    const img = new Image();
    img.onload = () => {
      const MAX = 300;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
      else { if (h > MAX) { w = w * MAX / h; h = MAX; } }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      setFormData(prev => ({ ...prev, profilePicture: c.toDataURL('image/jpeg', 0.8) }));
    };
    img.src = dataUrl;
    setShowEditor(false);
    setShowCameraModal(false);
    setCapturedImage(null);
  };

  const closeCameraModal = () => {
    stopCamera();
    setShowCameraModal(false);
    setCapturedImage(null);
    setShowEditor(false);
    setHistory([]);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        avatar: formData.avatar,
        profilePicture: formData.profilePicture
      });
      setIsEditing(false);
      setShowAvatarSelector(false);
      setNotification({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (_error) {
      setNotification({ type: 'error', message: 'Failed to save profile. Please try again.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Compress image before converting to base64
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300; // Max width/height
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to compressed base64 (JPEG quality 0.7)
        const base64Image = canvas.toDataURL('image/jpeg', 0.7);
        setFormData({ ...formData, profilePicture: base64Image });
      };
      
      const reader = new FileReader();
      reader.onload = (event) => {
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSelect = (avatarId) => {
    setFormData({ ...formData, avatar: avatarId, profilePicture: null });
    setShowAvatarSelector(false);
  };

  const getAvatarDisplay = () => {
    if (formData.profilePicture) {
      return (
        <img 
          src={formData.profilePicture} 
          alt="Profile" 
          className="w-full h-full object-cover rounded-full"
        />
      );
    }
    const avatar = AVATAR_OPTIONS.find(a => a.id === formData.avatar) || AVATAR_OPTIONS[0];
    return (
      <div className={`w-full h-full ${avatar.color} rounded-full flex items-center justify-center text-4xl`}>
        {avatar.icon}
      </div>
    );
  };

  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Instructor management (admin only)
  const [instructors, setInstructors] = useState([]);
  const [showAddInstructor, setShowAddInstructor] = useState(false);
  const [instructorForm, setInstructorForm] = useState({ name: '', email: '', role: 'instructor', department: 'CWTS', password: '', confirmPassword: '' });
  const [showInstructorPassword, setShowInstructorPassword] = useState(false);
  const [isAddingInstructor, setIsAddingInstructor] = useState(false);
  const [deletingInstructorId, setDeletingInstructorId] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    usersAPI.getAll().then(users => {
      setInstructors(users.filter(u => u.id !== user?.id));
    }).catch(() => {});
  }, [isAdmin, user?.id]);

  const handleAddInstructor = async () => {
    if (!instructorForm.name.trim() || !instructorForm.email.trim() || !instructorForm.password) {
      setNotification({ type: 'error', message: 'Name, email, and password are required.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    if (instructorForm.password !== instructorForm.confirmPassword) {
      setNotification({ type: 'error', message: 'Passwords do not match.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    if (instructorForm.password.length < 6) {
      setNotification({ type: 'error', message: 'Password must be at least 6 characters.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setIsAddingInstructor(true);
    try {
      const created = await usersAPI.createInstructor({
        name: instructorForm.name.trim(),
        email: instructorForm.email.trim(),
        password: instructorForm.password,
        role: instructorForm.role,
        department: instructorForm.role === 'instructor' ? instructorForm.department : undefined
      });
      setInstructors(prev => [...prev, created]);
      // Ensure the All Instructors group exists — creates it if not yet, which also adds the new user
      getAllInstructorsGroup().catch(() => {});
      setInstructorForm({ name: '', email: '', department: 'CWTS', password: '', confirmPassword: '' });
      setShowAddInstructor(false);
      setNotification({ type: 'success', message: `"${created.name}" added and joined the All Instructors group.` });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ type: 'error', message: error?.message || 'Failed to add instructor.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsAddingInstructor(false);
    }
  };

  const handleDeleteInstructor = async (id, name) => {
    if (!window.confirm(`Delete instructor "${name}"? This cannot be undone.`)) return;
    setDeletingInstructorId(id);
    try {
      await usersAPI.delete(id);
      setInstructors(prev => prev.filter(i => i.id !== id));
      setNotification({ type: 'success', message: `Instructor "${name}" deleted.` });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ type: 'error', message: error?.message || 'Failed to delete instructor.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setDeletingInstructorId(null);
    }
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setNotification({ type: 'error', message: 'Passwords do not match!' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    if (formData.newPassword.length < 8) {
      setNotification({ type: 'error', message: 'Password must be at least 8 characters!' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword(formData.newPassword);
      setNotification({ type: 'success', message: 'Password changed successfully!' });
      setTimeout(() => setNotification(null), 3000);
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (_error) {
      setNotification({ type: 'error', message: 'Failed to change password. Please try again.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getDepartmentColor = () => {
    switch(user?.department) {
      case 'ROTC': return 'bg-red-100 text-red-700 border-red-200';
      case 'LTS': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'CWTS': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-green-800 text-white shadow-xl z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-green-700">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="font-bold text-lg">National Service Training Program</h1>
              <p className="text-xs text-green-200">My Profile</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            type="button"
            onClick={() => { navigate(user?.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard'); setSidebarOpen(false); }}
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
            type="button"
            onClick={() => { navigate('/students'); setSidebarOpen(false); }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span>Students</span>
          </button>
          <button
            type="button"
            onClick={() => { navigate('/reports'); setSidebarOpen(false); }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span>Reports</span>
          </button>
          <button
            type="button"
            onClick={() => { navigate('/chat'); setSidebarOpen(false); }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Messages</span>
          </button>
          <button
            type="button"
            onClick={() => { navigate('/calendar'); setSidebarOpen(false); }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span>Calendar</span>
          </button>
          <button
            type="button"
            onClick={() => { navigate('/profile'); setSidebarOpen(false); }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-green-700"
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-700">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-red-300"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 p-2 sm:p-4 lg:p-6 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Centered notification */}
        {notification && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
            <div className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-medium max-w-sm w-full mx-4 ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
              {notification.type === 'success'
                ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
                : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span className="flex-1">{notification.message}</span>
              <button type="button" onClick={() => setNotification(null)} className="text-white/80 hover:text-white flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-5 gap-4">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-200 rounded-lg shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">My Profile</h2>
              <p className="text-gray-600">Manage your account information</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center disabled:opacity-60 disabled:cursor-wait ${isEditing ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {isEditing ? <Save className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            <span>{isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-br from-green-600 to-green-800 p-3 sm:p-6 text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
                    {getAvatarDisplay()}
                  </div>
                  {isEditing && (
                    <div className="absolute bottom-0 right-0 flex space-x-1">
                      <button
                        type="button"
                        onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                        className="w-10 h-10 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center text-white transition-colors"
                        title="Select Avatar"
                      >
                        <User className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={openCamera}
                        className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
                        title="Take Photo"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors"
                        title="Upload from Gallery"
                      >
                        <Upload className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProfilePictureChange}
                  accept="image/*"
                  className="hidden"
                />
                
                <h3 className="text-xl font-bold text-white">{user?.name}</h3>
                <p className="text-green-200">{isAdmin ? 'Administrator' : `${user?.department} Instructor`}</p>
              </div>
              
              {/* Avatar Selector */}
              {isEditing && showAvatarSelector && (
                <div className="p-4 bg-gray-50 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Choose an Avatar</p>
                  <div className="flex justify-center space-x-3">
                    {AVATAR_OPTIONS.map((avatar) => (
                      <button
                        type="button"
                        key={avatar.id}
                        onClick={() => handleAvatarSelect(avatar.id)}
                        className={`w-12 h-12 ${avatar.color} rounded-full flex items-center justify-center text-2xl transition-transform hover:scale-110 ${formData.avatar === avatar.id ? 'ring-2 ring-offset-2 ring-green-500' : ''}`}
                      >
                        {avatar.icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="p-3 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{user?.department}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDepartmentColor()}`}>
                      {isAdmin ? 'Admin' : 'Instructor'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-5">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    id="profile-name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!isEditing}
                    autoComplete="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    id="profile-email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                    autoComplete="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      id="profile-phone"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      disabled={!isEditing}
                      placeholder="+63 912 345 6789"
                      autoComplete="tel"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    id="profile-department"
                    name="department"
                    value={user?.department}
                    disabled
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio / About</label>
                <textarea
                  id="profile-bio"
                  name="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100 h-24 resize-none"
                />
              </div>
            </div>

            {/* Instructor Accounts — admin only */}
            {isAdmin && (
              <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Instructor Accounts
                  </h3>
                  <button
                    type="button"
                    onClick={() => { setInstructorForm({ name: '', email: '', department: 'CWTS', password: '', confirmPassword: '' }); setShowAddInstructor(true); }}
                    className="flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Instructor
                  </button>
                </div>

                {instructors.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No instructor accounts yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {instructors.map(inst => {
                      const deptColors = { CWTS: 'bg-blue-100 text-blue-700', LTS: 'bg-purple-100 text-purple-700', ROTC: 'bg-red-100 text-red-700' };
                      return (
                        <div key={inst.id} className="flex items-center justify-between py-3 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0 text-sm font-bold">
                              {inst.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{inst.name}</p>
                              <p className="text-xs text-gray-400 truncate">{inst.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {inst.role === 'admin' ? (
                              <span className="text-xs px-2 py-0.5 rounded font-medium bg-yellow-100 text-yellow-700">Admin</span>
                            ) : (
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${deptColors[inst.department] || 'bg-gray-100 text-gray-600'}`}>
                                {inst.department}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteInstructor(inst.id, inst.name)}
                              disabled={deletingInstructorId === inst.id}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                              title="Delete instructor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Change Password */}
            <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Change Password
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="current-password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Enter current password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      id="new-password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Enter new password"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirm-password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-wait"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Instructor Modal */}
      {showAddInstructor && (() => {
        const f = instructorForm;
        const nameOk    = f.name.trim().length > 0;
        const emailOk   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim());
        const pwOk      = f.password.length >= 6;
        const confirmOk = f.password === f.confirmPassword && f.confirmPassword.length > 0;
        const deptOk    = f.role === 'admin' || !!f.department;
        const canSubmit = nameOk && emailOk && pwOk && confirmOk && deptOk;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddInstructor(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-3 sm:p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-green-700" />
                  Add New {f.role === 'admin' ? 'Admin' : 'Instructor'}
                </h3>
                <button type="button" onClick={() => setShowAddInstructor(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Role <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ value: 'instructor', label: 'Instructor' }, { value: 'admin', label: 'Admin' }].map(r => (
                      <button key={r.value} type="button"
                        onClick={() => setInstructorForm(prev => ({ ...prev, role: r.value }))}
                        className={`py-2 rounded-lg border-2 font-medium text-sm transition-all ${f.role === r.value ? 'bg-green-700 border-green-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                      >{r.label}</button>
                    ))}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" id="inst-name" name="instructorName" value={f.name}
                    onChange={e => setInstructorForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Juan dela Cruz" autoComplete="off"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${!nameOk && f.name.length > 0 ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  />
                  {!nameOk && f.name.length > 0 && <p className="text-red-500 text-xs mt-0.5">Name is required</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" id="inst-email" name="instructorEmail" value={f.email}
                    onChange={e => setInstructorForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. juan@cvsu.edu.ph" autoComplete="off"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${f.email.length > 0 && !emailOk ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  />
                  {f.email.length > 0 && !emailOk && <p className="text-red-500 text-xs mt-0.5">Enter a valid email address</p>}
                </div>

                {/* Department (instructor only) */}
                {f.role === 'instructor' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Department <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-3 gap-2">
                      {['CWTS', 'LTS', 'ROTC'].map(dept => {
                        const active = { CWTS: 'bg-blue-600 border-blue-600 text-white', LTS: 'bg-purple-600 border-purple-600 text-white', ROTC: 'bg-red-600 border-red-600 text-white' };
                        const idle   = { CWTS: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100', LTS: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100', ROTC: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' };
                        return (
                          <button key={dept} type="button"
                            onClick={() => setInstructorForm(prev => ({ ...prev, department: dept }))}
                            className={`py-2 rounded-lg border-2 font-medium text-sm transition-all ${f.department === dept ? active[dept] : idle[dept]}`}
                          >{dept}</button>
                        );
                      })}
                    </div>
                    {!f.department && <p className="text-red-500 text-xs mt-0.5">Select a department</p>}
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showInstructorPassword ? 'text' : 'password'} id="inst-password" name="instructorPassword"
                      value={f.password}
                      onChange={e => setInstructorForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="At least 6 characters" autoComplete="new-password"
                      className={`w-full px-3 py-2 pr-9 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${f.password.length > 0 && !pwOk ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    />
                    <button type="button" onClick={() => setShowInstructorPassword(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                      {showInstructorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {f.password.length > 0 && !pwOk && <p className="text-red-500 text-xs mt-0.5">Password must be at least 6 characters</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                  <input type="password" id="inst-confirm-password" name="instructorConfirmPassword"
                    value={f.confirmPassword}
                    onChange={e => setInstructorForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Re-enter password" autoComplete="new-password"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${f.confirmPassword.length > 0 && !confirmOk ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  />
                  {f.confirmPassword.length > 0 && !confirmOk && <p className="text-red-500 text-xs mt-0.5">Passwords do not match</p>}
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setShowAddInstructor(false)} className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm transition-colors">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddInstructor}
                  disabled={isAddingInstructor || !canSubmit}
                  title={canSubmit ? '' : 'Please fill in all required fields correctly'}
                  className="flex-1 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-4 h-4" />
                  {isAddingInstructor ? 'Adding...' : `Add ${f.role === 'admin' ? 'Admin' : 'Instructor'}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Camera / Photo Editor Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-2" onClick={closeCameraModal}>
          <div className="bg-gray-900 rounded-2xl overflow-hidden w-full max-w-md" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
              <span className="text-white font-semibold text-sm">
                {showEditor ? 'Edit Photo' : 'Take Photo'}
              </span>
              <button type="button" onClick={closeCameraModal} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Camera View */}
            {!showEditor && (
              <div className="relative bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-[60vh] object-cover"
                  style={{ transform: 'scaleX(1)' }}
                />
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6">
                  <button
                    type="button"
                    onClick={flipCamera}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                    title="Flip Camera"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="w-16 h-16 bg-white rounded-full border-4 border-gray-400 hover:border-gray-200 transition-colors flex items-center justify-center"
                  >
                    <div className="w-12 h-12 bg-white rounded-full" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { stopCamera(); fileInputRef.current?.click(); setShowCameraModal(false); }}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                    title="Upload from Gallery"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Photo Editor */}
            {showEditor && capturedImage && (
              <div className="flex flex-col">
                {/* Canvas */}
                <div className="relative bg-black flex items-center justify-center">
                  <canvas
                    ref={editorCanvasRef}
                    className="max-w-full max-h-[50vh] object-contain touch-none"
                    style={{ cursor: editorMode === 'draw' ? 'crosshair' : editorMode === 'text' ? 'text' : 'cell' }}
                    onMouseDown={onCanvasPointerDown}
                    onMouseMove={onCanvasPointerMove}
                    onMouseUp={onCanvasPointerUp}
                    onMouseLeave={onCanvasPointerUp}
                    onTouchStart={onCanvasPointerDown}
                    onTouchMove={onCanvasPointerMove}
                    onTouchEnd={onCanvasPointerUp}
                  />
                </div>

                {/* Editor Toolbar */}
                <div className="bg-gray-800 p-3 space-y-2">
                  {/* Mode buttons */}
                  <div className="flex gap-2 justify-center">
                    {[
                      { mode: 'draw', icon: <Pencil className="w-4 h-4" />, label: 'Draw' },
                      { mode: 'text', icon: <Type className="w-4 h-4" />, label: 'Text' },
                      { mode: 'emoji', icon: <Smile className="w-4 h-4" />, label: 'Emoji' },
                    ].map(({ mode, icon, label }) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setEditorMode(mode)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${editorMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      >
                        {icon}{label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={undoEditor}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                      title="Undo"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Draw options */}
                  {editorMode === 'draw' && (
                    <div className="space-y-2">
                      <div className="flex gap-1.5 flex-wrap">
                        {DRAW_COLORS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setDrawColor(c)}
                            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                            style={{ backgroundColor: c, borderColor: drawColor === c ? '#60a5fa' : 'transparent' }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">Size</span>
                        <input type="range" min={2} max={20} value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="flex-1 h-1 accent-blue-500" />
                        <span className="text-gray-300 text-xs w-4">{brushSize}</span>
                      </div>
                    </div>
                  )}

                  {/* Text options */}
                  {editorMode === 'text' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editorText}
                        onChange={e => setEditorText(e.target.value)}
                        placeholder="Type text, then tap on photo"
                        className="w-full bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm placeholder-gray-500 outline-none"
                        autoComplete="off"
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {DRAW_COLORS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setDrawColor(c)}
                            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                            style={{ backgroundColor: c, borderColor: drawColor === c ? '#60a5fa' : 'transparent' }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emoji options */}
                  {editorMode === 'emoji' && (
                    <div className="space-y-2">
                      <p className="text-gray-400 text-xs">Select emoji, then tap on photo</p>
                      <div className="flex flex-wrap gap-1">
                        {QUICK_EMOJIS.map(em => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setSelectedEmoji(em)}
                            className={`w-8 h-8 text-lg rounded flex items-center justify-center transition-colors ${selectedEmoji === em ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Apply button */}
                  <button
                    type="button"
                    onClick={applyEditorImage}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Use This Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
