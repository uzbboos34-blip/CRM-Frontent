import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tab, Tabs, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../api/axios';

// Kun qisqartmalari mapping
const DAY_MAP = {
  // Uzbek short
  'Du': 'Du', 'Se': 'Se', 'Ch': 'Ch', 'Pa': 'Pa', 'Ju': 'Ju', 'Sha': 'Sha', 'Ya': 'Ya',
  // English full
  'MONDAY': 'Du', 'TUESDAY': 'Se', 'WEDNESDAY': 'Ch',
  'THURSDAY': 'Pa', 'FRIDAY': 'Ju', 'SATURDAY': 'Sha', 'SUNDAY': 'Ya',
  // English short
  'MON': 'Du', 'TUE': 'Se', 'WED': 'Ch', 'THU': 'Pa', 'FRI': 'Ju', 'SAT': 'Sha', 'SUN': 'Ya',
};

function formatDays(weekDay = []) {
  if (!weekDay || weekDay.length === 0) return '—';
  return weekDay.map(d => DAY_MAP[d] || d).join(', ');
}

function formatStatus(status) {
  const map = {
    active: 'Faol', planned: 'Rejalashtirilgan',
    freeze: 'Muzlatilgan', completed: 'Tugagan', cancelled: 'Bekor qilingan'
  };
  return map[status] || status || '—';
}

