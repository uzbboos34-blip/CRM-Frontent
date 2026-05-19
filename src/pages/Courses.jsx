import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Box, Typography, Button, IconButton, Paper, Grid, Chip,
  Drawer, TextField, Stack, FormControlLabel, Checkbox,
  Select, MenuItem, FormControl, InputAdornment, Divider,
  FormGroup, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const colorOptions = [
  '#1e293b', '#7b61ff', '#ef4444', '#f97316', '#16a34a',
  '#0891b2', '#6366f1', '#ec4899'
];
const lessonDurations = ['60 min', '75 min', '90 min', '120 min', '240 min'];
const courseDurations = ['1 oy', '2 oy', '3 oy', '4 oy', '6 oy', '8 oy', '12 oy'];

export default function Courses() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    lessonDuration: '',
    courseDuration: '',
    price: '',
    description: '',
    color: '#7b61ff',
  });

  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  async function getCourses() {
    const res = await api.get(`/api/v1/courses/all?status=${activeTab}`);
    setCourses(res.data || []);
  }

  useEffect(() => {
    getCourses();
  }, [activeTab]);

  function openCreateDrawer() {
    setEditingId(null);
    setForm({
      name: '',
      lessonDuration: '',
      courseDuration: '',
      price: '',
      description: '',
      color: '#7b61ff',
    });
    setIsDrawerOpen(true);
  }

  function openEditDrawer(course) {
    setEditingId(course.id);
    setForm({
      name: course.name,
      lessonDuration: `${course.duration_hours * 60} min`,
      courseDuration: `${course.duration_month} oy`,
      price: course.price,
      description: course.description,
      color: '#7b61ff',
    });
    setIsDrawerOpen(true);
  }

  async function handleSubmit() {
    if (editingId) {
      await updateCourse();
    } else {
      await addCourse();
    }
  }

  async function addCourse() {
      const token = localStorage.getItem("token");
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        duration_hours: (parseInt(form.lessonDuration) || 0) / 60,
        duration_month: parseInt(form.courseDuration) || 0,
      };

      await api.post("/api/v1/courses/courses", payload);
      
      getCourses();
      setIsDrawerOpen(false);
  }

  async function updateCourse() {
      const token = localStorage.getItem("token");
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        duration_hours: (parseInt(form.lessonDuration) || 0) / 60,
        duration_month: parseInt(form.courseDuration) || 0,
      };

      await api.put(`/api/v1/courses/${editingId}`, payload);
      getCourses();
      setIsDrawerOpen(false);
      setEditingId(null);
  }

  const triggerDelete = (id) => {
    setCourseToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      await api.delete(`/api/v1/courses/${courseToDelete}`);
      getCourses();
      setDeleteConfirmOpen(false);
      setCourseToDelete(null);
    } catch (e) {
      alert('Xatolik: ' + (e.response?.data?.message || 'O\'chirib bo\'lmadi'));
    }
  };

  async function restoreCourse(id) {
    try {
      await api.put(`/api/v1/courses/${id}`, { status: 'active' });
      getCourses();
    } catch (e) {
      alert('Xatolik: ' + (e.response?.data?.message || 'Qaytarib bo\'lmadi'));
    }
  }


  return (
    <Box>
      <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>Kurslar</Typography>
            <IconButton size="small" onClick={getCourses}><RefreshIcon sx={{ fontSize: 18, color: '#6b7280' }} /></IconButton>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDrawer}
            sx={{ backgroundColor: '#7b61ff', borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, py: 1, '&:hover': { backgroundColor: '#6a50e8' } }}
          >
            Kurs qo'shish
          </Button>
        </Box>



        {/* Tabs */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          {[
            { key: 'active', label: "Kurslar" },
            { key: 'inactive', label: "Arxiv", icon: <CalendarMonthIcon sx={{ fontSize: 16 }} /> }
          ].map(tab => (
            <Button key={tab.key} startIcon={tab.icon}
              onClick={() => setActiveTab(tab.key)}
              sx={{
                textTransform: 'none', borderRadius: '8px', fontWeight: 600, px: 2,
                color: activeTab === tab.key ? '#7b61ff' : '#6b7280',
                borderBottom: activeTab === tab.key ? '2px solid #7b61ff' : '2px solid transparent',
                '&:hover': { backgroundColor: 'transparent', color: '#7b61ff' }
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Box>

        {/* Course cards — har doim 4 ta qatorda */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px'
        }}>
          {courses.map(course => (
            <Box key={course.id}>
              <Paper elevation={0} sx={{
                p: 2.5,
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                backgroundColor: colorOptions[course.id % colorOptions.length] + '22',
                borderColor: colorOptions[course.id % colorOptions.length],
                '&:hover': { boxShadow: '0 8px 20px rgba(0,0,0,0.06)' },
                transition: 'all 0.3s',
              }}>
                {/* Qator 1: Nom + Ikonkalar */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827', lineHeight: 1.3 }}>
                    {course.name}
                  </Typography>
                  <Stack direction="row" spacing={0} sx={{ flexShrink: 0, ml: 1, mt: -0.5 }}>
                    {activeTab === 'inactive' ? (
                      <Tooltip title="Arxivdan chiqarish">
                        <IconButton size="small" onClick={() => restoreCourse(course.id)} sx={{ color: '#10b981', '&:hover': { color: '#059669' }, p: 0.5 }}>
                          <RefreshIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <>
                        <IconButton size="small" onClick={() => triggerDelete(course.id)} sx={{ color: '#9ca3af', '&:hover': { color: '#ef4444' }, p: 0.5 }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => openEditDrawer(course)} sx={{ color: '#9ca3af', '&:hover': { color: '#7b61ff' }, p: 0.5 }}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </>
                    )}
                  </Stack>
                </Box>

                {/* Qator 2: Tavsif */}
                <Typography variant="caption" sx={{
                  color: '#6b7280', lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  mb: 1.5, display: 'block'
                }}>
                  {course.description}
                </Typography>

                {/* Qator 3: Statistika */}
                <Stack direction="row" spacing={1}>
                  {[
                    `${course.duration_hours * 60} min`,
                    `${course.duration_month} oy`,
                    `${course.price} mln`
                  ].map((item, idx) => (
                    <Box key={idx} sx={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid',
                      borderColor: 'inherit', // Uses the card's border color for harmony
                      borderRadius: '10px', 
                      px: 1.2, 
                      py: 0.4,
                      display: 'flex',
                      alignItems: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                      <Typography variant="caption" sx={{ color: '#111827', fontWeight: 800, fontSize: '0.7rem' }}>
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Box>
          ))}
        </Box>
      </Paper>


      {/* Kurs qo'shish/tahrirlash Drawer */}
      <Drawer 
        anchor="right" 
        open={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        sx={{ zIndex: 2000 }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(2px)',
            }
          }
        }}
        PaperProps={{ sx: { width: 480, borderRadius: '24px 0 0 24px' } }}>
        <Box sx={{ p: 4, overflowY: 'auto', height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{editingId ? 'Kursni tahrirlash' : 'Kurs qo\'shish'}</Typography>
            <IconButton onClick={() => setIsDrawerOpen(false)}><CloseIcon /></IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {editingId ? 'Mavjud kurs ma\'lumotlarini o\'zgartiring.' : 'Bu yerda siz yangi kurs qo\'shishingiz mumkin.'}
          </Typography>

          <Stack spacing={3}>
            {/* Nomi */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>Nomi</Typography>
              <TextField fullWidth placeholder="Kurs nomi..."
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            </Box>



            {/* Dars davomiyligi */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>Dars davomiyligi</Typography>
              <FormControl fullWidth>
                <Select displayEmpty value={form.lessonDuration}
                  onChange={e => setForm(p => ({ ...p, lessonDuration: e.target.value }))}
                  sx={{ borderRadius: '12px' }}
                  MenuProps={{ sx: { zIndex: 3000 } }}
                  renderValue={v => v || <span style={{ color: '#9ca3af' }}>Tanlang</span>}>
                  {lessonDurations.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            {/* Kurs davomiyligi */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>Kurs davomiyligi (oylarda)</Typography>
              <FormControl fullWidth>
                <Select displayEmpty value={form.courseDuration}
                  onChange={e => setForm(p => ({ ...p, courseDuration: e.target.value }))}
                  sx={{ borderRadius: '12px' }}
                  MenuProps={{ sx: { zIndex: 3000 } }}
                  renderValue={v => v || <span style={{ color: '#9ca3af' }}>Tanlang</span>}>
                  {courseDurations.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            {/* Narx */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>Narx</Typography>
              <TextField fullWidth placeholder="Narxini kiriting"
                value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                InputProps={{ startAdornment: <InputAdornment position="start"><AttachMoneyIcon sx={{ color: '#9ca3af', fontSize: 20 }} /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            </Box>

            {/* Description */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>Description</Typography>
              <TextField fullWidth multiline rows={3}
                placeholder="Kurs haqida qisqacha..."
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            </Box>

            {/* Rangi */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#374151' }}>Rangi</Typography>
              <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: 1.5 }}>
                Tanlangan rang ro'yxatda ko'rinadi.
              </Typography>
              <Stack direction="row" spacing={1.5}>
                {colorOptions.map(color => (
                  <Box key={color} onClick={() => setForm(p => ({ ...p, color }))}
                    sx={{
                      width: 32, height: 32, borderRadius: '50%', backgroundColor: color,
                      cursor: 'pointer',
                      border: form.color === color ? '3px solid #7b61ff' : '3px solid transparent',
                      outline: form.color === color ? '2px solid #fff' : 'none',
                      outlineOffset: '-4px',
                      transition: 'all 0.2s',
                      '&:hover': { transform: 'scale(1.15)' }
                    }} />
                ))}
              </Stack>
            </Box>

            <Divider />

            <Stack direction="row" spacing={2}>
              <Button fullWidth variant="outlined" onClick={() => setIsDrawerOpen(false)}
                sx={{ py: 1.5, borderRadius: '14px', fontWeight: 700, textTransform: 'none', borderColor: '#e5e7eb', color: '#374151' }}>
                Bekor qilish
              </Button>
              <Button fullWidth variant="contained" onClick={handleSubmit}
                sx={{ backgroundColor: '#7b61ff', py: 1.5, borderRadius: '14px', fontWeight: 700, textTransform: 'none', '&:hover': { backgroundColor: '#6a50e8' } }}>
                Saqlash
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>

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
              Kursni arxivlash
            </Typography>

            <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5, mb: 4 }}>
              Haqiqatan ham ushbu kursni arxivga ko'chirmoqchimisiz? Uni keyinchalik arxiv bo'limidan yana faollashtirishingiz mumkin.
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
