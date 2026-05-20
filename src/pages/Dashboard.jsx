import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Accordion, AccordionSummary, AccordionDetails, Fade } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import api from '../api/axios';

export default function Dashboard() {
  const [counts, setCounts] = useState({
    groups: 0,
    courses: 0,
    students: 0,
    teachers: 0,
    rooms: 0
  });

  async function fetchCounts() {
    try {
      const res = await api.get('/api/v1/dashboard/stats');
      if (res.data?.success) {
        setCounts(res.data.data);
      }
    } catch (e) {
      console.error("Dashboard ma'lumotlarini olishda xatolik:", e);
    }
  }

  useEffect(() => {
    fetchCounts();
  }, []);

  const stats = [
    { title: "O'qituvchilar", value: counts.teachers, icon: <PersonIcon sx={{ color: '#f59e0b' }} />, bg: '#fffbeb', border: '#fef3c7' },
    { title: 'Talabalar', value: counts.students, icon: <SchoolIcon sx={{ color: '#10b981' }} />, bg: '#f0fdf4', border: '#bbf7d0' },
    { title: 'Guruhlar', value: counts.groups, icon: <PeopleIcon sx={{ color: '#7b61ff' }} />, bg: '#f5f3ff', border: '#ddd6fe' },
    { title: 'Fanlar (Kurslar)', value: counts.courses, icon: <MenuBookIcon sx={{ color: '#0ea5e9' }} />, bg: '#f0f9ff', border: '#bae6fd' },
    { title: 'Sinflar (Xonalar)', value: counts.rooms, icon: <PeopleIcon sx={{ color: '#6366f1' }} />, bg: '#eef2ff', border: '#c7d2fe' },
  ];

  return (
    <Fade in={true} timeout={600}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>
          Salom, creator!
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280', mb: 4 }}>
          EduCoin platformasiga xush kelibsiz!
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                  border: '1px solid',
                  borderColor: stat.border,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px rgba(123, 97, 255, 0.08)',
                    borderColor: '#7b61ff'
                  }
                }}
              >
                <Box sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  backgroundColor: stat.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {React.cloneElement(stat.icon, { sx: { fontSize: 28, color: stat.icon.props.sx.color } })}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                    {stat.value}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Accordion
          elevation={0}
          sx={{
            border: '1px solid #e5e7eb',
            borderRadius: '20px !important',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 1, backgroundColor: '#fafafa' }}>
            <Typography sx={{ fontWeight: 700, color: '#374151' }}>Dars Jadvali</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 3 }}>
            <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
              Dars jadvali bu yerda ko'rsatiladi...
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Fade>
  );
}