function getStatusColor(status) {
  if (status === 'active') return { bg: 'rgba(34,197,94,0.1)', color: '#16a34a' };
  if (status === 'planned') return { bg: 'rgba(59,130,246,0.1)', color: '#2563eb' };
  if (status === 'freeze') return { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' };
  return { bg: 'rgba(239,68,68,0.1)', color: '#dc2626' };
}

// Modal komponenti
function GroupDetailModal({ item, onClose }) {
  if (!item) return null;
  const group = item.groups || {};
  const teachers = (group.teachersGroups || []).map(tg => tg.teacher).filter(Boolean);
  const statusStyle = getStatusColor(group.status);

  return (
    <>
      {/* Overlay */}
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed', inset: 0, zIndex: 1399,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
        }}
      />
      {/* Modal */}
      <Box
        sx={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1400,
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          width: { xs: '92vw', sm: 560 },
          maxHeight: '80vh',
          overflowY: 'auto',
          p: 3,
          animation: 'modalIn 0.2s ease-out',
          '@keyframes modalIn': {
            from: { opacity: 0, transform: 'translate(-50%, -48%)' },
            to: { opacity: 1, transform: 'translate(-50%, -50%)' },
          }
        }}
      >
        {/* Yopish tugmasi */}
        <Box
          onClick={onClose}
          sx={{
            position: 'absolute', top: 14, right: 14,
            width: 28, height: 28, borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            '&:hover': { backgroundColor: '#e5e7eb' },
            transition: 'background 0.15s',
          }}
        >
          <CloseIcon sx={{ fontSize: 16, color: '#6b7280' }} />
        </Box>

        {/* Guruh nomi */}
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', mb: 0.5 }}>
          {group.name || '—'}
        </Typography>

        {/* Status badge */}
        <Box sx={{
          display: 'inline-flex', alignItems: 'center',
          px: 1.5, py: 0.4, borderRadius: '20px',
          backgroundColor: statusStyle.bg, mb: 2.5,
        }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: statusStyle.color }}>
            {formatStatus(group.status)}
          </Typography>
        </Box>

        {/* O'qituvchilar jadvali */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f3f4f6', borderRadius: '10px', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#6b7280', fontSize: '0.78rem', py: 1.2, px: 2 }}>O'qituvchi</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#6b7280', fontSize: '0.78rem', py: 1.2, px: 2 }}>Roli</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#6b7280', fontSize: '0.78rem', py: 1.2, px: 2 }}>Dars kunlari</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#6b7280', fontSize: '0.78rem', py: 1.2, px: 2 }}>Dars vaqti</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3, color: '#9ca3af', fontSize: '0.85rem' }}>
                    O'qituvchi mavjud emas
                  </TableCell>
                </TableRow>
              ) : teachers.map((t, i) => (
                <TableRow key={i} sx={{ '& td': { borderBottom: i === teachers.length - 1 ? 'none' : '1px solid #f3f4f6' } }}>
                  <TableCell sx={{ py: 1.3, px: 2, fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                    {t.full_name || '—'}
                  </TableCell>
                  <TableCell sx={{ py: 1.3, px: 2, fontSize: '0.83rem', color: '#4b5563' }}>
                    O'qituvchi
                  </TableCell>
                  <TableCell sx={{ py: 1.3, px: 2, fontSize: '0.83rem', color: '#4b5563' }}>
                    {formatDays(group.week_day)}
                  </TableCell>
                  <TableCell sx={{ py: 1.3, px: 2, fontSize: '0.83rem', color: '#4b5563' }}>
                    {group.start_time || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}

function getInitials(name = '') {
  const p = name.trim().split(' ');
  return p.length >= 2
    ? (p[0][0] + p[1][0]).toUpperCase()
    : (p[0]?.[0] || '?').toUpperCase();
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const months = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
  ];
  return `${date.getFullYear()}-yil ${date.getDate()}-${months[date.getMonth()]}`;
}

export default function StudentGroups() {
  const [activeTab, setActiveTab] = useState(0);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/api/v1/students/my/groups')
      .then(res => setGroups(res.data?.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredGroups = groups.filter(item => {
    const status = item.groups?.status;
    if (activeTab === 0) return ['active', 'planned', 'freeze'].includes(status);
    return ['completed', 'cancelled'].includes(status);
  });

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #e5e7eb', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          TabIndicatorProps={{ style: { backgroundColor: '#c5a059', height: 3 } }}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none', fontWeight: 700, fontSize: '1rem', color: '#9ca3af',
              '&.Mui-selected': { color: '#c5a059' }
            }
          }}
        >
          <Tab label="Faol" />
          <Tab label="Tugagan" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#c5a059' }} />
        </Box>
      ) : filteredGroups.length === 0 ? (
        <Box sx={{ py: 10, textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <Typography sx={{ color: '#9ca3af', fontWeight: 600 }}>
            {activeTab === 0 ? 'Faol guruhlar mavjud emas' : 'Tugagan guruhlar mavjud emas'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#fff' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.2, px: 2 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.2, px: 2 }}>Guruh nomi</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.2, px: 2 }}>Yo'nalishi</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.2, px: 2 }}>O'qituvchi</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.83rem', py: 1.2, px: 2 }}>Boshlash vaqti</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGroups.map((item, idx) => {
                const group = item.groups || {};
                const courseName = group.course?.name || '—';
                const teachers = (group.teachersGroups || []).map(tg => tg.teacher).filter(Boolean);

                return (
                  <TableRow
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#fdf8f0' },
                      '& td': { borderBottom: '1px solid #f3f4f6' },
                      '&:last-child td': { borderBottom: 'none' },
                      transition: 'background 0.15s',
                    }}
                  >
                    <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>{group.name}</TableCell>
                    <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.88rem', color: '#4b5563', fontWeight: 500 }}>{courseName}</TableCell>
                    <TableCell sx={{ py: 1.2, px: 2 }}>
                      {/* O'qituvchilar soni — doira badge */}
                      <Box
                        sx={{
                          width: 28, height: 28, borderRadius: '50%',
                          backgroundColor: 'rgba(197,160,89,0.18)',
                          color: '#c5a059',
                          fontWeight: 700, fontSize: '0.78rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {teachers.length || '—'}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.88rem', color: '#4b5563', fontWeight: 500 }}>
                      {formatDate(group.start_date)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal */}
      {selectedItem && (
        <GroupDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </Box>
  );
}
