import { useAuth } from '../App';
import { 
  LayoutDashboard, Users, FileText, MessageSquare, 
  LogOut, User, ChevronLeft, Camera, Mail, Phone,
  Building, Shield, Save, Lock, Eye, EyeOff, Upload, X, Menu,
  Calendar
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef } from 'react';

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSave = () => {
    updateUser({
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

  const handlePasswordChange = () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setNotification({ type: 'error', message: 'Passwords do not match!' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setNotification({ type: 'error', message: 'Password must be at least 6 characters!' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    changePassword(formData.newPassword);
    setNotification({ type: 'success', message: 'Password changed successfully!' });
    setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setNotification(null), 3000);
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
      {/* Mobile Header */}
      <div className="lg:hidden bg-green-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <User className="w-6 h-6" />
          <span className="font-bold">My Profile</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-green-700 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

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
            <User className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-lg">National Service Training Program</h1>
              <p className="text-xs text-green-200">My Profile</p>
            </div>
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
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
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
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-green-700"
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-700">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-red-300"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 p-4 lg:p-8 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">My Profile</h2>
            <p className="text-gray-600">Manage your account information</p>
          </div>
          </div>
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center ${isEditing ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {isEditing ? <Save className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
                    {getAvatarDisplay()}
                  </div>
                  {isEditing && (
                    <div className="absolute bottom-0 right-0 flex space-x-1">
                      <button 
                        onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                        className="w-10 h-10 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center text-white transition-colors"
                        title="Select Avatar"
                      >
                        <User className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
                        title="Upload Photo"
                      >
                        <Camera className="w-5 h-5" />
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
              
              <div className="p-6">
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
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      disabled={!isEditing}
                      placeholder="+63 912 345 6789"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={user?.department}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio / About</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100 h-24 resize-none"
                />
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl shadow-md p-6">
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
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Enter current password"
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
                      value={formData.newPassword}
                      onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <button 
                  onClick={handlePasswordChange}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
