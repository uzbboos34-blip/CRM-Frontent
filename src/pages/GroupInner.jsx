import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Button, IconButton, Paper, Chip, Avatar,
  Tab, Tabs, Divider, CircularProgress, Collapse
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckIcon from '@mui/icons-material/Check';

const token = () => localStorage.getItem('token');

const avatarColors = ['#7b61ff', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];
const avatarColor = (i) => avatarColors[i % avatarColors.length];

const initials = (name = '') => {
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (p[0]?.[0] || '?').toUpperCase();
};

const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
  return `${dt.getDate()} ${months[dt.getMonth()]}, ${dt.getFullYear()}`;
};

const DAY_SHORT = {
  Monday: 'Du', Tuesday: 'Se', Wednesday: 'Ch',
  Thursday: 'Pa', Friday: 'Ju', Saturday: 'Sh', Sunday: 'Ya'
};

// Generate all lesson dates for a group based on week_days, start_date, end_date
function getLessonDates(weekDays = [], startDate, endDate) {
  if (!startDate || !endDate || weekDays.length === 0) return [];
  const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0 };
  const dayNums = weekDays.map(d => dayMap[d]);
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const cur = new Date(start);
  while (cur <= end) {
    if (dayNums.includes(cur.getDay())) {
      dates.push(new Date(cur));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// Get current learning month index (0-based from start_date)
function getCurrentMonthIndex(startDate) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now - start;
  if (diffMs < 0) return 0;
  const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  return months;
}

// Group dates by month
function groupDatesByMonth(dates) {
  const months = {};
  dates.forEach(d => {
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!months[key]) months[key] = { year: d.getFullYear(), month: d.getMonth(), dates: [] };
    months[key].dates.push(d);
  });
  return Object.values(months);
}

const MONTH_NAMES_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
];
const DAY_NAMES_SHORT = ['Apr', 'Apr', 'Apr', 'May', 'May', 'May', 'May', 'May', 'May', 'May', 'May', 'May'];

