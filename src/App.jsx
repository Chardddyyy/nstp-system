import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, createContext, useContext, useEffect } from 'react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import StudentManagement from './pages/StudentManagement';
import Reports from './pages/Reports';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import Enrollment from './pages/Enrollment';
import { authAPI, usersAPI, studentsAPI, reportsAPI, conversationsAPI, enrollmentsAPI, archivesAPI } from './services/api';

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [reports, setReports] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [archivedYears, setArchivedYears] = useState([]);
  const [currentBatch, setCurrentBatch] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const token = localStorage.getItem('nstp_token');
    if (token) {
      loadCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Load current user data
  const loadCurrentUser = async () => {
    try {
      const userData = await usersAPI.getMe();
      setUser(userData);
      await loadAllData();
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('nstp_token');
    } finally {
      setLoading(false);
    }
  };

  // Load all data from API
  const loadAllData = async () => {
    try {
      const [usersData, studentsData, reportsData, enrollmentsData, conversationsData, archivesData, batchData] = await Promise.all([
        usersAPI.getAll(),
        studentsAPI.getAll(),
        reportsAPI.getAll(),
        enrollmentsAPI.getAll(),
        conversationsAPI.getAll(),
        archivesAPI.getAll().catch(() => []),
        archivesAPI.getCurrentBatch().catch(() => ({ year: new Date().getFullYear() }))
      ]);

      setUsers(usersData);
      setStudents(studentsData);
      setReports(reportsData);
      setPendingEnrollments(enrollmentsData.filter(e => e.status === 'Pending'));
      setConversations(conversationsData);
      setArchivedYears(archivesData);
      setCurrentBatch(batchData.year.toString());

      // Auto-create group chat for admin/instructors if doesn't exist
      const currentUser = user;
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'instructor')) {
        const hasGroupChat = conversationsData.some(c => c.isGroup && c.groupName === 'All Instructors');
        if (!hasGroupChat) {
          const instructorsAndAdmin = usersData.filter(u => u.role === 'admin' || u.role === 'instructor');
          if (instructorsAndAdmin.length > 1) {
            try {
              const participantIds = instructorsAndAdmin.map(u => u.id);
              const groupChat = await conversationsAPI.createGroup('All Instructors', participantIds);
              setConversations(prev => [groupChat, ...prev]);
              setMessages(prev => ({ ...prev, [groupChat.id]: [] }));
            } catch (err) {
              console.log('Group chat may already exist:', err.message);
            }
          }
        }
      }

      // Load messages for each conversation
      const messagesData = {};
      for (const conv of conversationsData) {
        try {
          const convMessages = await conversationsAPI.getMessages(conv.id);
          messagesData[conv.id] = convMessages;
        } catch (err) {
          messagesData[conv.id] = [];
        }
      }
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };


  const login = async (email, password) => {
    try {
      console.log('Login attempt:', email);
      const response = await authAPI.login(email, password);
      console.log('Login response:', response);
      
      if (response.token) {
        localStorage.setItem('nstp_token', response.token);
        setUser(response.user);
        console.log('User set after login:', response.user, 'Role:', response.user?.role);
        await loadAllData();
        return { success: true, role: response.user.role };
      } else {
        return { success: false, message: 'Invalid server response' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Invalid email or password' };
    }
  };

  const logout = () => {
    localStorage.removeItem('nstp_token');
    setUser(null);
    setUsers([]);
    setStudents([]);
    setPendingEnrollments([]);
    setReports([]);
    setConversations([]);
    setMessages({});
  };

  const updateUser = async (updatedData) => {
    try {
      const updated = await usersAPI.update(user.id, updatedData);
      setUser(updated);
      const usersData = await usersAPI.getAll();
      setUsers(usersData);
      return updated;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const changePassword = async (newPassword) => {
    try {
      await usersAPI.changePassword(user.id, newPassword);
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  // Student management
  const addStudent = async (student) => {
    try {
      console.log('Adding student:', student);
      const newStudent = await studentsAPI.add(student);
      console.log('Student added successfully:', newStudent);
      setStudents(prev => [...prev, newStudent]);
      return newStudent;
    } catch (error) {
      console.error('Add student error:', error);
      throw error;
    }
  };

  const updateStudent = async (id, data) => {
    try {
      const updated = await studentsAPI.update(id, data);
      setStudents(prev => prev.map(s => s.id === id ? updated : s));
      return updated;
    } catch (error) {
      console.error('Update student error:', error);
      throw error;
    }
  };

  const deleteStudent = async (id) => {
    try {
      await studentsAPI.delete(id);
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Delete student error:', error);
      throw error;
    }
  };

  // Enrollment management
  const submitEnrollment = async (enrollment) => {
    try {
      const newEnrollment = await enrollmentsAPI.submit(enrollment);
      setPendingEnrollments(prev => [...prev, newEnrollment]);
      return newEnrollment;
    } catch (error) {
      console.error('Submit enrollment error:', error);
      throw error;
    }
  };

  const approveEnrollment = async (id) => {
    try {
      const updated = await enrollmentsAPI.update(id, 'Approved');
      setPendingEnrollments(prev => prev.filter(e => e.id !== id));
      const studentsData = await studentsAPI.getAll();
      setStudents(studentsData);
      return updated;
    } catch (error) {
      console.error('Approve enrollment error:', error);
      throw error;
    }
  };

  const declineEnrollment = async (id) => {
    try {
      await enrollmentsAPI.update(id, 'Declined');
      setPendingEnrollments(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Decline enrollment error:', error);
      throw error;
    }
  };

  // Report management
  const addReport = async (report) => {
    try {
      console.log('Adding report:', report);
      const newReport = await reportsAPI.add(report);
      console.log('Report added successfully:', newReport);
      setReports(prev => [...prev, newReport]);
      return newReport;
    } catch (error) {
      console.error('Add report error:', error);
      throw error;
    }
  };

  const updateReport = async (id, data) => {
    try {
      const updated = await reportsAPI.update(id, data);
      setReports(prev => prev.map(r => r.id === id ? updated : r));
      return updated;
    } catch (error) {
      console.error('Update report error:', error);
      throw error;
    }
  };

  const deleteReport = async (id) => {
    try {
      await reportsAPI.delete(id);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Delete report error:', error);
      throw error;
    }
  };

  const submitReport = async (reportId, submission) => {
    try {
      await reportsAPI.submit(reportId, submission.content);
      const reportsData = await reportsAPI.getAll();
      setReports(reportsData);
    } catch (error) {
      console.error('Submit report error:', error);
      throw error;
    }
  };

  // Legacy functions for compatibility (these would need proper implementation)
  const editMessage = async (conversationId, messageId, newText) => {
    try {
      const updated = await conversationsAPI.editMessage(conversationId, messageId, newText);
      
      // Update message in local state
      setMessages(prev => ({
        ...prev,
        [conversationId]: prev[conversationId].map(msg => 
          msg.id === messageId ? { ...msg, text: newText, edited: 1 } : msg
        )
      }));
      
      return updated;
    } catch (error) {
      console.error('Edit message error:', error);
      throw error;
    }
  };

  const deleteMessage = async (conversationId, messageId, forEveryone = false) => {
    try {
      await conversationsAPI.deleteMessage(conversationId, messageId, forEveryone);
      
      // Update local state to remove or mark message as deleted
      setMessages(prev => ({
        ...prev,
        [conversationId]: prev[conversationId].map(msg => 
          msg.id === messageId 
            ? { ...msg, deletedForMe: true, deletedForEveryone: forEveryone, text: forEveryone ? '[deleted]' : msg.text }
            : msg
        )
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  };

  const addReaction = async (conversationId, messageId, emoji) => {
    try {
      const result = await conversationsAPI.addReaction(conversationId, messageId, emoji);
      
      // Update message reactions in local state
      setMessages(prev => ({
        ...prev,
        [conversationId]: prev[conversationId].map(msg => 
          msg.id === messageId ? { ...msg, reactions: result.reactions } : msg
        )
      }));
      
      return result;
    } catch (error) {
      console.error('Add reaction error:', error);
      throw error;
    }
  };

  const addReportComment = async (reportId, comment) => {
    console.log('Add report comment not yet implemented in API');
  };

  // Chat functions
  const startConversation = async (withUser) => {
    try {
      const conversation = await conversationsAPI.create(withUser.id);
      const exists = conversations.find(c => c.id === conversation.id);
      if (!exists) {
        setConversations(prev => [conversation, ...prev]);
        setMessages(prev => ({ ...prev, [conversation.id]: [] }));
      }
      return conversation;
    } catch (error) {
      console.error('Start conversation error:', error);
      throw error;
    }
  };

  const createGroupChat = async (name, participantIds) => {
    try {
      const conversation = await conversationsAPI.createGroup(name, participantIds);
      const exists = conversations.find(c => c.id === conversation.id);
      if (!exists) {
        setConversations(prev => [conversation, ...prev]);
        setMessages(prev => ({ ...prev, [conversation.id]: [] }));
      }
      return conversation;
    } catch (error) {
      console.error('Create group chat error:', error);
      throw error;
    }
  };

  const sendMessage = async (conversationId, message) => {
    try {
      console.log('Sending message to conversation:', conversationId, 'Message:', message);
      const newMsg = await conversationsAPI.sendMessage(conversationId, {
        text: message.text,
        type: message.type || 'text',
        image_url: message.imageUrl,
        file_url: message.fileUrl,
        file_name: message.fileName,
        audio_url: message.audioUrl,
        duration: message.duration
      });
      console.log('Message sent successfully:', newMsg);

      // Add formatted time to message
      const msgWithTime = {
        ...newMsg,
        time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), msgWithTime]
      }));

      setConversations(prev => prev.map(c => 
        c.id === conversationId 
          ? { ...c, last_message: message.text, last_message_time: new Date().toISOString() }
          : c
      ));

      return msgWithTime;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      await conversationsAPI.delete(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[conversationId];
        return newMessages;
      });
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw error;
    }
  };

  const clearMessages = async (conversationId) => {
    setMessages(prev => ({ ...prev, [conversationId]: [] }));
  };

  const getUserConversations = () => {
    if (!user) return [];
    return conversations.filter(c => {
      // Include direct conversations where user is a participant
      if (c.participant_1_id === user.id || c.participant_2_id === user.id) {
        return true;
      }
      // Include group conversations where user is in participants list
      if (c.isGroup && c.participants?.includes(user.id)) {
        return true;
      }
      return false;
    });
  };

  // Clear batch data
  const clearBatchData = async () => {
    for (const student of students) {
      await deleteStudent(student.id);
    }
    for (const report of reports) {
      await deleteReport(report.id);
    }
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
    
    if (!user) return <Navigate to="/login" />;
    
    // Debug logging
    console.log('ProtectedRoute check:', { userRole: user?.role, allowedRoles, hasRole: user?.role && allowedRoles?.includes(user.role) });
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      console.log('Role mismatch - redirecting to home');
      return <Navigate to="/" />;
    }
    
    return children;
  };

  const contextValue = {
    user, login, logout, updateUser, changePassword, allUsers: users,
    students, reports, conversations: getUserConversations(), messages, pendingEnrollments,
    archivedYears, currentBatch,
    addStudent, updateStudent, deleteStudent,
    addReport, updateReport, deleteReport, submitReport, addReportComment,
    startConversation, createGroupChat, sendMessage, getUserConversations, editMessage, addReaction, deleteMessage,
    deleteConversation, clearMessages,
    clearBatchData, submitEnrollment, approveEnrollment, declineEnrollment,
    loading, refreshData: loadAllData
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/enrollment" element={<Enrollment />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/instructor/dashboard" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorDashboard /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><StudentManagement /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Reports /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Chat /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Calendar /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Profile /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
