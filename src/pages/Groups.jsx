import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Button, IconButton, Paper, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Chip, Stack, Divider, Drawer, Select, MenuItem,
  FormControl, Checkbox, FormControlLabel, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import CloseIcon from '@mui/icons-material/Close';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SchoolIcon from '@mui/icons-material/School';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

// ── helpers ──────────────────────────────────────────────────────────────────
const token = () => localStorage.getItem('token');

const WEEK_DAYS = [
  { label: 'Dushanba', value: 'Monday' },
  { label: 'Seshanba', value: 'Tuesday' },
  { label: 'Chorshanba', value: 'Wednesday' },
  { label: 'Payshanba', value: 'Thursday' },
  { label: 'Juma', value: 'Friday' },
  { label: 'Shanba', value: 'Saturday' },
  { label: 'Yakshanba', value: 'Sunday' },
];

const DAY_SHORT = {
  Monday: 'Du', Tuesday: 'Se', Wednesday: 'Chor',
  Thursday: 'Pay', Friday: 'Ju', Saturday: 'Shan', Sunday: 'Yak'
};

const COURSE_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899', '#06b6d4'];
const courseColor = (name = '') => COURSE_COLORS[name.charCodeAt(0) % COURSE_COLORS.length];

const avatarColors = ['#7b61ff', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'];
const avatarColor = (i) => avatarColors[i % avatarColors.length];

const initials = (name = '') => {
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (p[0]?.[0] || '?').toUpperCase();
};

const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`;
};

const emptyForm = () => ({
  name: '', description: '', course_id: '', room_id: '',
  week_day: [], start_time: '09:00',
  start_date: '', end_date: '',
  teachers: [], students: []
});

// ── component ─────────────────────────────────────────────────────────────────
export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('groups');
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState([]);

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [userRole, setUserRole] = useState(null);

  async function fetchGroups() {
    try {
      const tokenVal = localStorage.getItem('token');
      let role = '';
      if (tokenVal) {
        try {
          const payload = JSON.parse(atob(tokenVal.split('.')[1]));
          role = payload.role;
          setUserRole(role);
        } catch (e) {
          console.error(e);
        }
      }

      if (role === 'TEACHER') {
        const res = await api.get('/api/v1/teachers/group/students');
        const teacherGroups = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const normalized = teacherGroups.map(tg => ({
          id: tg.id,
          name: tg.name,
          status: 'active',
          course: '—',
          course_duration: 2,
          start_date: tg.start_date,
          end_date: null,
          start_time: tg.start_time,
          week_day: tg.week_day,
          rooms: '—',
          teachers: [],
          students: tg.studentCount || (tg.students ? tg.students.length : 0),
        }));
        setGroups(normalized);
      } else {
        const res = await api.get('/api/v1/groups');
        setGroups(Array.isArray(res.data) ? res.data : (res.data?.data || []));
      }
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  }

  async function fetchCourses() {
    try { const res = await api.get('/api/v1/courses/all'); setCourses(res.data?.data || res.data || []); } catch { }
  }

  async function fetchRooms() {
    try { const res = await api.get('/api/v1/rooms?status=active'); setRooms(res.data?.data || res.data || []); } catch { }
  }

  async function fetchTeachers() {
    try { const res = await api.get('/api/v1/teachers'); setTeachers(res.data?.data || res.data || []); } catch { }
  }

  async function fetchStudents() {
    try { const res = await api.get('/api/v1/students/all'); setStudents(res.data?.data || res.data || []); } catch { }
  }

  useEffect(() => {
    if (!token() || token() === 'undefined') { window.location.href = '/login'; return; }
    fetchGroups();
  }, []);

  const uniqueTeachers = new Set(groups.flatMap(g => (g.teachers || []).map(t => t.id))).size;
  const totalStudents = groups.reduce((s, g) => s + (Number(g.students) || 0), 0);

  async function handleSubmit() {
    if (editingId) {
      await updateGroup();
    } else {
      await saveGroup();
    }
  }

  async function saveGroup() {
    if (!form.name || !form.course_id || !form.room_id || !form.start_date || !form.end_date || form.week_day.length === 0) {
      alert("Barcha majburiy maydonlarni to'ldiring!"); return;
    }
    setSaving(true);
    try {
      await api.post('/api/v1/groups', {
        name: form.name,
        description: form.description || form.name,
        course_id: Number(form.course_id),
        room_id: Number(form.room_id),
        week_day: form.week_day,
        start_time: form.start_time,
        start_date: form.start_date,
        end_date: form.end_date,
        max_students: 30,
        teachers: form.teachers.map(Number),
        students: form.students.map(Number),
      });
      fetchGroups();
      setDrawerOpen(false);
      setForm(emptyForm());
    } catch (e) {
      const msg = e.response?.data?.message;
      alert('Xatolik: ' + (Array.isArray(msg) ? msg.join(', ') : msg || 'Saqlab bo\'lmadi'));
    } finally { setSaving(false); }
  }

  async function updateGroup() {
    if (!form.name || !form.course_id || !form.room_id || !form.start_date || !form.end_date || form.week_day.length === 0) {
      alert("Barcha majburiy maydonlarni to'ldiring!"); return;
    }
    setSaving(true);
    try {
      await api.put(`/api/v1/groups/${editingId}`, {
        name: form.name,
        description: form.description || form.name,
        course_id: Number(form.course_id),
        room_id: Number(form.room_id),
        week_day: form.week_day,
        start_time: form.start_time,
        start_date: form.start_date,
        end_date: form.end_date,
        max_students: 30,
        teachers: form.teachers.map(Number),
        students: form.students.map(Number),
      });
      fetchGroups();
      setDrawerOpen(false);
      setEditingId(null);
      setForm(emptyForm());
    } catch (e) {
      const msg = e.response?.data?.message;
      alert('Xatolik: ' + (Array.isArray(msg) ? msg.join(', ') : msg || 'Yangilab bo\'lmadi'));
    } finally { setSaving(false); }
  }

  function openCreateDrawer() {
    setEditingId(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }

  async function openEditDrawer(group) {
    setEditingId(group.id);

    // Pre-fetch courses and rooms if they are empty
    let currentCourses = courses;
    let currentRooms = rooms;
    if (courses.length === 0) {
      try {
        const res = await api.get('/api/v1/courses/all');
        currentCourses = res.data?.data || res.data || [];
        setCourses(currentCourses);
      } catch {}
    }
    if (rooms.length === 0) {
      try {
        const res = await api.get('/api/v1/rooms?status=active');
        currentRooms = res.data?.data || res.data || [];
        setRooms(currentRooms);
      } catch {}
    }

    const foundCourse = currentCourses.find(c => c.name === group.course);
    const foundRoom = currentRooms.find(r => r.name === group.rooms);

    let studentIds = [];
    try {
      await fetchStudents();
      await fetchTeachers();
      const res = await api.get(`/api/v1/groups/${group.id}`);
      const fullGroupData = res.data?.data || res.data;
      studentIds = fullGroupData.studentGroups?.map(sg => sg.students?.id).filter(Boolean) || [];
    } catch (e) {
      console.error("Guruh tafsilotlarini yuklashda xatolik:", e);
    }

    setForm({
      id: group.id,
      name: group.name,
      description: group.description || group.name,
      course_id: foundCourse ? foundCourse.id : '',
      room_id: foundRoom ? foundRoom.id : '',
      week_day: group.week_day || [],
      start_time: group.start_time || '09:00',
      start_date: group.start_date ? group.start_date.split('T')[0] : '',
      end_date: group.end_date ? group.end_date.split('T')[0] : '',
      teachers: (group.teachers || []).map(t => t.id),
      students: studentIds
    });
    setDrawerOpen(true);
  }

  const triggerDelete = (id) => {
    setGroupToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      await api.delete(`/api/v1/groups/${groupToDelete}`);
      fetchGroups();
      setDeleteConfirmOpen(false);
      setGroupToDelete(null);
    } catch (e) {
      alert('Xatolik: ' + (e.response?.data?.message || 'O\'chirib bo\'lmadi'));
    }
  };

  async function restoreGroup(id) {
    try {
      await api.put(`/api/v1/groups/${id}`, { status: 'active' });
      fetchGroups();
    } catch (e) {
      alert('Xatolik: ' + (e.response?.data?.message || 'Qaytarib bo\'lmadi'));
    }
  }

  const toggleDay = (day) => setForm(f => ({
    ...f, week_day: f.week_day.includes(day) ? f.week_day.filter(d => d !== day) : [...f.week_day, day]
  }));

  const openTeacherModal = () => {
    setSelectedTeachers(form.teachers.map(Number));
    setTeacherSearch('');
    setTeacherModalOpen(true);
  };
  const confirmTeachers = () => {
    setForm(f => ({ ...f, teachers: selectedTeachers }));
    setTeacherModalOpen(false);
  };
  const toggleTeacher = (id) => setSelectedTeachers(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );

  const openStudentModal = () => {
    setSelectedStudents(form.students.map(Number));
    setStudentSearch('');
    setStudentModalOpen(true);
  };
  const confirmStudents = () => {
    setForm(f => ({ ...f, students: selectedStudents }));
    setStudentModalOpen(false);
  };
  const toggleStudent = (id) => setSelectedStudents(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );

  const filteredTeachers = teachers.filter(t =>
    t.full_name?.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.phone?.includes(teacherSearch)
  );
  const filteredStudents = students.filter(s =>
    s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.phone?.includes(studentSearch)
  );

  const displayedGroups = groups.filter(g =>
    activeTab === 'archive' ? g.status === 'cancelled' : g.status !== 'cancelled'
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>Guruhlar</Typography>
        {userRole !== 'TEACHER' && (
          <Button
            variant="contained" startIcon={<AddIcon />}
            onClick={openCreateDrawer}
            sx={{ backgroundColor: '#7b61ff', textTransform: 'none', borderRadius: '10px', px: 2.5, fontWeight: 700, '&:hover': { backgroundColor: '#6a50e8' } }}
          >
            Guruh qo'shish
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, overflowX: 'auto', pb: 0.5 }}>
        {[
          { key: 'groups', label: "Guruhlar" },
          { key: 'archive', label: "Arxiv", icon: <CalendarMonthIcon sx={{ fontSize: 16 }} /> }
        ].map(tab => (
          <Button key={tab.key} startIcon={tab.icon}
            onClick={() => setActiveTab(tab.key)}
            sx={{
              textTransform: 'none', borderRadius: '8px', fontWeight: 600, px: 2,
              color: activeTab === tab.key ? '#7b61ff' : '#6b7280',
              borderBottom: activeTab === tab.key ? '2px solid #7b61ff' : '2px solid transparent',
              '&:hover': { backgroundColor: 'transparent', color: '#7b61ff' },
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      {/* Stat cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2.5, mb: 3 }}>
        {[
          { label: 'Jami guruhlar', value: groups.length, icon: <PeopleAltIcon sx={{ fontSize: 28, color: '#7b61ff' }} />, bg: '#f0eeff' },
          { label: "O'qituvchilar", value: uniqueTeachers, icon: <SchoolIcon sx={{ fontSize: 28, color: '#10b981' }} />, bg: '#ecfdf5' },
          { label: "O'quvchilar", value: totalStudents, icon: <SchoolIcon sx={{ fontSize: 28, color: '#f59e0b' }} />, bg: '#fffbeb' },
        ].map((card, i) => (
          <Paper key={i} elevation={0} sx={{ p: 3, border: '1px solid #e5e7eb', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', mb: 1 }}>{card.label}</Typography>
              <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{card.value}</Typography>
            </Box>
            <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {card.icon}
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f9fafb' }}>
              <TableRow>
                {['Status', 'Guruh', 'Kurs', 'Davomiyligi', 'Dars vaqti', 'Xona', "O'qituvchi", 'Talabalar', ...(userRole !== 'TEACHER' ? ['Amallar'] : [])].map(col => (
                  <TableCell key={col} sx={{ fontWeight: 600, color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userRole === 'TEACHER' ? 8 : 9} align="center" sx={{ py: 6, color: '#9ca3af' }}>Ma'lumot topilmadi</TableCell>
                </TableRow>
              ) : displayedGroups.map((group) => {
                const teachers = group.teachers || [];
                const students = group.students || [];
                const days = (group.week_day || []).map(d => DAY_SHORT[d] || d).join(', ');
                const cColor = courseColor(group.course || '');
                return (
                  <TableRow key={group.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    {/* Status */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Switch
                          size="small"
                          checked={group.status === 'active'}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#3b82f6' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#93c5fd' } }}
                        />
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#3b82f6' }}>ACTIVE</Typography>
                      </Box>
                    </TableCell>

                    {/* Guruh nomi */}
                    <TableCell>
                      <Typography
                        onClick={() => navigate(`/group/${group.id}`)}
                        sx={{
                          fontWeight: 600, fontSize: '0.85rem', color: '#7b61ff',
                          cursor: 'pointer', '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {group.name}
                      </Typography>
                    </TableCell>

                    {/* Kurs badge */}
                    <TableCell>
                      <Chip label={group.course || '—'} size="small"
                        sx={{
                          fontSize: '0.7rem', fontWeight: 700, height: 22,
                          backgroundColor: cColor + '20', color: cColor, border: `1px solid ${cColor}40`
                        }} />
                    </TableCell>

                    {/* Davomiyligi */}
                    <TableCell>
                      <Typography sx={{ fontSize: '0.78rem', color: '#374151', fontWeight: 500 }}>
                        {group.course_duration ? `${group.course_duration * 60} minut` : '—'}
                      </Typography>
                      {group.start_date && (
                        <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                          {fmtDate(group.start_date)}{group.end_date ? ` – ${fmtDate(group.end_date)}` : ''}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Dars vaqti */}
                    <TableCell>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>{group.start_time || '—'}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af' }}>{days}</Typography>
                    </TableCell>

                    {/* Xona */}
                    <TableCell>
                      <Typography sx={{ fontSize: '0.82rem', color: '#374151' }}>{group.rooms || '—'}</Typography>
                    </TableCell>

                    {/* O'qituvchi */}
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {teachers.length === 0
                          ? <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af' }}>—</Typography>
                          : teachers.map((t) => (
                            <Typography key={t.id} sx={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              px: 1,
                              py: 0.3,
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              color: '#4b5563',
                              backgroundColor: '#f9fafb',
                              whiteSpace: 'nowrap'
                            }}>
                              {t.full_name}
                            </Typography>
                          ))
                        }
                      </Box>
                    </TableCell>

                    {/* Talabalar */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 3 }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{students}</Typography>
                      </Box>
                    </TableCell>

                    {/* Actions */}
                    {userRole !== 'TEACHER' && (
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {activeTab === 'archive' ? (
                            <IconButton size="small" onClick={() => restoreGroup(group.id)} sx={{ color: '#10b981', '&:hover': { color: '#059669' } }}>
                              <RefreshIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          ) : (
                            <>
                              <IconButton size="small" onClick={() => triggerDelete(group.id)} sx={{ color: '#9ca3af', '&:hover': { color: '#ef4444' } }}>
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                              <IconButton size="small" onClick={() => openEditDrawer(group)} sx={{ color: '#9ca3af', '&:hover': { color: '#10b981' } }}>
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Add Group Drawer ── */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        sx={{ zIndex: 2000 }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(2px)',
            }
          }
        }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, display: 'flex', flexDirection: 'column' } }}>

        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingId ? 'Guruhni tahrirlash' : 'Guruh qo\'shish'}</Typography>
            <Typography variant="caption" color="text.secondary">{editingId ? 'Mavjud guruh ma\'lumotlarini o\'zgartiring.' : 'Yangi guruh yaratish uchun quyidagi ma\'lumotlarni kiriting.'}</Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
        </Box>
        <Divider />

        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
          <Stack spacing={2.5}>

            {/* Guruh nomi */}
            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Guruh nomi <span style={{ color: '#ef4444' }}>*</span></Typography>
              <TextField fullWidth size="small" placeholder="Guruh nomini kiriting"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Box>

            {/* Kurs */}
            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Kurs <span style={{ color: '#ef4444' }}>*</span></Typography>
              <FormControl fullWidth size="small">
                <Select value={form.course_id}
                  onOpen={fetchCourses}
                  onChange={e => setForm({ ...form, course_id: e.target.value })}
                  MenuProps={{ sx: { zIndex: 3000 } }}
                  displayEmpty sx={{ borderRadius: '8px' }}>
                  <MenuItem value="" disabled>Kursni tanlang</MenuItem>
                  {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            {/* Xona */}
            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Xona <span style={{ color: '#ef4444' }}>*</span></Typography>
              <FormControl fullWidth size="small">
                <Select value={form.room_id}
                  onOpen={fetchRooms}
                  onChange={e => setForm({ ...form, room_id: e.target.value })}
                  MenuProps={{ sx: { zIndex: 3000 } }}
                  displayEmpty sx={{ borderRadius: '8px' }}>
                  <MenuItem value="" disabled>Xonani tanlang</MenuItem>
                  {rooms.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            {/* Dars kunlari */}
            <Box>
              <Typography sx={{ mb: 1, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Dars kunlari <span style={{ color: '#ef4444' }}>*</span></Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                {WEEK_DAYS.map(d => (
                  <FormControlLabel key={d.value}
                    control={
                      <Checkbox size="small"
                        checked={form.week_day.includes(d.value)}
                        onChange={() => toggleDay(d.value)}
                        sx={{ '&.Mui-checked': { color: '#7b61ff' } }} />
                    }
                    label={<Typography sx={{ fontSize: '0.82rem' }}>{d.label}</Typography>}
                  />
                ))}
              </Box>
            </Box>

            {/* Dars vaqti */}
            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Dars vaqti <span style={{ color: '#ef4444' }}>*</span></Typography>
              <TextField fullWidth size="small" type="time"
                value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Box>

            {/* Boshlanish sanasi */}
            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Boshlanish sanasi <span style={{ color: '#ef4444' }}>*</span></Typography>
              <TextField fullWidth size="small" type="date"
                value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Box>

            {/* Tugash sanasi */}
            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Tugash sanasi <span style={{ color: '#ef4444' }}>*</span></Typography>
              <TextField fullWidth size="small" type="date"
                value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Box>

            {/* O'qituvchilar */}
            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>O'qituvchilar</Typography>
              {form.teachers.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {form.teachers.map(tid => {
                    const t = teachers.find(x => x.id === tid);
                    return t ? (
                      <Chip key={tid} label={t.full_name} size="small" onDelete={() => setForm(f => ({ ...f, teachers: f.teachers.filter(i => i !== tid) }))}
                        sx={{ backgroundColor: '#f0eeff', color: '#7b61ff', fontWeight: 600, fontSize: '0.72rem' }} />
                    ) : null;
                  })}
                </Box>
              )}
              <Box onClick={() => { fetchTeachers(); openTeacherModal(); }}
                sx={{
                  border: '1.5px dashed #d1d5db', borderRadius: '8px', p: 1.5, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 1, '&:hover': { borderColor: '#7b61ff', backgroundColor: '#faf9ff' }
                }}>
                <AddIcon sx={{ fontSize: 18, color: '#7b61ff' }} />
                <Typography sx={{ fontSize: '0.82rem', color: '#7b61ff', fontWeight: 600 }}>Qo'shish</Typography>
              </Box>
            </Box>

            {/* Studentlar */}
            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Studentlar</Typography>
              {form.students.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {form.students.map(sid => {
                    const s = students.find(x => x.id === sid);
                    return s ? (
                      <Chip key={sid} label={s.full_name} size="small" onDelete={() => setForm(f => ({ ...f, students: f.students.filter(i => i !== sid) }))}
                        sx={{ backgroundColor: '#ecfdf5', color: '#10b981', fontWeight: 600, fontSize: '0.72rem' }} />
                    ) : null;
                  })}
                </Box>
              )}
              <Box onClick={() => { fetchStudents(); openStudentModal(); }}
                sx={{
                  border: '1.5px dashed #d1d5db', borderRadius: '8px', p: 1.5, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 1, '&:hover': { borderColor: '#7b61ff', backgroundColor: '#faf9ff' }
                }}>
                <AddIcon sx={{ fontSize: 18, color: '#7b61ff' }} />
                <Typography sx={{ fontSize: '0.82rem', color: '#7b61ff', fontWeight: 600 }}>Qo'shish</Typography>
              </Box>
            </Box>

          </Stack>
        </Box>

        <Divider />
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={() => setDrawerOpen(false)}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#e5e7eb', color: '#374151' }}>
            Bekor qilish
          </Button>
          <Button fullWidth variant="contained" onClick={handleSubmit} disabled={saving}
            sx={{ backgroundColor: '#7b61ff', borderRadius: '8px', textTransform: 'none', fontWeight: 700, '&:hover': { backgroundColor: '#6a50e8' } }}>
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </Box>
      </Drawer>

      {/* ── Teacher Selection Modal ── */}
      <Dialog open={teacherModalOpen} onClose={() => setTeacherModalOpen(false)} maxWidth="sm" fullWidth
        sx={{ zIndex: 2100 }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(2px)',
            }
          }
        }}
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>O'qituvchi tanlash</Typography>
            <Typography variant="body2" color="text.secondary">Bir yoki bir nechta o'qituvchini tanlang</Typography>
          </Box>
          <IconButton onClick={() => setTeacherModalOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, pt: 1 }}>
          <TextField fullWidth size="small" placeholder="O'qituvchi qidiring..."
            value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> } }}
          />
          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {filteredTeachers.length === 0
              ? <Typography sx={{ textAlign: 'center', color: '#9ca3af', py: 3 }}>O'qituvchi topilmadi</Typography>
              : filteredTeachers.map(t => (
                <Box key={t.id} onClick={() => toggleTeacher(t.id)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '8px',
                    cursor: 'pointer', mb: 0.5, '&:hover': { backgroundColor: '#f9fafb' },
                    backgroundColor: selectedTeachers.includes(t.id) ? '#f0eeff' : 'transparent'
                  }}>
                  <Checkbox size="small" checked={selectedTeachers.includes(t.id)}
                    onChange={() => toggleTeacher(t.id)} onClick={e => e.stopPropagation()}
                    sx={{ '&.Mui-checked': { color: '#7b61ff' } }} />
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#7b61ff' }}>
                    {initials(t.full_name)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>{t.full_name}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af' }}>{t.phone}</Typography>
                  </Box>
                </Box>
              ))
            }
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
          <Button onClick={() => setTeacherModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#e5e7eb', color: '#374151', flex: 1 }}>Bekor qilish</Button>
          <Button onClick={confirmTeachers} variant="contained" sx={{ backgroundColor: '#7b61ff', borderRadius: '8px', textTransform: 'none', fontWeight: 700, flex: 1, '&:hover': { backgroundColor: '#6a50e8' } }}>Qo'shish</Button>
        </DialogActions>
      </Dialog>

      {/* ── Student Selection Modal ── */}
      <Dialog open={studentModalOpen} onClose={() => setStudentModalOpen(false)} maxWidth="sm" fullWidth
        sx={{ zIndex: 2100 }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(2px)',
            }
          }
        }}
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Student tanlash</Typography>
            <Typography variant="body2" color="text.secondary">Bir yoki bir nechta studentni tanlang</Typography>
          </Box>
          <IconButton onClick={() => setStudentModalOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, pt: 1 }}>
          <TextField fullWidth size="small" placeholder="Student qidiring..."
            value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> } }}
          />
          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {filteredStudents.length === 0
              ? <Typography sx={{ textAlign: 'center', color: '#9ca3af', py: 3 }}>Student topilmadi</Typography>
              : filteredStudents.map(s => (
                <Box key={s.id} onClick={() => toggleStudent(s.id)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '8px',
                    cursor: 'pointer', mb: 0.5, '&:hover': { backgroundColor: '#f9fafb' },
                    backgroundColor: selectedStudents.includes(s.id) ? '#ecfdf5' : 'transparent'
                  }}>
                  <Checkbox size="small" checked={selectedStudents.includes(s.id)}
                    onChange={() => toggleStudent(s.id)} onClick={e => e.stopPropagation()}
                    sx={{ '&.Mui-checked': { color: '#10b981' } }} />
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#10b981' }}>
                    {initials(s.full_name)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>{s.full_name}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af' }}>{s.phone}</Typography>
                  </Box>
                </Box>
              ))
            }
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
          <Button onClick={() => setStudentModalOpen(false)} variant="outlined" sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#e5e7eb', color: '#374151', flex: 1 }}>Bekor qilish</Button>
          <Button onClick={confirmStudents} variant="contained" sx={{ backgroundColor: '#10b981', borderRadius: '8px', textTransform: 'none', fontWeight: 700, flex: 1, '&:hover': { backgroundColor: '#059669' } }}>Qo'shish</Button>
        </DialogActions>
      </Dialog>

      {/* ─── O'chirishni Tasdiqlash Modali (Beautiful Premium UI) ─── */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            width: '420px',
            maxWidth: '90vw',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{
              width: 64, height: 64,
              borderRadius: '50%',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto', mb: 3
            }}>
              <DeleteOutlineIcon sx={{ fontSize: 32, color: '#ef4444' }} />
            </Box>

            <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#111827', mb: 1.5 }}>
              Guruhni arxivlash
            </Typography>

            <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5, mb: 4 }}>
              Haqiqatan ham ushbu guruhni arxivga ko'chirmoqchimisiz? Uni keyinchalik arxiv bo'limidan yana faollashtirishingiz mumkin.
            </Typography>

            <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
              <Button
                onClick={() => setDeleteConfirmOpen(false)}
                variant="outlined"
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#e5e7eb',
                  color: '#374151',
                  px: 3, py: 1.2,
                  '&:hover': { borderColor: '#d1d5db', backgroundColor: '#f9fafb' }
                }}
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleConfirmDelete}
                variant="contained"
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  px: 3, py: 1.2,
                  '&:hover': { backgroundColor: '#dc2626' }
                }}
              >
                Arxivlash
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