export default function GroupInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [academicsOpen, setAcademicsOpen] = useState(false);
  const [mentorsOpen, setMentorsOpen] = useState(true);
  const [paramsOpen, setParamsOpen] = useState(true);
  const [showAllSchedule, setShowAllSchedule] = useState(false);
  const [showAllDates, setShowAllDates] = useState(false);

  // Calendar state
  const [calendarMonthIdx, setCalendarMonthIdx] = useState(null); // index into monthGroups

  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    if (!token()) { navigate('/login'); return; }
    fetchGroup();
    fetchSchedule();
  }, [id]);

  async function fetchGroup() {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/groups/${id}`);
      const data = res.data?.data || res.data;
      setGroup(data);
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
    } catch (e) {
      console.error('Error fetching schedule:', e);
    }
  }

  // Map backend schedule to frontend monthGroups
  const monthGroups = useMemo(() => {
    return schedule.map(m => ({
      month: m.month_name,
      year: m.year,
      learning_month: m.learning_month,
      dates: m.lessons.map(l => new Date(l.date))
    }));
  }, [schedule]);

  // Show dars jadvali if schedule exists
  const showDarsJadvali = monthGroups.length > 0;

  // Set default calendar month
  // Set default calendar month to current study month
  useEffect(() => {
    if (monthGroups.length > 0 && calendarMonthIdx === null) {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const idx = monthGroups.findIndex(m => {
        // Check if today falls within this month and year
        const mDate = new Date(m.year, m.dates?.[0]?.getMonth() || 0);
        return m.year === currentYear && (m.dates?.[0]?.getMonth() === currentMonth);
      });

      setCalendarMonthIdx(idx !== -1 ? idx : 0);
    }
  }, [monthGroups, calendarMonthIdx]);

  // Teachers list
  const teachers = group?.teachers || [];
  const assistants = teachers.filter(t => t.role === 'assistant' || t.is_assistant);
  const mainTeachers = teachers.filter(t => !t.is_assistant && t.role !== 'assistant');

  // Schedule rows = teachers with schedule info
  const scheduleRows = teachers;
  const visibleSchedule = showAllSchedule ? scheduleRows : scheduleRows.slice(0, 2);

  // Current month dates for calendar strip
  const currentMonthGroup = calendarMonthIdx !== null ? monthGroups[calendarMonthIdx] : null;
  const calendarDates = currentMonthGroup?.dates || [];

  const today = new Date();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: '#7b61ff' }} />
      </Box>
    );
  }

  if (!group) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">Guruh topilmadi</Typography>
        <Button onClick={() => navigate('/groups')} sx={{ mt: 2 }}>← Guruhlar</Button>
      </Box>
    );
  }

  const resolvePhoto = (photo) => {
    if (!photo) return undefined;
    if (photo.startsWith('http') || photo.startsWith('/')) return photo;
    return `/file/${photo}`;
  };

  const params = [
    { label: 'Kurs:', value: group.course?.name || '—' },
    { label: "O'rta yosh:", value: group.averageAge ? Math.round(group.averageAge) : '—' },
    { label: "O'quvchilar sig'imi:", value: group.room_capacity || '—' },
    { label: "Mavjud o'quvchilar:", value: group.students_count ?? '—' },
    { label: 'Kurs davomiyligi (oy):', value: group.course?.duration_month || '—' },
    { label: 'Darslar soni (oylik):', value: group.month_lessons || '—' },
    { label: 'Jami darslar soni:', value: group.total_lessons || '—' },
  ];

  return (
    <Box sx={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={() => navigate('/groups')} size="small"
            sx={{ color: '#6b7280', '&:hover': { color: '#7b61ff', backgroundColor: '#f0eeff' } }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
            {group.course?.name || 'Guruh ma\'lumotlari'}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<BarChartIcon />}
          sx={{
            borderRadius: '10px', textTransform: 'none', fontWeight: 700,
            borderColor: '#e5e7eb', color: '#374151', '&:hover': { borderColor: '#7b61ff', color: '#7b61ff' }
          }}>
          Statistika
        </Button>
      </Box>

      {/* ── Tabs ── */}
      <Box sx={{ borderBottom: '2px solid #f3f4f6', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
          sx={{
            '& .MuiTabs-indicator': { backgroundColor: '#7b61ff', height: 2 },
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem', color: '#9ca3af', minWidth: 0, mr: 3, px: 0 },
            '& .Mui-selected': { color: '#7b61ff !important' }
          }}>
          <Tab label="Ma'lumotlar" />
          <Tab label="Guruh darsliklari" />
          <Tab label="Akademik davomati" />
        </Tabs>
      </Box>

      {/* ── Tab 0: Ma'lumotlar ── */}
      {activeTab === 0 && (
        <Box>
          {/* Top cards row: Mentorlar (left) and Parametrlar (right) */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3, alignItems: 'start' }}>

            {/* Left Column: Mentorlar + Akademiklar */}
            <Box>
              {/* Guruh mentorlari */}
              <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', mb: 2 }}>
                <Box
                  onClick={() => setMentorsOpen(!mentorsOpen)}
                  sx={{
                    backgroundColor: mentorsOpen ? '#3b82f6' : '#f9fafb',
                    color: mentorsOpen ? '#fff' : '#111827',
                    px: 2, py: 1.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Guruh mentorlari</Typography>
                  <IconButton size="small" sx={{ color: 'inherit' }}>
                    {mentorsOpen ? <CloseIcon sx={{ fontSize: 18 }} /> : <AddIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Box>

                <Collapse in={mentorsOpen}>
                  <Box sx={{ p: 3, display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {teachers.length === 0 ? (
                      <Typography sx={{ color: '#9ca3af', fontSize: '0.85rem' }}>O'qituvchilar yo'q</Typography>
                    ) : teachers.map((t, i) => (
                      <Box key={t.id} sx={{ textAlign: 'center', minWidth: 80 }}>
                        <Box sx={{ position: 'relative', display: 'inline-block', mb: 1 }}>
                          <Avatar 
                            src={resolvePhoto(t.photo)}
                            sx={{
                              width: 64, height: 64, fontSize: '1.2rem', fontWeight: 700,
                              backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', color: '#10b981'
                            }}
                          >
                            {!t.photo && t.full_name ? t.full_name[0] : ''}
                          </Avatar>
                        </Box>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981', mb: 0.2, textTransform: 'capitalize' }}>
                          {i === 0 ? 'Teacher' : 'Assistant'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                          {t.full_name.split(' ').map((n, idx) => <Box component="span" sx={{ display: 'block' }} key={idx}>{n}</Box>)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </Paper>

              {/* Akademiklar accordion bar */}
              <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <Box
                  onClick={() => setAcademicsOpen(!academicsOpen)}
                  sx={{
                    backgroundColor: academicsOpen ? '#3b82f6' : '#f9fafb',
                    color: academicsOpen ? '#fff' : '#111827',
                    px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                    '&:hover': { backgroundColor: academicsOpen ? '#2563eb' : '#eef2f6' }
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'inherit' }}>
                    Akademiklar va ularning o'qitgan soatlari
                  </Typography>
                  {academicsOpen ? <CloseIcon sx={{ fontSize: 20, color: 'inherit' }} /> : <AddIcon sx={{ fontSize: 20, color: 'inherit' }} />}
                </Box>
                <Collapse in={academicsOpen}>
                  <Box sx={{ p: 2, pt: 0, backgroundColor: '#fff' }}>
                    {teachers.length === 0 ? (
                      <Typography sx={{ color: '#9ca3af', fontSize: '0.82rem' }}>Ma'lumot yo'q</Typography>
                    ) : teachers.map((t) => (
                      <Box key={t.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f3f4f6' }}>
                        <Typography sx={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600 }}>{t.full_name}</Typography>
                        <Typography sx={{ fontSize: '0.82rem', color: '#9ca3af' }}>— soat</Typography>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </Paper>
            </Box>

            {/* Right Column: Parametrlar */}
            <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
              <Box
                onClick={() => setParamsOpen(!paramsOpen)}
                sx={{
                  backgroundColor: paramsOpen ? '#3b82f6' : '#f9fafb',
                  color: paramsOpen ? '#fff' : '#111827',
                  px: 2, py: 1.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Parametrlar</Typography>
                <IconButton size="small" sx={{ color: 'inherit' }}>
                  {paramsOpen ? <CloseIcon sx={{ fontSize: 18 }} /> : <AddIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </Box>
              <Collapse in={paramsOpen}>
                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {params.map((p, i) => (
                    <Box key={i} sx={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      py: 1.1, borderBottom: i < params.length - 1 ? '1px solid #f9fafb' : 'none'
                    }}>
                      <Typography sx={{ fontSize: '0.82rem', color: '#6b7280' }}>{p.label}</Typography>
                      <Typography sx={{
                        fontSize: '0.82rem', fontWeight: 600,
                        color: p.isLink ? '#3b82f6' : '#374151',
                        cursor: p.isLink ? 'pointer' : 'default',
                        '&:hover': p.isLink ? { textDecoration: 'underline' } : {}
                      }}>
                        {p.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Paper>
          </Box>
          {/* ── Dars jadvali ── */}
          {showDarsJadvali && (
            <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', p: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827', mb: 2.5 }}>
                Dars jadvali
              </Typography>

              {/* Schedule rows */}
              <Box>
                {scheduleRows.length === 0 ? (
                  <Typography sx={{ color: '#9ca3af', fontSize: '0.85rem', py: 2 }}>Jadval ma'lumotlari yo'q</Typography>
                ) : (
                  <>
                    {visibleSchedule.map((t, i) => {
                      const days = (group.week_day || []).map(d => DAY_SHORT[d] || d).join('/');
                      const startTime = group.start_time || '09:30';
                      // Calculate end time (2 hours later by default)
                      const [sh, sm] = startTime.split(':').map(Number);
                      const endH = String(sh + 2).padStart(2, '0');
                      const endM = String(sm).padStart(2, '0');
                      const endTime = `${endH}:${endM}`;

                      const rowBg = '#f9fafb';
                      return (
                        <Box key={t.id} sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: 3, px: 3, py: 2,
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          backgroundColor: rowBg,
                          mb: 1.5,
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'translateY(-2px)', borderColor: '#7b61ff' }
                        }}>
                          <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#7b61ff', width: '15%' }}>
                            {t.full_name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.82rem', color: '#6b7280', width: '15%', textAlign: 'center' }}>
                            {days}
                          </Typography>
                          <Typography sx={{ fontSize: '0.82rem', color: '#374151', width: '25%', textAlign: 'center' }}>
                            {startTime} dan — {endTime} gacha
                          </Typography>
                          <Typography sx={{ fontSize: '0.82rem', color: '#374151', width: '30%', textAlign: 'center' }}>
                            {fmtDate(group.start_date)} — {fmtDate(group.end_date)}
                          </Typography>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', width: '15%', textAlign: 'right' }}>
                            {group.rooms?.name || group.room?.name || '—'}
                          </Typography>
                        </Box>
                      );
                    })}

                    {/* Show more button */}
                    {scheduleRows.length > 2 && (
                      <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setShowAllSchedule(s => !s)}
                          sx={{
                            borderRadius: '20px', textTransform: 'none', fontWeight: 600,
                            borderColor: '#e5e7eb', color: '#374151', px: 3,
                            '&:hover': { borderColor: '#7b61ff', color: '#7b61ff' }
                          }}
                        >
                          {showAllSchedule ? "Kamroq ko'rsatish" : `Yana ko'rsatish (${scheduleRows.length - 2})`}
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </Box>

              {/* ── Calendar strip ── */}
              <Box sx={{ mt: 3 }}>
                {/* Month navigator — faqat showAllDates=false bo'lganda */}
                {!showAllDates && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <IconButton
                      size="small"
                      onClick={() => setCalendarMonthIdx(i => Math.max(0, i - 1))}
                      disabled={calendarMonthIdx === 0}
                      sx={{ color: '#9ca3af', '&:not(:disabled):hover': { color: '#7b61ff' } }}
                    >
                      <ChevronLeftIcon />
                    </IconButton>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151', minWidth: 100, textAlign: 'center' }}>
                      {calendarMonthIdx !== null && monthGroups[calendarMonthIdx]
                        ? `${monthGroups[calendarMonthIdx].learning_month}-o'quv oyi`
                        : '—'}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setCalendarMonthIdx(i => Math.min(monthGroups.length - 1, i + 1))}
                      disabled={calendarMonthIdx === monthGroups.length - 1}
                      sx={{ color: '#9ca3af', '&:not(:disabled):hover': { color: '#7b61ff' } }}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </Box>
                )}

                {/* showAllDates: barcha oylar ketma-ket */}
                {showAllDates ? (
                  <Box>
                    {monthGroups.map((mg, mIdx) => {
                      const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const MONTH_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
                      return (
                        <Box key={mIdx} sx={{ mb: 2 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', mb: 1 }}>
                            {mg.learning_month}-o'quv oyi — {mg.month} {mg.year}
                          </Typography>
                          <Box sx={{ overflowX: 'auto', pb: 0.5 }}>
                            <Box sx={{ display: 'flex', gap: 1, minWidth: 'max-content' }}>
                              {mg.dates.map((d, dIdx) => {
                                const isToday = d.toDateString() === today.toDateString();
                                const isPast = d < today;
                                return (
                                  <Box key={dIdx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44 }}>
                                    <Box
                                      onClick={() => navigate(`/group/${id}/attendance/${d.toISOString().slice(0,10)}`)}
                                      sx={{
                                        width: 44, height: 54, borderRadius: '10px', display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        border: isToday ? '2px solid #7b61ff' : '1.5px solid #e5e7eb',
                                        backgroundColor: isToday ? '#f0eeff' : isPast ? '#f3f4f6' : '#fff',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        gap: 0.2,
                                        '&:hover': { borderColor: '#7b61ff', backgroundColor: '#f0eeff' },
                                        transition: 'all 0.15s'
                                      }}>
                                      {isPast && !isToday && (
                                        <Box sx={{
                                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                          backgroundColor: 'rgba(0,0,0,0.07)', borderRadius: '10px',
                                          pointerEvents: 'none'
                                        }} />
                                      )}
                                      <Typography sx={{ fontSize: '0.62rem', color: isToday ? '#7b61ff' : '#9ca3af', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>
                                        {shortMonths[d.getMonth()]}
                                      </Typography>
                                      <Typography sx={{
                                        fontSize: '0.95rem',
                                        fontWeight: isToday ? 800 : 700,
                                        color: isToday ? '#7b61ff' : isPast ? '#9ca3af' : '#374151',
                                        lineHeight: 1
                                      }}>
                                        {d.getDate()}
                                      </Typography>
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                      <Button variant="outlined" size="small" onClick={() => setShowAllDates(false)}
                        sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600, borderColor: '#e5e7eb', color: '#374151', px: 4, '&:hover': { borderColor: '#7b61ff', color: '#7b61ff' } }}>
                        Yig'ish
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    {/* Single month date strip */}
                    <Box sx={{ overflowX: 'auto', pb: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, minWidth: 'max-content' }}>
                        {calendarDates.map((d, idx) => {
                          const isToday = d.toDateString() === today.toDateString();
                          const isPast = d < today;
                          const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return (
                            <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48 }}>
                              <Box
                                onClick={() => navigate(`/group/${id}/attendance/${d.toISOString().slice(0,10)}`)}
                                sx={{
                                  width: 44, height: 54, borderRadius: '10px', display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center', justifyContent: 'center',
                                  border: isToday ? '2px solid #7b61ff' : '1.5px solid #e5e7eb',
                                  backgroundColor: isToday ? '#f0eeff' : isPast ? '#f3f4f6' : '#fff',
                                  position: 'relative',
                                  cursor: 'pointer',
                                  gap: 0.2,
                                  '&:hover': { borderColor: '#7b61ff', backgroundColor: '#f0eeff' },
                                  transition: 'all 0.15s'
                                }}>
                                {isPast && !isToday && (
                                  <Box sx={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: 'rgba(0,0,0,0.07)', borderRadius: '10px',
                                    pointerEvents: 'none'
                                  }} />
                                )}
                                <Typography sx={{ fontSize: '0.62rem', color: isToday ? '#7b61ff' : '#9ca3af', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>
                                  {shortMonths[d.getMonth()]}
                                </Typography>
                                <Typography sx={{
                                  fontSize: '0.95rem',
                                  fontWeight: isToday ? 800 : 700,
                                  color: isToday ? '#7b61ff' : isPast ? '#9ca3af' : '#374151',
                                  lineHeight: 1
                                }}>
                                  {d.getDate()}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                    {/* Barchasini ko'rish */}
                    <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                      <Button variant="outlined" size="small"
                        onClick={() => setShowAllDates(true)}
                        sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600, borderColor: '#e5e7eb', color: '#374151', px: 4, '&:hover': { borderColor: '#7b61ff', color: '#7b61ff' } }}>
                        Barchasini ko'rish
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {/* ── Tab 1: Guruh darsliklari ── */}
      {activeTab === 1 && (
        <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', p: 6, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
            Guruh darsliklari ma'lumotlari hozircha mavjud emas
          </Typography>
        </Paper>
      )}

      {/* ── Tab 2: Akademik davomati ── */}
      {activeTab === 2 && (
        <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', p: 6, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
            Akademik davomati ma'lumotlari hozircha mavjud emas
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
