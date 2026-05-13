import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Button, IconButton, Paper, Avatar,
  Switch, TextField, Radio, RadioGroup,
  FormControl, FormControlLabel, CircularProgress, Snackbar, Alert, Tab, Tabs
} from '@mui/material';
import ArrowBackIcon   from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon  from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const token      = () => localStorage.getItem('token');

const SHORT_MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_UZ  = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

const fmtDateUz = (d) => {
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTH_UZ[dt.getMonth()]}, ${dt.getFullYear()}`;
};

const initials = (name = '') => {
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (p[0]?.[0] || '?').toUpperCase();
};

export default function Attendance() {
  const { id, date } = useParams();
  const navigate     = useNavigate();

  const [group,       setGroup]      = useState(null);
  const [schedule,    setSchedule]   = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [teacherTab,  setTeacherTab] = useState(0);        // 0=Teacher 1=Assistant
  const [calMonthIdx, setCalMonthIdx]= useState(null);
  const [lessonTopic, setLessonTopic]= useState('');
  const [lessonType,  setLessonType] = useState('other');
  const [attendance,  setAttendance] = useState({});
  const [saving,      setSaving]     = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const today = new Date();

  const handleDateClick = (d, isToday) => {
    const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const tDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (isToday) {
      navigate(`/group/${id}/attendance/${d.toISOString().slice(0, 10)}`);
    } else if (dDate > tDate) {
      setSnackbar({ open: true, message: 'Hali dars boshlanish vaqti kelmagan!' });
    }
  };

  useEffect(() => {
    if (!token()) { navigate('/login'); return; }
    Promise.all([fetchGroup(), fetchSchedule(), fetchExistingAttendance()]);
  }, [id, date]);

  async function fetchExistingAttendance() {
    try {
      const res = await api.get(`/api/v1/attendances/by-date?group_id=${id}&date=${date}`);
      if (res.data) {
        setLessonTopic(res.data.topic || '');
        setLessonType(res.data.description === 'plan' ? 'plan' : 'other'); // description ni status sifatida ishlatsak bo'ladi yoki boshqa
        
        // Mavjud davomatlarni belgilash
        const existing = {};
        // Barcha studentlarni default "false" (yo'q) qilish
        (group?.studentGroups || []).forEach(sg => { existing[sg.students.id] = false; });
        // Kelganlarni "true" qilish
        (res.data.attendances || []).forEach(att => {
          existing[att.student_id] = true;
        });
        if (res.data.attendances?.length > 0) {
           setAttendance(existing);
        }
      }
    } catch (e) { console.error('Error fetching existing attendance:', e); }
  }

  async function fetchGroup() {
    setLoading(true);
    try {
      const res  = await api.get(`/api/v1/groups/${id}`);
      const data = res.data?.data || res.data;
      setGroup(data);
      const init = {};
      (data?.studentGroups || []).forEach(sg => { init[sg.students.id] = true; });
      setAttendance(init);
    } catch (e) {
      if (e.response?.status === 401) { localStorage.removeItem('token'); navigate('/login'); }
    } finally {
      setLoading(false);
    }
  }

  async function fetchSchedule() {
    try {
      const res = await api.get(`/api/v1/groups/${id}/schedule`);
      setSchedule(res.data || []);
    } catch (_) {}
  }

  /* month groups for calendar */
  const monthGroups = useMemo(() =>
    schedule.map(m => ({
      learning_month: m.learning_month,
      month: m.month_name,
      year:  m.year,
      dates: m.lessons.map(l => new Date(l.date))
    })), [schedule]);

  /* auto-select month containing the clicked date */
  useEffect(() => {
    if (monthGroups.length === 0 || calMonthIdx !== null) return;
    const d   = new Date(date);
    const idx = monthGroups.findIndex(m =>
      m.year === d.getFullYear() && m.dates?.[0]?.getMonth() === d.getMonth());
    setCalMonthIdx(idx !== -1 ? idx : 0);
  }, [monthGroups]);

  async function handleSave() {
    if (!lessonTopic.trim()) {
      alert("Iltimos, dars mavzusini kiriting!");
      return;
    }
    setSaving(true);
    try {
      // Yangi formatdagi payload
      const payload = {
        group_id: Number(id),
        date: date,
        topic: lessonTopic,
        description: lessonType, // plan yoki other
        records: Object.entries(attendance).map(([sid, present]) => ({
          student_id: Number(sid),
          isPresent: present
        }))
      };

      await api.post('/api/v1/attendances', payload);
      alert("Davomat muvaffaqiyatli saqlandi!");
      navigate(`/group/${id}`);
    } catch (e) { 
      console.error(e);
      alert("Xatolik yuz berdi: " + (e.response?.data?.message || e.message));
    }
    finally { setSaving(false); }
  }

  /* ── Loading / not found ── */
  if (loading) return (
    <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:400 }}>
      <CircularProgress sx={{ color:'#7b61ff' }} />
    </Box>
  );
  if (!group) return (
    <Box sx={{ textAlign:'center', py:8 }}>
      <Typography color="text.secondary">Guruh topilmadi</Typography>
      <Button onClick={() => navigate('/groups')} sx={{ mt:2 }}>← Guruhlar</Button>
    </Box>
  );

  const teachers     = group.teachers || [];
  const mainTeacher  = teachers.find(t => !t.is_assistant && t.role !== 'assistant') || teachers[0];
  const asst         = teachers.find(t =>  t.is_assistant || t.role === 'assistant');
  const tabTeachers  = [mainTeacher, asst].filter(Boolean);
  const activeT      = tabTeachers[teacherTab] || mainTeacher;

  // Foto URL ni to'g'irlash
  const resolvePhoto = (photo) => {
    if (!photo) return undefined;
    if (photo.startsWith('http') || photo.startsWith('/')) return photo;
    return `/file/${photo}`;
  };

  const startTime = group.start_time || '09:30';
  const [sh, sm]  = startTime.split(':').map(Number);
  const endTime   = `${String(sh + 2).padStart(2,'0')}:${String(sm).padStart(2,'0')}`;

  const selDate   = new Date(date);
  const calDates  = calMonthIdx !== null ? (monthGroups[calMonthIdx]?.dates || []) : [];
  const students  = group.studentGroups || [];

  return (
    <Box sx={{ animation:'fadeIn 0.4s ease-out' }}>

      {/* ══════════════════════════════════
          1. KALENDAR STRIP (GroupInner'dagi kabi)
      ══════════════════════════════════ */}
      {monthGroups.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {/* oy sarlavhasi + navigatsiya */}
          <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1.5 }}>
            <IconButton size="small"
              onClick={() => setCalMonthIdx(i => Math.max(0, i - 1))}
              disabled={calMonthIdx === 0}
              sx={{ color:'#9ca3af', '&:not(:disabled):hover':{ color:'#7b61ff' } }}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography sx={{ fontWeight:700, fontSize:'0.88rem', color:'#374151', minWidth:120 }}>
              {calMonthIdx !== null && monthGroups[calMonthIdx]
                ? `${monthGroups[calMonthIdx].learning_month}-o'quv oyi`
                : '—'}
            </Typography>
            <IconButton size="small"
              onClick={() => setCalMonthIdx(i => Math.min(monthGroups.length - 1, i + 1))}
              disabled={calMonthIdx === monthGroups.length - 1}
              sx={{ color:'#9ca3af', '&:not(:disabled):hover':{ color:'#7b61ff' } }}>
              <ChevronRightIcon />
            </IconButton>
          </Box>

          {/* sanalar */}
          <Box sx={{ overflowX:'auto', pb:0.5 }}>
            <Box sx={{ display:'flex', gap:1, minWidth:'max-content' }}>
              {calDates.map((d, i) => {
                const isToday    = d.toDateString() === today.toDateString();
                const isSelected = d.toISOString().slice(0,10) === date;
                const isPast     = d < today && !isToday;
                return (
                  <Box key={i}
                    onClick={() => handleDateClick(d, isToday)}
                    sx={{
                      minWidth:44, height:54, borderRadius:'10px',
                      display:'flex', flexDirection:'column',
                      alignItems:'center', justifyContent:'center',
                      border: isSelected
                        ? '2px solid #10b981'
                        : isToday
                          ? '2px solid #7b61ff'
                          : '1.5px solid #e5e7eb',
                      backgroundColor: isSelected
                        ? '#d1fae5'
                        : isToday
                          ? '#f0eeff'
                          : isPast ? '#f3f4f6' : '#fff',
                      cursor: (isToday || (new Date(d.getFullYear(), d.getMonth(), d.getDate()) > new Date(today.getFullYear(), today.getMonth(), today.getDate()))) ? 'pointer' : 'not-allowed',
                      gap:0.2,
                      transition:'all 0.15s',
                      opacity: isPast ? 0.5 : 1,
                      '&:hover': isToday ? { borderColor:'#7b61ff', backgroundColor:'#f0eeff' } : (new Date(d.getFullYear(), d.getMonth(), d.getDate()) > new Date(today.getFullYear(), today.getMonth(), today.getDate())) ? { borderColor: '#f97316' } : {}
                    }}>
                    <Typography sx={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', lineHeight:1,
                      color: isSelected ? '#10b981' : isToday ? '#7b61ff' : '#9ca3af' }}>
                      {SHORT_MON[d.getMonth()]}
                    </Typography>
                    <Typography sx={{ fontSize:'0.95rem', fontWeight: isToday||isSelected ? 800 : 700, lineHeight:1,
                      color: isSelected ? '#10b981' : isToday ? '#7b61ff' : isPast ? '#9ca3af' : '#374151' }}>
                      {d.getDate()}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}

      {/* ══════════════════════════════════
          2. TEACHER / ASSISTANT TABS
      ══════════════════════════════════ */}
      <Box sx={{ borderBottom:'2px solid #f3f4f6', mb:2 }}>
        <Tabs value={teacherTab} onChange={(_, v) => setTeacherTab(v)}
          sx={{
            '& .MuiTabs-indicator': { backgroundColor:'#10b981', height:2 },
            '& .MuiTab-root': { textTransform:'none', fontWeight:600, fontSize:'0.88rem',
              color:'#9ca3af', minWidth:0, mr:3, px:0 },
            '& .Mui-selected': { color:'#10b981 !important' }
          }}>
          {mainTeacher && <Tab label="Teacher" />}
          {asst        && <Tab label="Assistant" />}
        </Tabs>
      </Box>

      {/* ══════════════════════════════════
          3. MA'LUMOT KARTOCHKASI
      ══════════════════════════════════ */}
      {activeT && (
        <Box sx={{
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          backgroundColor: '#f8fafc',
          overflow: 'hidden',
          mb: 3,
          maxWidth: 450,
        }}>
          {/* yuqori qism: sarlavha + avatar */}
          <Box sx={{ p: 3, pb: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#111827', mb: 2 }}>
              Ma'lumot
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={resolvePhoto(activeT.photo)}
                sx={{ width: 56, height: 56, backgroundColor: '#e9eaec', color: '#6b7280', fontWeight: 700 }}
              >
                {initials(activeT.full_name)}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#111827', lineHeight: 1.3 }}>
                  {activeT.full_name}
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: '#6b7280', mt: 0.3 }}>
                  {teacherTab === 0 ? 'Teacher' : 'Assistant'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* pastki qism: 4 ustun */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            backgroundColor: '#fff',
            mx: 2,
            mb: 2.5,
            px: 2.5,
            py: 2,
            gap: 1,
          }}>
            {[
              { label: 'Dars kuni',  value: fmtDateUz(date) },
              { label: 'Dars vaqti', value: `${startTime} - ${endTime}` },
              { label: 'Xona',       value: group.rooms?.name || group.room?.name || '—' },
            ].map((item, i) => (
              <Box key={i}>
                <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', mb: 0.5, fontWeight: 400, whiteSpace: 'nowrap' }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* ══════════════════════════════════
          4. GURUH NOMI + SANA
      ══════════════════════════════════ */}
      <Typography sx={{ fontWeight:800, fontSize:'1rem', color:'#111827', mb:3 }}>
        {group.name}{' '}
        <Box component="span" sx={{ color:'#6b7280', fontWeight:500 }}>
          {selDate.getDate()}.{String(selDate.getMonth()+1).padStart(2,'0')}.{selDate.getFullYear()}
        </Box>
      </Typography>

      {/* ══════════════════════════════════
          5. YO'QLAMA MAVZU KIRITISH
      ══════════════════════════════════ */}
      <Paper elevation={0} sx={{ p:3, borderRadius:'20px', mb:4,
        backgroundColor:'#f8fafc', border:'1px solid #e5e7eb' }}>
        <Typography sx={{ fontWeight:800, fontSize:'1.05rem', color:'#111827', mb:2 }}>
          Yo'qlama va mavzu kiritish
        </Typography>
        <FormControl component="fieldset" sx={{ mb:2.5 }}>
          <RadioGroup row value={lessonType} onChange={e => setLessonType(e.target.value)}>
            <FormControlLabel value="plan"
              control={<Radio size="small" sx={{ color:'#d1d5db', '&.Mui-checked':{ color:'#10b981' } }} />}
              label={<Typography sx={{ fontSize:'0.84rem', color:'#9ca3af' }}>O'quv reja bo'yicha</Typography>}
            />
            <FormControlLabel value="other"
              control={<Radio size="small" sx={{ color:'#d1d5db', '&.Mui-checked':{ color:'#10b981' } }} />}
              label={<Typography sx={{ fontSize:'0.84rem', color:'#10b981', fontWeight:800 }}>Boshqa</Typography>}
            />
          </RadioGroup>
        </FormControl>
        <Box sx={{ maxWidth:560 }}>
          <Typography sx={{ fontWeight:700, fontSize:'0.82rem', color:'#374151', mb:1 }}>
            <Box component="span" sx={{ color:'#ef4444', mr:0.4 }}>*</Box>Mavzu
          </Typography>
          <TextField fullWidth placeholder="Dars mavzusini kiriting..."
            value={lessonTopic} onChange={e => setLessonTopic(e.target.value)}
            size="small"
            sx={{ '& .MuiOutlinedInput-root':{ borderRadius:'12px', backgroundColor:'#fff',
              '&:hover fieldset':{ borderColor:'#7b61ff' },
              '&.Mui-focused fieldset':{ borderColor:'#10b981' } } }}
          />
        </Box>
      </Paper>

      {/* ══════════════════════════════════
          6. STUDENTLAR JADVALI
      ══════════════════════════════════ */}
      <Box sx={{ backgroundColor:'#fff', borderRadius:'16px',
        border:'1px solid #e5e7eb', overflow:'hidden' }}>
        {/* header */}
        <Box sx={{ px:3, py:1.8, display:'flex', alignItems:'center',
          backgroundColor:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
          <Typography sx={{ fontWeight:700, fontSize:'0.73rem', color:'#6b7280', width:44 }}>#</Typography>
          <Typography sx={{ fontWeight:700, fontSize:'0.73rem', color:'#6b7280', flex:1 }}>O'quvchi ismi</Typography>
          <Typography sx={{ fontWeight:700, fontSize:'0.73rem', color:'#6b7280', width:120, textAlign:'center' }}>Vaqti</Typography>
          <Typography sx={{ fontWeight:700, fontSize:'0.73rem', color:'#6b7280', width:72, textAlign:'right' }}>Keldi</Typography>
        </Box>

        {/* rows */}
        {students.length === 0
          ? <Box sx={{ py:6, textAlign:'center' }}><Typography color="text.secondary">O'quvchilar yo'q</Typography></Box>
          : students.map((sg, idx) => (
          <Box key={sg.students.id} sx={{
            px:3, py:1.8, display:'flex', alignItems:'center',
            borderBottom: idx < students.length - 1 ? '1px solid #f3f4f6' : 'none',
            '&:hover':{ backgroundColor:'#fafafa' }, transition:'background 0.12s'
          }}>
            <Typography sx={{ fontSize:'0.87rem', color:'#9ca3af', width:44 }}>{idx+1}</Typography>
            <Typography sx={{ flex:1, fontSize:'0.93rem', fontWeight:600, color:'#111827' }}>
              {sg.students.full_name}
            </Typography>
            <Typography sx={{ width:120, textAlign:'center', fontSize:'0.87rem', color:'#6b7280' }}>
              {startTime}
            </Typography>
            <Box sx={{ width:72, textAlign:'right' }}>
              <Switch size="small"
                checked={attendance[sg.students.id] !== false}
                onChange={e => setAttendance(prev => ({ ...prev, [sg.students.id]: e.target.checked }))}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked':{ color:'#10b981' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':{ backgroundColor:'#10b981' }
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>

      {/* ── Saqlash ── */}
      <Box sx={{ mt:4, display:'flex', justifyContent:'flex-end', gap:2 }}>
        <Button variant="outlined" onClick={() => navigate(`/group/${id}`)}
          sx={{ borderRadius:'12px', px:4, textTransform:'none', fontWeight:600,
            borderColor:'#e5e7eb', color:'#374151' }}>
          Bekor qilish
        </Button>
        <Button variant="contained" disabled={!lessonTopic.trim() || saving} onClick={handleSave}
          sx={{ borderRadius:'12px', px:8, py:1.2, textTransform:'none', fontWeight:800,
            backgroundColor:'#10b981', '&:hover':{ backgroundColor:'#059669' }, boxShadow:'none' }}>
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </Button>
      </Box>
      {/* Notification */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity="warning" variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
