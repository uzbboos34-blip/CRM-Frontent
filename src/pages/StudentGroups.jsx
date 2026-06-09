import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Tab, Tabs, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import api from '../api/axios';

// Kichik popover komponenti — 3 dan ortiq o'qituvchi bo'lganda
function TeachersPopover({ teachers, anchorEl, onClose, getInitials }) {
  if (!anchorEl) return null;
  const rect = anchorEl.getBoundingClientRect();
  return (
    <>
      {/* Overlay */}
      <Box
        onClick={onClose}
        sx={{ position: 'fixed', inset: 0, zIndex: 1299 }}
      />
      {/* Popover */}
      <Box
        sx={{
          position: 'fixed',
          top: rect.bottom + 8,
          left: rect.left,
          zIndex: 1300,
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          p: 1.5,
          minWidth: 180,
        }}
      >
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          O'qituvchilar
        </Typography>
        {teachers.map((t, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: 'rgba(197,160,89,0.15)',
              color: '#c5a059', fontWeight: 700, fontSize: '0.72rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {getInitials(t.full_name || '?')}
            </Box>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#111827' }}>
              {t.full_name || '—'}
            </Typography>
          </Box>
        ))}
      </Box>
    </>
  );
}

// O'qituvchilar avatarlari (stacked) komponenti
function TeacherAvatars({ teachers, getInitials }) {
  const [anchor, setAnchor] = useState(null);
  const btnRef = useRef(null);

  const MAX_SHOWN = 3;
  const shown = teachers.slice(0, MAX_SHOWN);
  const extra = teachers.length - MAX_SHOWN;

  if (teachers.length === 0) {
    return <Typography sx={{ fontSize: '0.85rem', color: '#9ca3af' }}>—</Typography>;
  }

  return (
    <>
      <Box
        sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}
      >
        {shown.map((t, i) => (
          <Box
            key={i}
            title={t.full_name}
            sx={{
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: 'rgba(197,160,89,0.18)',
              color: '#c5a059', fontWeight: 700, fontSize: '0.72rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff',
              ml: i === 0 ? 0 : '-8px',
              zIndex: MAX_SHOWN - i,
              cursor: 'default',
              transition: 'transform 0.15s',
              '&:hover': { transform: 'scale(1.12)', zIndex: 10 },
            }}
          >
            {getInitials(t.full_name || '?')}
          </Box>
        ))}

        {/* +N tugmasi */}
        {extra > 0 && (
          <Box
            ref={btnRef}
            onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}
            sx={{
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              color: '#4b5563', fontWeight: 700, fontSize: '0.7rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff',
              ml: '-8px',
              cursor: 'pointer',
              transition: 'background 0.15s',
              '&:hover': { backgroundColor: '#e5e7eb' },
            }}
          >
            +{extra}
          </Box>
        )}

        {/* 1 ta bo'lsa ham isim ko'rsatish uchun */}
        {teachers.length === 1 && (
          <Typography sx={{ ml: 1, fontSize: '0.83rem', color: '#374151', fontWeight: 500 }}>
            {teachers[0].full_name || '—'}
          </Typography>
        )}
      </Box>

      {extra > 0 && anchor && (
        <TeachersPopover
          teachers={teachers}
          anchorEl={anchor}
          onClose={() => setAnchor(null)}
          getInitials={getInitials}
        />
      )}
    </>
  );
}

export default function StudentGroups() {
  const [activeTab, setActiveTab] = useState(0);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/api/v1/students/my/groups')
      .then(res => {
        setGroups(res.data?.data || []);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const filteredGroups = groups.filter(item => {
    const status = item.groups?.status;
    if (activeTab === 0) {
      return status === 'active' || status === 'planned' || status === 'freeze';
    } else {
      return status === 'completed' || status === 'cancelled';
    }
  });

  const getInitials = (name = '') => {
    const p = name.trim().split(' ');
    return p.length >= 2
      ? (p[0][0] + p[1][0]).toUpperCase()
      : (p[0]?.[0] || '?').toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const months = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
    ];
    return `${date.getFullYear()}-yil ${date.getDate()}-${months[date.getMonth()]}`;
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #e5e7eb', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          TabIndicatorProps={{
            style: { backgroundColor: '#c5a059', height: 3 }
          }}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              color: '#9ca3af',
              '&.Mui-selected': {
                color: '#c5a059',
              }
            }
          }}
        >
          <Tab label="Faol" />
          <Tab label="Tugagan" />
        </Tabs>
      </Box>

      {/* Main Content / Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#c5a059' }} />
        </Box>
      ) : filteredGroups.length === 0 ? (
        <Box sx={{ py: 10, textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <Typography sx={{ color: '#9ca3af', fontWeight: 600 }}>
            {activeTab === 0 ? "Faol guruhlar mavjud emas" : "Tugagan guruhlar mavjud emas"}
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
                const courseName = group.course?.name || "—";
                // Barcha o'qituvchilar
                const allTeachers = (group.teachersGroups || []).map(tg => tg.teacher).filter(Boolean);

                return (
                  <TableRow
                    key={item.id}
                    sx={{
                      '&:hover': { backgroundColor: '#f9fafb' },
                      '& td': { borderBottom: '1px solid #f3f4f6' },
                      '&:last-child td': { borderBottom: 'none' }
                    }}
                  >
                    <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                      {group.name}
                    </TableCell>
                    <TableCell sx={{ py: 1.2, px: 2, fontSize: '0.88rem', color: '#4b5563', fontWeight: 500 }}>
                      {courseName}
                    </TableCell>
                    <TableCell sx={{ py: 1.2, px: 2 }}>
                      <TeacherAvatars teachers={allTeachers} getInitials={getInitials} />
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
    </Box>
  );
}
