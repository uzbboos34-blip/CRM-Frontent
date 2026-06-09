import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, MenuItem, Select, FormControl, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../api/axios';

// Uy vazifasi holati config
const HW_STATUS = {
  qabul_qilingan: { label: 'Qabul qilingan', bg: '#16a34a', color: '#fff' },
  kutayotgan: { label: 'Kutayotgan', bg: '#6366f1', color: '#fff' },
  bajarilmagan: { label: 'Bajarilmagan', bg: '#ef4444', color: '#fff' },
  NONE: { label: 'Berilmagan', bg: '#6b7280', color: '#fff' },
};

const STATUS_OPTIONS = [
  { value: 'ALL',      label: 'Barchasi' },
  { value: 'qabul_qilingan', label: 'Qabul qilingan' },
  { value: 'kutayotgan',  label: 'Kutayotganlar' },
  { value: 'bajarilmagan', label: 'Bajarilmagan' },
];

const MOCK_LESSONS = [
  {
    id: 1,
    topic: "crm talaba paneli frontend uy vazifasi, darslar, videolar",
    date: "09 Jun, 2026",
    state: "bajarilmagan",
    videosCount: 0,
    deadline: "10-iyun, 2026 03:52"
  },
  {
    id: 2,
    topic: "amaliyot",
    date: "08 Jun, 2026",
    state: "bajarilmagan",
    videosCount: 0,
    deadline: "09-iyun, 2026 00:00"
  },
  {
    id: 3,
    topic: "crm talabalar paneli, uy vazifasi, darslar, videolar",
    date: "08 Jun, 2026",
    state: "kutayotgan",
    videosCount: 2,
    deadline: "09-iyun, 2026 05:35"
  },
  {
    id: 4,
    topic: "CRM talabalar paneli",
    date: "05 Jun, 2026",
    state: "bajarilmagan",
    videosCount: 0,
    deadline: "—"
  },
  {
    id: 5,
    topic: "Amaliyot",
    date: "05 Jun, 2026",
    state: "bajarilmagan",
    videosCount: 0,
    deadline: "—"
  },
  {
    id: 6,
    topic: "Next.js amaliyot | marshrutizatsiya",
    date: "04 Jun, 2026",
    state: "bajarilmagan",
    videosCount: 0,
    deadline: "—"
  },
  {
    id: 7,
    topic: "CRM Davom eting O'qituvchilar paneli",
    date: "04 Jun, 2026",
    state: "qabul_qilingan",
    videosCount: 1,
    deadline: "15-may, 2026 07:10"
  },
  {
    id: 8,
    topic: "Next.js + Prisma",
    date: "03 Jun, 2026",
    state: "bajarilmagan",
    videosCount: 0,
    deadline: "—"
  }
];

function HwBadge({ statusKey }) {
  const cfg = HW_STATUS[statusKey] || HW_STATUS.NONE;
  return (
    <Box sx={{
      display: 'inline-flex',
      alignItems: 'center',
      px: 1.5, py: 0.35,
      borderRadius: '6px',
      backgroundColor: cfg.bg,
    }}>
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>
        {cfg.label}
      </Typography>
    </Box>
  );
}

export default function StudentGroupLessons() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState(MOCK_LESSONS);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // API request is prepared for when backend is ready
    setLoading(true);
    api.get(`/api/v1/students/my/groups/${groupId}/lessons`)
      .then(res => {
        if (res.data?.data && res.data.data.length > 0) {
          setLessons(res.data.data);
        } else {
          setLessons(MOCK_LESSONS);
        }
      })
      .catch(err => {
        console.warn('API error, using mock lessons:', err);
        setLessons(MOCK_LESSONS);
      })
      .finally(() => setLoading(false));
  }, [groupId]);

  // Filter lessons
  const filtered = lessons.filter(lesson => {
    if (filter === 'ALL') return true;
    return lesson.state === filter;
  });

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out', p: { xs: 1, md: 3 } }}>
      {/* Sarlavha */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <IconButton
          size="small"
          onClick={() => navigate('/student/groups')}
          sx={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            '&:hover': { backgroundColor: '#f3f4f6' },
            borderRadius: '8px',
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 18, color: '#374151' }} />
        </IconButton>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
          Darslar
        </Typography>
      </Box>

      {/* Filter bar */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', mb: 0.8 }}>
          Uy vazifasi statusi
        </Typography>
        <FormControl size="small">
          <Select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            sx={{
              minWidth: 180,
              backgroundColor: '#fff',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 600,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#c5a059' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#c5a059' },
            }}
          >
            {STATUS_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {opt.value !== 'ALL' && (
                    <Box sx={{
                      width: 10, height: 10, borderRadius: '50%',
                      backgroundColor: HW_STATUS[opt.value]?.bg || '#6b7280',
                      flexShrink: 0,
                    }} />
                  )}
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>{opt.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Table grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#c5a059' }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <Typography sx={{ color: '#9ca3af', fontWeight: 600 }}>Darslar mavjud emas</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.5, px: 2.5 }}>Mavzular</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.5, px: 2.5 }}>Video</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.5, px: 2.5 }}>Uyga vazifa Holati</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.5, px: 2.5 }}>
                  Uyga vazifa tugash vaqti
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.5, px: 2.5 }}>
                  Dars sanasi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((lesson, idx) => {
                const videoCount = lesson.videosCount ?? 0;

                return (
                  <TableRow
                    key={lesson.id}
                    onClick={() => navigate(`/student/groups/${groupId}/lessons/${lesson.id}`)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#fdf8f0' },
                      '& td': { borderBottom: idx === filtered.length - 1 ? 'none' : '1px solid #f3f4f6' },
                      transition: 'background 0.12s',
                    }}
                  >
                    {/* Mavzu */}
                    <TableCell sx={{ py: 1.5, px: 2.5 }}>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                        {lesson.topic || `Dars #${idx + 1}`}
                      </Typography>
                    </TableCell>

                    {/* Video count badge */}
                    <TableCell sx={{ py: 1.5, px: 2.5 }}>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: '1.5px solid #c5a059',
                        color: '#c5a059', fontSize: '0.78rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {videoCount}
                      </Box>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell sx={{ py: 1.5, px: 2.5 }}>
                      <HwBadge statusKey={lesson.state} />
                    </TableCell>

                    {/* Deadline */}
                    <TableCell sx={{ py: 1.5, px: 2.5, fontSize: '0.83rem', color: '#4b5563', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {lesson.deadline}
                    </TableCell>

                    {/* Date */}
                    <TableCell sx={{ py: 1.5, px: 2.5, fontSize: '0.83rem', color: '#4b5563', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {lesson.date}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
