import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, MenuItem, Select, FormControl
} from '@mui/material';
import api from '../api/axios';

// Uy vazifasi holati config
const HW_STATUS = {
  qabul_qilingan: { label: 'Qabul qilingan', bg: '#4caf50', color: '#fff' },
  kutayotgan: { label: 'Kutayotganlar', bg: '#5c6bc0', color: '#fff' },
  bajarilmagan: { label: 'Bajarilmagan', bg: '#ff3b30', color: '#fff' },
  NONE: { label: 'Berilmagan', bg: '#78909c', color: '#fff' },
};

const STATUS_OPTIONS = [
  { value: 'ALL',      label: 'Barchasi' },
  { value: 'qabul_qilingan', label: 'Qabul qilingan' },
  { value: 'kutayotgan',  label: 'Kutayotganlar' },
  { value: 'bajarilmagan', label: 'Bajarilmagan' },
  { value: 'NONE', label: 'Berilmagan' },
];

const MOCK_LESSONS = [
  {
    id: 1,
    topic: "crm talaba paneli frontend uy vazifasi, darslar, videolar",
    date: "2026-yil 9-iyun",
    state: "bajarilmagan",
    videosCount: 0,
    deadline: "2026-yil 10-iyun, soat 03:52"
  },
  {
    id: 2,
    topic: "amaliyot",
    date: "2026-yil 8-iyun",
    state: "NONE",
    videosCount: 0,
    deadline: "-"
  },
  {
    id: 3,
    topic: "crm talabalar paneli, uy vazifasi, darslar, videolar",
    date: "2026-yil 8-iyun",
    state: "kutayotgan",
    videosCount: 2,
    deadline: "2026-yil 9-iyun, soat 5:35"
  },
  {
    id: 4,
    topic: "CRM talabalar paneli",
    date: "2026-yil 5-iyun",
    state: "kutayotgan",
    videosCount: 2,
    deadline: "2026-yil 6-iyun, soat 4:12"
  },
  {
    id: 5,
    topic: "Amaliyot",
    date: "2026-yil 5-iyun",
    state: "NONE",
    videosCount: 0,
    deadline: "-"
  },
  {
    id: 6,
    topic: "Next.js amaliyot | marshrutizatsiya",
    date: "2026-yil 4-iyun",
    state: "NONE",
    videosCount: 0,
    deadline: "-"
  },
  {
    id: 7,
    topic: "CRM Davom eting O'qituvchilar paneli",
    date: "2026-yil 4-iyun",
    state: "kutayotgan",
    videosCount: 2,
    deadline: "2026-yil 5-iyun, soat 3:59"
  },
  {
    id: 8,
    topic: "Next.js + Prisma",
    date: "2026-yil 3-iyun",
    state: "bajarilmagan",
    videosCount: 2,
    deadline: "2026-yil 4-iyun, soat 4:26"
  }
];

function HwBadge({ statusKey }) {
  const cfg = HW_STATUS[statusKey] || HW_STATUS.NONE;
  return (
    <Box sx={{
      display: 'inline-flex',
      alignItems: 'center',
      px: 2, py: 0.5,
      borderRadius: '20px', // Rounded pill shape matching Screenshot 1
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
    <Box sx={{ animation: 'fadeIn 0.3s ease-out', pt: 1.5, px: 1 }}>
      {/* Title "Uy vazifasi statusi" */}
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', mb: 0.8 }}>
        Uy vazifasi statusi
      </Typography>

      {/* Filter bar */}
      <Box sx={{ mb: 3.5 }}>
        <FormControl size="small">
          <Select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            sx={{
              minWidth: 160,
              backgroundColor: '#fff',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#1f2937',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#c5a059' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#c5a059' },
            }}
          >
            {STATUS_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {opt.label}
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
            <TableHead sx={{ backgroundColor: '#ffffff' }}>
              <TableRow sx={{ '& th': { borderBottom: '1.5px solid #f3f4f6' } }}>
                <TableCell sx={{ fontWeight: 600, color: '#4b5563', fontSize: '0.83rem', py: 2.2, px: 3 }}>Mavzular</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4b5563', fontSize: '0.83rem', py: 2.2, px: 3 }}>Video</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4b5563', fontSize: '0.83rem', py: 2.2, px: 3 }}>Uyga vazifa Holati</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4b5563', fontSize: '0.83rem', py: 2.2, px: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Uyga vazifa tugash vaqti
                    <Box component="span" sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827', ml: 0.5 }}>↓</Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4b5563', fontSize: '0.83rem', py: 2.2, px: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Dars sanasi
                    <Box component="span" sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#4caf50', ml: 0.5 }}>↑</Box>
                  </Box>
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
                    <TableCell sx={{ py: 2, px: 3 }}>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 500, color: '#111827' }}>
                        {lesson.topic || `Dars #${idx + 1}`}
                      </Typography>
                    </TableCell>

                    {/* Video count circle blue badge */}
                    <TableCell sx={{ py: 2, px: 3 }}>
                      <Box sx={{
                        width: 24, height: 24, borderRadius: '50%',
                        border: '1.5px solid #2196f3',
                        color: '#2196f3', fontSize: '0.8rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {videoCount}
                      </Box>
                    </TableCell>

                    {/* Status Pill Badge */}
                    <TableCell sx={{ py: 2, px: 3 }}>
                      <HwBadge statusKey={lesson.state} />
                    </TableCell>

                    {/* Deadline */}
                    <TableCell sx={{ py: 2, px: 3, fontSize: '0.83rem', color: '#4b5563', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {lesson.deadline}
                    </TableCell>

                    {/* Date */}
                    <TableCell sx={{ py: 2, px: 3, fontSize: '0.83rem', color: '#4b5563', fontWeight: 500, whiteSpace: 'nowrap' }}>
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
