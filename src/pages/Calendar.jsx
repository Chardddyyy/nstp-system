import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon, Plus, X, Pencil,
  ChevronRight, ChevronLeft, Menu, CheckCircle, AlertCircle, Lock, History, Archive,
  List, Grid, Search, Filter, Download, Sparkles, Flag, BookOpen, Award, Shield, Users, Layers, Clock, Tag, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';

// Philippine Holidays 2024-2030 (Static top-level constant)
const PHILIPPINE_HOLIDAYS = [
  // 2023
  { date: '2023-01-01', title: "New Year's Day", type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2023-01-22', title: 'Chinese New Year', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2023-02-25', title: 'EDSA People Power Revolution Anniversary', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2023-04-06', title: 'Maundy Thursday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2023-04-07', title: 'Good Friday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2023-04-08', title: 'Black Saturday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2023-04-10', title: 'Araw ng Kagitingan (Observed)', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2023-05-01', title: 'Labor Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2023-06-12', title: 'Independence Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2023-08-28', title: 'National Heroes Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2023-11-30', title: 'Bonifacio Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2023-12-25', title: 'Christmas Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2023-12-30', title: 'Rizal Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },

  // 2024
  { date: '2024-01-01', title: "New Year's Day", type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2024-02-10', title: 'Chinese New Year', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2024-02-25', title: 'EDSA People Power Revolution Anniversary', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2024-03-28', title: 'Maundy Thursday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2024-03-29', title: 'Good Friday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2024-03-30', title: 'Black Saturday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2024-04-09', title: 'Araw ng Kagitingan', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2024-05-01', title: 'Labor Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2024-06-12', title: 'Independence Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2024-08-26', title: 'National Heroes Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2024-11-30', title: 'Bonifacio Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2024-12-25', title: 'Christmas Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2024-12-30', title: 'Rizal Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  
  // 2025
  { date: '2025-01-01', title: "New Year's Day", type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2025-01-29', title: 'Chinese New Year', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2025-02-25', title: 'EDSA People Power Revolution Anniversary', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2025-04-17', title: 'Maundy Thursday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2025-04-18', title: 'Good Friday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2025-04-19', title: 'Black Saturday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2025-04-09', title: 'Araw ng Kagitingan', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2025-05-01', title: 'Labor Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2025-06-12', title: 'Independence Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2025-08-25', title: 'National Heroes Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2025-11-30', title: 'Bonifacio Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2025-12-25', title: 'Christmas Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2025-12-30', title: 'Rizal Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  
  // 2026
  { date: '2026-01-01', title: "New Year's Day", type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2026-02-17', title: 'Chinese New Year', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2026-02-25', title: 'EDSA People Power Revolution Anniversary', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2026-04-02', title: 'Maundy Thursday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2026-04-03', title: 'Good Friday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2026-04-04', title: 'Black Saturday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2026-04-09', title: 'Araw ng Kagitingan', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2026-05-01', title: 'Labor Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2026-06-12', title: 'Independence Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2026-08-31', title: 'National Heroes Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2026-11-30', title: 'Bonifacio Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2026-12-25', title: 'Christmas Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2026-12-30', title: 'Rizal Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },

  // 2027
  { date: '2027-01-01', title: "New Year's Day", type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2027-02-06', title: 'Chinese New Year', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2027-02-25', title: 'EDSA People Power Revolution Anniversary', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2027-03-25', title: 'Maundy Thursday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2027-03-26', title: 'Good Friday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2027-03-27', title: 'Black Saturday', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2027-04-09', title: 'Araw ng Kagitingan', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2027-05-01', title: 'Labor Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2027-06-12', title: 'Independence Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2027-08-30', title: 'National Heroes Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2027-11-30', title: 'Bonifacio Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2027-12-25', title: 'Christmas Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' },
  { date: '2027-12-30', title: 'Rizal Day', type: 'holiday', category: 'Holiday', track: 'All Tracks' }
];

function Calendar() {
  const { user, logout, pushNotification, viewingArchive, archiveViewData, setViewingArchive } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'annual_summary'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('nstp_calendar_events');
    return saved ? JSON.parse(saved) : [];
  });
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '', track: 'All Tracks', category: 'Training' });

  // Summary view filters
  const [summarySemester, setSummarySemester] = useState('all'); // 'all' | '1st' | '2nd'
  const [summaryTrack, setSummaryTrack] = useState('all'); // 'all' | 'CWTS' | 'ROTC' | 'LTS'
  const [summarySearch, setSummarySearch] = useState('');

  // Batch academic date boundaries for archive mode
  const batchRange = useMemo(() => {
    if (!viewingArchive || !archiveViewData) return null;
    let startStr = archiveViewData.start_month || archiveViewData.startMonth || archiveViewData.data?.start_month || archiveViewData.data?.startMonth;
    let endStr = archiveViewData.end_month || archiveViewData.endMonth || archiveViewData.data?.end_month || archiveViewData.data?.endMonth;

    if (!startStr || !endStr) {
      const yr = String(archiveViewData.year || '');
      const match = yr.match(/(\d{4})/);
      const baseYear = match ? parseInt(match[1], 10) : 2024;
      if (yr.includes('1st Sem')) {
        startStr = `${baseYear}-08`;
        endStr = `${baseYear}-12`;
      } else if (yr.includes('2nd Sem')) {
        startStr = `${baseYear + 1}-01`;
        endStr = `${baseYear + 1}-05`;
      } else {
        startStr = `${baseYear}-08`;
        endStr = `${baseYear + 1}-05`;
      }
    }

    const [sY, sM] = startStr.split('-').map(Number);
    const [eY, eM] = endStr.split('-').map(Number);
    return {
      minDate: new Date(sY, sM - 1, 1),
      maxDate: new Date(eY, eM - 1, 1),
      startLabel: new Date(sY, sM - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      endLabel: new Date(eY, eM - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };
  }, [viewingArchive, archiveViewData]);

  // When in archive mode, jump the calendar to the batch's start month (or academic semester)
  useEffect(() => {
    let timer = setTimeout(() => {
      if (viewingArchive && batchRange) {
        setCurrentDate(new Date(batchRange.minDate.getFullYear(), batchRange.minDate.getMonth(), 15));
      } else if (!viewingArchive) {
        setCurrentDate(new Date());
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [viewingArchive, batchRange]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const todayStr = formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const isPastDay = (day) => {
    if (!day) return false;
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    return dateStr < todayStr;
  };

  // Archived events dataset
  const archiveEvents = useMemo(() => {
    if (!viewingArchive || !archiveViewData?.year) return [];
    const yr = String(archiveViewData.year);
    if (yr.includes('2023-2024')) {
      if (yr.includes('1st Semester')) {
        return [
          { id: 'arch-1', title: 'NSTP 1 General Orientation & Plenary', date: '2023-09-02', semester: '1st Semester', track: 'All Tracks', category: 'Orientation', description: 'Institutional NSTP orientation for all incoming 1st year students at CvSU Naic Gymnasium.', isArchived: true },
          { id: 'arch-2', title: 'CWTS Community Needs Assessment Field Visit', date: '2023-10-07', semester: '1st Semester', track: 'CWTS', category: 'Immersion', description: 'Participatory community profiling across Brgy. Bucana and Brgy. Halang.', isArchived: true },
          { id: 'arch-3', title: 'LTS Diagnostic Reading Assessment', date: '2023-10-14', semester: '1st Semester', track: 'LTS', category: 'Immersion', description: 'Conduct of pre-literacy assessment for adopted public elementary schools.', isArchived: true },
          { id: 'arch-4', title: 'ROTC Midterm Drill & Muster', date: '2023-10-21', semester: '1st Semester', track: 'ROTC', category: 'Training', description: 'Inspection and formation testing by AFP Reservist Command.', isArchived: true },
          { id: 'arch-5', title: 'NSTP 1 Midterm Evaluation & Submission', date: '2023-11-11', semester: '1st Semester', track: 'All Tracks', category: 'Evaluation', description: 'Submission of midterm project milestone progress reports.', isArchived: true },
          { id: 'arch-6', title: 'Disaster Risk Reduction Training Session', date: '2023-11-25', semester: '1st Semester', track: 'All Tracks', category: 'Training', description: 'First aid and basic life support demonstration with Naic MDRRMO.', isArchived: true },
          { id: 'arch-7', title: '1st Semester Culminating Project Defense', date: '2023-12-09', semester: '1st Semester', track: 'All Tracks', category: 'Culmination', description: 'Final departmental presentation of community outputs.', isArchived: true },
        ];
      } else {
        return [
          { id: 'arch-8', title: 'NSTP 2 Resumption & Project Implementation Briefing', date: '2024-02-10', semester: '2nd Semester', track: 'All Tracks', category: 'Orientation', description: 'Planning session for 2nd semester community engagement and culminating projects.', isArchived: true },
          { id: 'arch-9', title: 'CWTS Mangrove Planting & Coastal Rehabilitation', date: '2024-03-02', semester: '2nd Semester', track: 'CWTS', category: 'Immersion', description: 'Coastal cleanup and 500 mangrove seedling planting along Bucana shoreline.', isArchived: true },
          { id: 'arch-10', title: 'LTS Reading Clinic & Storybook Distribution', date: '2024-03-16', semester: '2nd Semester', track: 'LTS', category: 'Immersion', description: 'Elementary tutorial sessions and distribution of learning kits.', isArchived: true },
          { id: 'arch-11', title: 'ROTC Field Tactics & Land Navigation Exercise', date: '2024-03-23', semester: '2nd Semester', track: 'ROTC', category: 'Training', description: 'Field orienteering and compass movement simulation.', isArchived: true },
          { id: 'arch-12', title: 'Final Project Culmination & Document Audit', date: '2024-04-13', semester: '2nd Semester', track: 'All Tracks', category: 'Culmination', description: 'Verification of community portfolios and grade requirements.', isArchived: true },
          { id: 'arch-13', title: 'NSTP Passing-in-Review & Recognition Ceremony', date: '2024-04-27', semester: '2nd Semester', track: 'All Tracks', category: 'Culmination', description: 'Culminating graduation muster and issuance of NSTP certificates.', isArchived: true },
        ];
      }
    } else if (yr.includes('2024-2025')) {
      if (yr.includes('1st Semester')) {
        return [
          { id: 'arch-14', title: 'NSTP 1 General Orientation & Briefing', date: '2024-09-07', semester: '1st Semester', track: 'All Tracks', category: 'Orientation', description: 'Academic orientation and program assignments for Batch 2024-2025.', isArchived: true },
          { id: 'arch-15', title: 'CWTS Barangay Profiling & Immersion Preparation', date: '2024-10-05', semester: '1st Semester', track: 'CWTS', category: 'Immersion', description: 'Coordination meeting with Barangay officials of Bucana Malaki.', isArchived: true },
          { id: 'arch-16', title: 'LTS Literacy Pre-Assessment in Partner School', date: '2024-10-12', semester: '1st Semester', track: 'LTS', category: 'Immersion', description: 'Diagnostic phonics and numeracy evaluation for elementary students.', isArchived: true },
          { id: 'arch-17', title: 'ROTC Troop Muster & Ceremonial Formations', date: '2024-10-19', semester: '1st Semester', track: 'ROTC', category: 'Training', description: 'Basic military customs, discipline, and troop movement drill.', isArchived: true },
          { id: 'arch-18', title: 'NSTP 1 Midterm Evaluation & Defense', date: '2024-11-09', semester: '1st Semester', track: 'All Tracks', category: 'Evaluation', description: 'Mid-term documentation audit and project status verification.', isArchived: true },
          { id: 'arch-19', title: 'Community Disaster Preparedness & First Aid Clinic', date: '2024-11-23', semester: '1st Semester', track: 'All Tracks', category: 'Training', description: 'Emergency response simulations in partnership with MDRRMO.', isArchived: true },
        ];
      } else {
        return [
          { id: 'arch-20', title: 'NSTP 2 Project Launch & Field Immersion', date: '2025-02-08', semester: '2nd Semester', track: 'All Tracks', category: 'Orientation', description: 'Mobilization of students for second semester projects in Naic.', isArchived: true },
          { id: 'arch-21', title: 'CWTS Livelihood Eco-Crafting & Recycling Initiative', date: '2025-03-08', semester: '2nd Semester', track: 'CWTS', category: 'Immersion', description: 'Workshop on community organic composting and eco-crafts.', isArchived: true },
          { id: 'arch-22', title: 'LTS Mini-Library Handover & Literacy Graduation', date: '2025-03-22', semester: '2nd Semester', track: 'LTS', category: 'Culmination', description: 'Turnover of 300 children storybooks and graduation of young readers.', isArchived: true },
          { id: 'arch-23', title: 'ROTC Annual Tactical Inspection & Drill Review', date: '2025-04-05', semester: '2nd Semester', track: 'ROTC', category: 'Evaluation', description: 'Annual tactical evaluation conducted by Naval Reserve Command.', isArchived: true },
          { id: 'arch-24', title: 'NSTP Final Culminating Defense & Document Audit', date: '2025-04-12', semester: '2nd Semester', track: 'All Tracks', category: 'Culmination', description: 'Final requirements audit and endorsement for CHED serial numbers.', isArchived: true },
          { id: 'arch-25', title: 'NSTP Graduation & Ceremonial Pass-in-Review', date: '2025-04-26', semester: '2nd Semester', track: 'All Tracks', category: 'Culmination', description: 'Formal graduation pass-in-review and certificate awarding ceremony.', isArchived: true },
        ];
      }
    }
    return [];
  }, [viewingArchive, archiveViewData]);

  // Official Institutional Annual Events (AY 2026-2027)
  const defaultAnnualEvents2026 = useMemo(() => [
    // 1st Semester (Aug - Dec 2026)
    { id: 'ann-1', title: 'NSTP 1 General Orientation & Institutional Plenary', date: '2026-08-29', semester: '1st Semester', track: 'All Tracks', category: 'Orientation', description: 'Opening convocation and academic orientation for all incoming 1st year students at CvSU Naic Gymnasium.' },
    { id: 'ann-2', title: 'Departmental Track Briefing & Section Assignment', date: '2026-09-05', semester: '1st Semester', track: 'All Tracks', category: 'Orientation', description: 'Grouping into CWTS, ROTC, and LTS components and issuance of official syllabus and manuals.' },
    { id: 'ann-3', title: 'ROTC Initial Muster & Basic Military Customs', date: '2026-09-12', semester: '1st Semester', track: 'ROTC', category: 'Training', description: 'Drill orientation, uniform inspections, and basic marching command formations.' },
    { id: 'ann-4', title: 'CWTS Community Profiling & Immersion Briefing', date: '2026-09-19', semester: '1st Semester', track: 'CWTS', category: 'Immersion', description: 'Initial site coordination and partnership meetings with Barangay Bucana Malaki and Halang councils.' },
    { id: 'ann-5', title: 'LTS Diagnostic Literacy Assessment Workshop', date: '2026-09-26', semester: '1st Semester', track: 'LTS', category: 'Immersion', description: 'Training on reading comprehension screening tools for partner adopted public elementary schools.' },
    { id: 'ann-6', title: 'MDRRMO Disaster Preparedness & Basic First Aid', date: '2026-10-10', semester: '1st Semester', track: 'All Tracks', category: 'Training', description: 'Hands-on emergency response, CPR demonstration, and disaster triage management.' },
    { id: 'ann-7', title: 'CWTS Environmental Coastal Cleanup Drive', date: '2026-10-17', semester: '1st Semester', track: 'CWTS', category: 'Immersion', description: 'Coastal cleanup, waste segregation audit, and plastic retrieval along Bucana shoreline.' },
    { id: 'ann-8', title: 'ROTC Midterm Tactical Formations & Inspection', date: '2026-10-24', semester: '1st Semester', track: 'ROTC', category: 'Evaluation', description: 'Formal battalion muster and inspection by Naval Reserve Command representatives.' },
    { id: 'ann-9', title: 'NSTP 1 Midterm Evaluation & Progress Defense', date: '2026-11-07', semester: '1st Semester', track: 'All Tracks', category: 'Evaluation', description: 'Midterm documentation audit, project portfolio reviews, and encoding of initial marks.' },
    { id: 'ann-10', title: 'LTS Community Storytelling & Literacy Day', date: '2026-11-21', semester: '1st Semester', track: 'LTS', category: 'Immersion', description: 'Conduct of interactive phonics clinic and storybook sharing with adopted public elementary pupils.' },
    { id: 'ann-11', title: '1st Semester Culminating Project Defense & Exhibit', date: '2026-12-05', semester: '1st Semester', track: 'All Tracks', category: 'Culmination', description: 'Departmental project defense and submission of final first-semester community binders.' },
    { id: 'ann-12', title: 'Submission of 1st Semester Final Grade Sheets', date: '2026-12-12', semester: '1st Semester', track: 'All Tracks', category: 'Deadline', description: 'Final encoding and submission of Form A & Form B completion lists to the Registrar.' },

    // 2nd Semester (Jan - May 2027)
    { id: 'ann-13', title: 'NSTP 2 Resumption & Community Project Launch', date: '2027-01-23', semester: '2nd Semester', track: 'All Tracks', category: 'Orientation', description: 'Mobilization of students for second semester applied community action and livelihood initiatives.' },
    { id: 'ann-14', title: 'CWTS Mangrove Reforestation & Coastal Planting', date: '2027-02-13', semester: '2nd Semester', track: 'CWTS', category: 'Immersion', description: 'Planting of 600 mangrove propagules in Naic coastal protected areas.' },
    { id: 'ann-15', title: 'LTS Remedial Reading & Numeracy Tutorial Camp', date: '2027-02-27', semester: '2nd Semester', track: 'LTS', category: 'Immersion', description: 'One-on-one reading assistance and donation of instructional learning kits.' },
    { id: 'ann-16', title: 'ROTC Field Tactics & Compass Orienteering Drill', date: '2027-03-06', semester: '2nd Semester', track: 'ROTC', category: 'Training', description: 'Practical field maneuvering, map reading, and civil defense simulations.' },
    { id: 'ann-17', title: 'Community Livelihood & Organic Upcycling Workshop', date: '2027-03-20', semester: '2nd Semester', track: 'CWTS', category: 'Immersion', description: 'Livelihood skills transfer for local women and youth organizations.' },
    { id: 'ann-18', title: 'NSTP 2 Midterm Evaluation & Progress Milestone', date: '2027-04-03', semester: '2nd Semester', track: 'All Tracks', category: 'Evaluation', description: 'Mid-term requirements audit and endorsement for CHED masterlisting.' },
    { id: 'ann-19', title: 'LTS Book Donation & Young Readers Recognition', date: '2027-04-17', semester: '2nd Semester', track: 'LTS', category: 'Culmination', description: 'Turnover of mini-library materials and graduation of tutoring beneficiaries.' },
    { id: 'ann-20', title: 'ROTC Annual Tactical Inspection (ATI)', date: '2027-04-24', semester: '2nd Semester', track: 'ROTC', category: 'Evaluation', description: 'Final ceremonial tactical inspection by AFP Reserve Command inspection team.' },
    { id: 'ann-21', title: 'NSTP Final Project Defense & Document Audit', date: '2027-05-08', semester: '2nd Semester', track: 'All Tracks', category: 'Culmination', description: 'Final project defense, narrative binder audit, and clearance signing.' },
    { id: 'ann-22', title: 'NSTP Annual Pass-in-Review & Recognition Ceremony', date: '2027-05-22', semester: '2nd Semester', track: 'All Tracks', category: 'Culmination', description: 'Ceremonial graduation muster, issuance of NSTP Serial Numbers & Certificates.' }
  ], []);

  // Combine all events for the year
  const allAnnualEvents = useMemo(() => {
    if (viewingArchive) {
      return [...archiveEvents, ...PHILIPPINE_HOLIDAYS];
    }
    const combined = [...defaultAnnualEvents2026, ...events, ...PHILIPPINE_HOLIDAYS];
    return combined.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [viewingArchive, archiveEvents, defaultAnnualEvents2026, events]);

  // Filtered list for the Annual Summary View
  const filteredSummaryEvents = useMemo(() => {
    return allAnnualEvents.filter(ev => {
      // Semester filter
      if (summarySemester === '1st') {
        const d = new Date(ev.date);
        const m = d.getMonth(); // 7=Aug to 11=Dec
        if (ev.semester && ev.semester !== '1st Semester') return false;
        if (!ev.semester && !(m >= 7 && m <= 11)) return false;
      } else if (summarySemester === '2nd') {
        const d = new Date(ev.date);
        const m = d.getMonth(); // 0=Jan to 5=Jun
        if (ev.semester && ev.semester !== '2nd Semester') return false;
        if (!ev.semester && !(m >= 0 && m <= 5)) return false;
      }

      // Track filter
      if (summaryTrack !== 'all') {
        if (ev.track && ev.track !== 'All Tracks' && ev.track !== summaryTrack) return false;
      }

      // Keyword search
      if (summarySearch.trim()) {
        const query = summarySearch.toLowerCase().trim();
        const tMatch = (ev.title || '').toLowerCase().includes(query);
        const dMatch = (ev.description || '').toLowerCase().includes(query);
        const cMatch = (ev.category || '').toLowerCase().includes(query);
        const dateMatch = (ev.date || '').toLowerCase().includes(query);
        if (!tMatch && !dMatch && !cMatch && !dateMatch) return false;
      }

      return true;
    });
  }, [allAnnualEvents, summarySemester, summaryTrack, summarySearch]);

  // Monthly grouping of filtered summary events
  const groupedSummaryEvents = useMemo(() => {
    const groups = {};
    filteredSummaryEvents.forEach(ev => {
      const d = new Date(ev.date);
      const monthYearKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthYearKey]) groups[monthYearKey] = [];
      groups[monthYearKey].push(ev);
    });
    return groups;
  }, [filteredSummaryEvents]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const total = filteredSummaryEvents.length;
    const immersions = filteredSummaryEvents.filter(e => e.category === 'Immersion').length;
    const trainings = filteredSummaryEvents.filter(e => e.category === 'Training').length;
    const evaluations = filteredSummaryEvents.filter(e => e.category === 'Evaluation' || e.category === 'Culmination').length;
    const holidays = filteredSummaryEvents.filter(e => e.type === 'holiday' || e.category === 'Holiday').length;

    return { total, immersions, trainings, evaluations, holidays };
  }, [filteredSummaryEvents]);

  const getEventsForDate = (date) => {
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), date);
    const holidays = PHILIPPINE_HOLIDAYS.filter(h => h.date === dateStr);
    
    if (viewingArchive) {
      const archEvents = archiveEvents.filter(e => e.date === dateStr);
      return [...holidays, ...archEvents];
    }

    const defaultInst = defaultAnnualEvents2026.filter(e => e.date === dateStr);
    const customEvents = events.filter(e => e.date === dateStr);
    
    return [...holidays, ...defaultInst, ...customEvents];
  };

  const handleSaveEvent = () => {
    if (viewingArchive) return;
    if (!newEvent.title.trim() || !newEvent.date) return;
    
    if (editingEvent) {
      const updatedEvents = events.map(e => {
        if (e.id === editingEvent.id) {
          return {
            ...e,
            title: newEvent.title.trim(),
            date: newEvent.date,
            description: newEvent.description.trim(),
            track: newEvent.track || 'All Tracks',
            category: newEvent.category || 'Training',
            isEdited: true,
            editedAt: new Date().toISOString(),
            lastModifiedBy: user?.name
          };
        }
        return e;
      });

      setEvents(updatedEvents);
      localStorage.setItem('nstp_calendar_events', JSON.stringify(updatedEvents));

      if (typeof pushNotification === 'function') {
        pushNotification({
          title: 'Calendar Event Updated',
          message: `Event "${newEvent.title.trim()}" was updated for ${newEvent.date} (Edited)`,
          type: 'calendar',
          link: '/calendar',
        });
      }

      setNewEvent({ title: '', date: '', description: '', track: 'All Tracks', category: 'Training' });
      setEditingEvent(null);
      setShowAddEventModal(false);
    } else {
      const newEventObj = {
        id: Date.now().toString(),
        title: newEvent.title.trim(),
        date: newEvent.date,
        description: newEvent.description.trim(),
        track: newEvent.track || 'All Tracks',
        category: newEvent.category || 'Training',
        type: 'custom',
        createdBy: user?.name || 'Administrator',
        createdAt: new Date().toISOString()
      };

      const updatedEvents = [...events, newEventObj];
      setEvents(updatedEvents);
      localStorage.setItem('nstp_calendar_events', JSON.stringify(updatedEvents));

      if (typeof pushNotification === 'function') {
        pushNotification({
          title: 'New Calendar Event',
          message: `Event "${newEvent.title.trim()}" was added for ${newEvent.date}`,
          type: 'calendar',
          link: '/calendar',
        });
      }

      setNewEvent({ title: '', date: '', description: '', track: 'All Tracks', category: 'Training' });
      setShowAddEventModal(false);
    }
  };

  const openEditEventModal = (event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title || '',
      date: event.date || '',
      description: event.description || '',
      track: event.track || 'All Tracks',
      category: event.category || 'Training'
    });
    setSelectedDate(null);
    setShowAddEventModal(true);
  };

  const handleDeleteEvent = (eventId) => {
    if (viewingArchive) return;
    const updatedEvents = events.filter(e => e.id !== eventId);
    setEvents(updatedEvents);
    localStorage.setItem('nstp_calendar_events', JSON.stringify(updatedEvents));
  };

  const canPrev = useMemo(() => {
    if (!batchRange) return true;
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    return prev >= batchRange.minDate;
  }, [batchRange, currentDate]);

  const canNext = useMemo(() => {
    if (!batchRange) return true;
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    return next <= batchRange.maxDate;
  }, [batchRange, currentDate]);

  const changeMonth = (direction) => {
    const target = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1);
    if (batchRange) {
      if (direction < 0 && target < batchRange.minDate) return;
      if (direction > 0 && target > batchRange.maxDate) return;
    }
    setCurrentDate(target);
  };

  const handleGoToBatchToday = () => {
    if (!batchRange) {
      setCurrentDate(new Date());
      return;
    }
    const today = new Date();
    if (today >= batchRange.minDate && today <= batchRange.maxDate) {
      setCurrentDate(today);
    } else {
      setCurrentDate(new Date(batchRange.minDate.getFullYear(), batchRange.minDate.getMonth(), 15));
    }
  };

  // Category Badge Styler
  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Orientation':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Immersion':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Training':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Evaluation':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Culmination':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Deadline':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Holiday':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-emerald-50/20 to-slate-50 overflow-hidden flex flex-col">

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main Content */}
      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 p-2 sm:p-3 lg:p-5 ${sidebarOpen ? 'lg:ml-64' : ''}`}>

        {/* Hero Header Card */}
        <div className="flex-shrink-0 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl border border-emerald-800/40 relative mb-3 sm:mb-4 w-full">
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 relative z-10 w-full">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <button type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 sm:p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl shrink-0 transition-colors cursor-pointer active:scale-95 shadow-xs"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-xl sm:rounded-2xl p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
                <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain filter drop-shadow-xs scale-105" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-xs sm:text-lg lg:text-xl font-black tracking-tight text-white truncate leading-tight flex items-center gap-2">
                  <span>{viewingArchive ? `Archived Calendar - Batch ${archiveViewData?.year}` : 'NSTP Academic Calendar'}</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-emerald-300 font-medium truncate">
                  {viewingArchive ? 'Historical batch activity records' : 'A.Y. 2026-2027 • Official Schedule & Immersion Planner'}
                </p>
              </div>
            </div>

            {/* Top View Toggle Tabs & Add Event Button */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-emerald-950/80 p-1 rounded-xl sm:rounded-2xl border border-emerald-800 flex items-center gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewMode('monthly')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'monthly'
                      ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                  }`}
                  title="Monthly Grid View"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Monthly Grid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('annual_summary')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'annual_summary'
                      ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                  }`}
                  title="Whole Year Event Summary"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Annual Summary</span>
                </button>
              </div>

              {isAdmin && !viewingArchive && (
                <button type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setNewEvent({ title: '', date: '', description: '', track: 'All Tracks', category: 'Training' });
                    setShowAddEventModal(true);
                  }}
                  className="flex items-center space-x-1 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 text-[11px] sm:text-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-950" />
                  <span className="hidden sm:inline">Add Event</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Viewing Archive Banner */}
        {viewingArchive && archiveViewData && (
          <div className="flex-shrink-0 bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 px-4 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-md mb-3 font-bold text-xs sm:text-sm border border-amber-500">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-emerald-950 shrink-0" />
              <span>
                Viewing Archived Batch Calendar: <strong>Batch {archiveViewData.year}</strong>
                {batchRange && (
                  <span className="ml-2 px-2 py-0.5 bg-emerald-950 text-amber-300 rounded-lg text-[10.5px] font-black uppercase tracking-wider">
                    {batchRange.startLabel} – {batchRange.endLabel}
                  </span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setViewingArchive(false)}
              className="bg-emerald-950 text-amber-300 hover:bg-emerald-900 px-3 py-1 rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              Exit Archive
            </button>
          </div>
        )}

        {/* VIEW MODE 1: MONTHLY CALENDAR GRID */}
        {viewMode === 'monthly' ? (
          <div className="flex-1 bg-white rounded-2xl shadow-md p-2 sm:p-4 lg:p-5 flex flex-col overflow-hidden min-h-0 border border-slate-200/80">
            <div className="flex-shrink-0 flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  {viewingArchive ? 'Calendar navigation locked within this batch academic period' : 'Click on any day with events to view complete details'}
                </p>
              </div>
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button type="button"
                  onClick={() => changeMonth(-1)}
                  disabled={!canPrev}
                  className={`p-1.5 rounded-lg transition-colors ${
                    canPrev
                      ? 'hover:bg-white text-slate-700 cursor-pointer'
                      : 'text-slate-300 cursor-not-allowed opacity-40'
                  }`}
                  title={canPrev ? 'Previous Month' : 'Start of Batch Reached'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button type="button"
                  onClick={handleGoToBatchToday}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  {viewingArchive ? 'Start Month' : 'Today'}
                </button>
                <button type="button"
                  onClick={() => changeMonth(1)}
                  disabled={!canNext}
                  className={`p-1.5 rounded-lg transition-colors ${
                    canNext
                      ? 'hover:bg-white text-slate-700 cursor-pointer'
                      : 'text-slate-300 cursor-not-allowed opacity-40'
                  }`}
                  title={canNext ? 'Next Month' : 'End of Batch Reached'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className="flex-1 min-h-0"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'auto repeat(6, 1fr)', gap: '4px' }}
            >
              {[
                { full: 'Sun', short: 'S' },
                { full: 'Mon', short: 'M' },
                { full: 'Tue', short: 'T' },
                { full: 'Wed', short: 'W' },
                { full: 'Thu', short: 'T' },
                { full: 'Fri', short: 'F' },
                { full: 'Sat', short: 'S' },
              ].map(day => (
                <div key={day.full} className="text-center font-bold text-slate-600 text-[11px] py-1 bg-slate-100/70 rounded-lg">
                  <span className="sm:hidden">{day.short}</span>
                  <span className="hidden sm:inline">{day.full}</span>
                </div>
              ))}

              {getDaysInMonth(currentDate).map((day, index) => {
                const dayEvents = day ? getEventsForDate(day) : [];
                const isToday = day === new Date().getDate() &&
                               currentDate.getMonth() === new Date().getMonth() &&
                               currentDate.getFullYear() === new Date().getFullYear();
                const past = isPastDay(day);

                return (
                  <div
                    key={index}
                    className={`p-1 sm:p-1.5 border rounded-xl transition-all overflow-hidden flex flex-col ${
                      !day ? 'border-transparent bg-transparent' : past ? 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 cursor-pointer opacity-85' : 'bg-white hover:bg-emerald-50/30 cursor-pointer border-slate-200 hover:border-emerald-400 hover:shadow-xs'
                    } ${isToday ? '!bg-emerald-50/70 !border-emerald-500 !ring-1 !ring-emerald-400' : ''}`}
                    onClick={() => day && setSelectedDate(day)}
                  >
                    {day && (
                      <>
                        <div className={`text-xs font-black mb-1 flex items-center justify-between ${isToday ? 'text-emerald-800 font-black' : past ? 'text-slate-500' : 'text-slate-800'}`}>
                          <span className={`w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-600 text-white shadow-xs' : ''}`}>{day}</span>
                          {past && dayEvents.length > 0 && (
                            <span className="text-[8px] text-slate-400 font-semibold uppercase">Past</span>
                          )}
                        </div>
                        <div className="space-y-1 hidden sm:block flex-1 overflow-hidden">
                          {dayEvents.slice(0, 2).map((event, idx) => (
                            <div
                              key={idx}
                              className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-bold truncate border ${
                                event.type === 'holiday'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : event.category === 'Immersion'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : event.category === 'Evaluation'
                                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                                      : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}
                              title={`${event.title}${past ? ' (Past Event)' : ''}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-[9px] text-emerald-800 font-bold px-1">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                        {dayEvents.length > 0 && (
                          <div className="sm:hidden mt-auto flex flex-wrap gap-1">
                            {dayEvents.slice(0, 3).map((event, idx) => (
                              <span
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full inline-block ${
                                  event.type === 'holiday' ? 'bg-red-500' : event.category === 'Immersion' ? 'bg-emerald-500' : 'bg-blue-500'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* VIEW MODE 2: COMPREHENSIVE ANNUAL EVENTS SUMMARY */
          <div className="flex-1 bg-white rounded-2xl shadow-md p-3 sm:p-5 flex flex-col overflow-hidden min-h-0 border border-slate-200/80">
            
            {/* Summary Header Bar */}
            <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-700" />
                  <span>{viewingArchive && archiveViewData?.year ? `Archived Events Summary — Batch ${archiveViewData.year}` : 'Annual Events Summary & Whole Year Schedule'}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-900 font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                    {viewingArchive && archiveViewData?.year ? `Batch ${archiveViewData.year}` : 'A.Y. 2026-2027'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Complete chronological matrix of all orientations, community immersions, military drills, evaluations, and holidays.
                </p>
              </div>
            </div>

            {/* KPI Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3 shrink-0">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Scheduled</span>
                <span className="text-base sm:text-lg font-black text-slate-900">{summaryMetrics.total}</span>
              </div>
              <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 text-center">
                <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Field Immersion</span>
                <span className="text-base sm:text-lg font-black text-emerald-900">{summaryMetrics.immersions}</span>
              </div>
              <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 text-center">
                <span className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">Training &amp; Drills</span>
                <span className="text-base sm:text-lg font-black text-amber-900">{summaryMetrics.trainings}</span>
              </div>
              <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-200 text-center">
                <span className="block text-[10px] font-bold text-purple-700 uppercase tracking-wider">Defense &amp; Exams</span>
                <span className="text-base sm:text-lg font-black text-purple-900">{summaryMetrics.evaluations}</span>
              </div>
              <div className="bg-red-50/70 p-2.5 rounded-xl border border-red-200 text-center col-span-2 sm:col-span-1">
                <span className="block text-[10px] font-bold text-red-700 uppercase tracking-wider">Holidays</span>
                <span className="text-base sm:text-lg font-black text-red-900">{summaryMetrics.holidays}</span>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 mb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Semester Filter */}
                <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSummarySemester('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      summarySemester === 'all' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All Year
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummarySemester('1st')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      summarySemester === '1st' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    1st Sem
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummarySemester('2nd')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      summarySemester === '2nd' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    2nd Sem
                  </button>
                </div>

                {/* Track Filter */}
                <select
                  value={summaryTrack}
                  onChange={(e) => setSummaryTrack(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Tracks</option>
                  <option value="CWTS">CWTS Component</option>
                  <option value="ROTC">ROTC Component</option>
                  <option value="LTS">LTS Component</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search events, keywords, or dates..."
                  value={summarySearch}
                  onChange={(e) => setSummarySearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 font-medium"
                />
                {summarySearch && (
                  <button
                    type="button"
                    onClick={() => setSummarySearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Chronological Month-by-Month Events Timeline */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {Object.keys(groupedSummaryEvents).length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600">No scheduled events found matching your criteria</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting the semester or component track filter</p>
                </div>
              ) : (
                Object.entries(groupedSummaryEvents).map(([monthYear, evList]) => (
                  <div key={monthYear} className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3 sm:p-4">
                    {/* Month Section Header */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                      <h3 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-emerald-700" />
                        <span>{monthYear}</span>
                      </h3>
                      <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                        {evList.length} activity{evList.length !== 1 ? 'ies' : ''}
                      </span>
                    </div>

                    {/* Cards List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {evList.map((ev, idx) => {
                        const evDate = new Date(ev.date);
                        const dayNum = evDate.getDate();
                        const dayName = evDate.toLocaleDateString('en-US', { weekday: 'short' });
                        const isPast = ev.date < todayStr;

                        return (
                          <div
                            key={ev.id || idx}
                            className={`bg-white rounded-xl p-3 border transition-all hover:shadow-sm flex items-start gap-3 ${
                              ev.type === 'holiday'
                                ? 'border-red-200 hover:border-red-300'
                                : 'border-slate-200 hover:border-emerald-400'
                            }`}
                          >
                            {/* Date Badge */}
                            <div className={`w-12 text-center rounded-xl p-1.5 border shrink-0 ${
                              ev.type === 'holiday'
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : isPast
                                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            }`}>
                              <span className="block text-[9px] font-black uppercase tracking-wide">{dayName}</span>
                              <span className="block text-base font-black leading-tight">{dayNum}</span>
                            </div>

                            {/* Event Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                {ev.category && (
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase ${getCategoryBadgeClass(ev.category)}`}>
                                    {ev.category}
                                  </span>
                                )}
                                {ev.track && (
                                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                    {ev.track}
                                  </span>
                                )}
                                {ev.semester && (
                                  <span className="text-[9px] font-bold text-slate-400">
                                    • {ev.semester}
                                  </span>
                                )}
                              </div>

                              <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug truncate">
                                {ev.title}
                              </h4>
                              
                              {ev.description && (
                                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                  {ev.description}
                                </p>
                              )}

                              {/* Footer Meta */}
                              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                                <span>Date: {ev.date}</span>
                                {isAdmin && !viewingArchive && ev.type === 'custom' && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => openEditEventModal(ev)}
                                      className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                                      title="Edit Event"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteEvent(ev.id)}
                                      className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                                      title="Delete Event"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* Day Events Modal */}
        {selectedDate && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => setSelectedDate(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Read-Only Notice Banner for Past Days */}
              {isPastDay(selectedDate) && (
                <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 text-[11px] font-bold text-amber-900 flex items-center justify-between shrink-0">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    Past Event Record (Read-Only)
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase font-black">View Only</span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).replace(/\d+,/, `${selectedDate},`)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    {getEventsForDate(selectedDate).length === 0
                      ? 'No scheduled events on this day'
                      : `${getEventsForDate(selectedDate).length} event${getEventsForDate(selectedDate).length !== 1 ? 's' : ''} listed`}
                  </p>
                </div>
                <button type="button"
                  onClick={() => setSelectedDate(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Event list */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-gray-400 text-xs font-semibold text-center py-8">No events recorded for this date.</p>
                ) : (
                  getEventsForDate(selectedDate).map((event, idx) => (
                    <div key={idx} className={`p-3.5 rounded-2xl border transition-all ${
                      event.type === 'holiday'
                        ? 'bg-red-50/60 border-red-200/80'
                        : isPastDay(selectedDate)
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-emerald-50/60 border-emerald-200/80'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                            event.type === 'holiday' ? 'bg-red-500' : isPastDay(selectedDate) ? 'bg-gray-400' : 'bg-emerald-600'
                          }`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs sm:text-sm font-black text-gray-900">{event.title}</p>
                              {event.category && (
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${getCategoryBadgeClass(event.category)}`}>
                                  {event.category}
                                </span>
                              )}
                              {event.isEdited && (
                                <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                  ✏️ Edited
                                </span>
                              )}
                              {isPastDay(selectedDate) && (
                                <span className="text-[9px] bg-gray-200 text-gray-700 font-extrabold px-2 py-0.5 rounded-full uppercase">Past</span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-xs text-gray-600 mt-1.5 whitespace-pre-line font-medium leading-relaxed">{event.description}</p>
                            )}
                            {event.createdBy && (
                              <p className="text-[11px] text-gray-400 font-semibold mt-1.5">Organized by {event.createdBy}</p>
                            )}
                          </div>
                        </div>

                        {isAdmin && !viewingArchive && !isPastDay(selectedDate) && event.type === 'custom' && (
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditEventModal(event)}
                              className="p-1 hover:bg-white rounded-lg text-gray-500 hover:text-emerald-700 transition-colors"
                              title="Edit Event"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteEvent(event.id);
                                setSelectedDate(null);
                              }}
                              className="p-1 hover:bg-white rounded-lg text-gray-500 hover:text-red-700 transition-colors"
                              title="Delete Event"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/80 shrink-0">
                {isPastDay(selectedDate) ? (
                  <p className="text-xs text-gray-500 font-medium text-center flex items-center justify-center gap-1.5 py-1">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Past events are locked for record-keeping and cannot be modified or deleted.</span>
                  </p>
                ) : (
                  isAdmin && (
                    <button type="button"
                      onClick={() => {
                        const pad = (n) => String(n).padStart(2, '0');
                        const dateStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(selectedDate)}`;
                        setEditingEvent(null);
                        setNewEvent({ title: '', date: dateStr, description: '', track: 'All Tracks', category: 'Training' });
                        setSelectedDate(null);
                        setShowAddEventModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Event for this Day
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Event Modal */}
        {showAddEventModal && (
          <div className="fixed inset-0 bg-emerald-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => { setShowAddEventModal(false); setEditingEvent(null); }}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col border border-emerald-100/80 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white p-5 sm:p-6 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                      {editingEvent ? 'Edit Calendar Event' : 'Add New Event'}
                    </h3>
                    <p className="text-emerald-200 text-xs font-medium">
                      {editingEvent ? 'Update scheduled activity details' : 'Schedule activity or announcement'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAddEventModal(false); setEditingEvent(null); }}
                  className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Event Title *</label>
                  <input
                    type="text"
                    id="event-title"
                    name="eventTitle"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                    placeholder="Enter event title..."
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Category</label>
                    <select
                      value={newEvent.category || 'Training'}
                      onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                    >
                      <option value="Orientation">Orientation</option>
                      <option value="Immersion">Immersion</option>
                      <option value="Training">Training</option>
                      <option value="Evaluation">Evaluation</option>
                      <option value="Culmination">Culmination</option>
                      <option value="Deadline">Deadline</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Target Track</label>
                    <select
                      value={newEvent.track || 'All Tracks'}
                      onChange={(e) => setNewEvent({...newEvent, track: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                    >
                      <option value="All Tracks">All Tracks</option>
                      <option value="CWTS">CWTS</option>
                      <option value="ROTC">ROTC</option>
                      <option value="LTS">LTS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Scheduled Date *</label>
                  <input
                    type="date"
                    id="event-date"
                    name="eventDate"
                    value={newEvent.date}
                    min={todayStr}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                    Description <span className="text-gray-400 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    id="event-description"
                    name="eventDescription"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    rows={3}
                    autoComplete="off"
                    placeholder="Add details, instructions or notes about this event..."
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none resize-none font-medium"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowAddEventModal(false); setEditingEvent(null); }}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEvent}
                  disabled={!newEvent.title.trim() || !newEvent.date}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingEvent ? 'Update Event' : 'Add Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Calendar;
