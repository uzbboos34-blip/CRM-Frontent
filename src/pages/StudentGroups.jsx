import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tab, Tabs, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import api from '../api/axios';

export default function StudentGroups() {
  const [activeTab, setActiveTab] = useState(0); // 0: Faol, 1: Tugagan
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

  // Filter groups: Faol (active, planned, freeze) vs Tugagan (completed, cancelled)
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
    <Box sx={{ p: { xs: 2, sm: 4 }, animation: 'fadeIn 0.3s ease-out' }}>
      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #e5e7eb', mb: 3 }}>
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
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#fff' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.88rem', py: 2 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.88rem', py: 2 }}>Guruh nomi</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.88rem', py: 2 }}>Yo'nalishi</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.88rem', py: 2, textAlign: 'center' }}>O'qituvchi</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4b5563', fontSize: '0.88rem', py: 2 }}>Boshlash vaqti</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGroups.map((item, idx) => {
                const group = item.groups || {};
                const courseName = group.course?.name || "—";
                const teacher = group.teachersGroups?.[0]?.teacher || {};
                const teacherName = teacher.full_name || "—";

                return (
                  <TableRow
                    key={item.id}
                    sx={{
                      '&:hover': { backgroundColor: '#f9fafb' },
                      '& td': { borderBottom: '1px solid #f3f4f6' },
                      '&:last-child td': { borderBottom: 'none' }
                    }}
                  >
                    <TableCell sx={{ py: 2, fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell sx={{ py: 2, fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
                      {group.name}
                    </TableCell>
                    <TableCell sx={{ py: 2, fontSize: '0.9rem', color: '#4b5563', fontWeight: 500 }}>
                      {courseName}
                    </TableCell>
                    <TableCell sx={{ py: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(197, 160, 89, 0.2)',
                          color: '#c5a059',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: '#c5a059',
                            color: '#fff',
                          },
                          transition: 'all 0.2s',
                        }}
                        title={teacherName}
                      >
                        {getInitials(teacherName)}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2, fontSize: '0.9rem', color: '#4b5563', fontWeight: 500 }}>
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
