import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Box, Typography, Button, IconButton, Paper, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, InputAdornment, Checkbox, Stack, Divider, Drawer,
  Chip, Tooltip, Autocomplete, FormControlLabel, Radio, RadioGroup,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PlaceIcon from '@mui/icons-material/Place';
import KeyIcon from '@mui/icons-material/VpnKey';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupsIcon from '@mui/icons-material/Groups';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';

const ITEMS_PER_PAGE = 10;

const getInitials = (name = '') => {
  const parts = (name || '').trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : (parts[0]?.[0] || '?').toUpperCase();
};

const avatarColors = ['#7b61ff', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];
const getColor = (id) => avatarColors[id % avatarColors.length];

export default function Students() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [students, setStudents] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('students');
  const [editingId, setEditingId] = useState(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [groupSearch, setGroupSearch] = useState('');
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const filteredGroups = allGroups.filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const toggleGroupSelect = (id) => {
    setSelectedGroups(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const confirmGroups = () => {
    setForm(f => ({ ...f, groups: selectedGroups }));
    setIsGroupModalOpen(false);
  };

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    birth_date: '',
    gender: 'MALE',
    photo: null,
    groups: []
  });

  const token = () => localStorage.getItem('token');

  async function getStudents(q = '') {
    try {
      const statusParam = activeTab === 'students' ? 'active' : 'inactive';
      let url = `/api/v1/students/all?status=${statusParam}`;
      if (q) {
        url += `&full_name=${q}`;
      }
      const res = await api.get(url);
      setStudents(res.data.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  }

  async function getAllGroups() {
    try {
      const res = await api.get('/api/v1/groups');
      setAllGroups(res.data?.data || res.data || []);
    } catch { /* silent */ }
  }

  function openCreateDrawer() {
    setEditingId(null);
    resetForm();
    setSelectedGroups([]);
    setIsDrawerOpen(true);
  }

  async function openEditDrawer(student) {
    setEditingId(student.id);
    const gIds = (student.studentGroups || []).map(sg => sg.groups?.id).filter(Boolean);
    setForm({
      full_name: student.full_name,
      email: student.email,
      password: '',
      phone: student.phone,
      address: student.address || '',
      birth_date: student.birth_date ? student.birth_date.split('T')[0] : '',
      gender: student.gender || 'MALE',
      photo: null,
      groups: gIds
    });
    setSelectedGroups(gIds);
    setIsDrawerOpen(true);
  }

  async function handleSubmit() {
    if (editingId) {
      await updateStudent();
    } else {
      await saveStudent();
    }
  }

  async function saveStudent() {
    try {
      const formData = new FormData();
      formData.append('full_name', (form.full_name || '').trim());
      formData.append('email', (form.email || '').trim());
      formData.append('password', (form.password || '').trim());
      formData.append('phone', (form.phone || '').trim());
      formData.append('address', (form.address || '').trim());
      formData.append('birth_date', form.birth_date || '');
      formData.append('gender', form.gender || 'MALE');
      if (form.photo) formData.append('photo', form.photo);

      form.groups.forEach(id => {
        formData.append('groups', id);
      });

      const res = await api.post('/api/v1/students', formData);
      if (res.data) {
        getStudents();
        setIsDrawerOpen(false);
        resetForm();
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      alert('Xatolik: ' + (Array.isArray(msg) ? msg.join(', ') : msg || 'Saqlab bo\'lmadi'));
    }
  }

  async function updateStudent() {
    try {
      const formData = new FormData();
      formData.append('full_name', (form.full_name || '').trim());
      formData.append('email', (form.email || '').trim());
      if (form.password) formData.append('password', (form.password || '').trim());
      formData.append('phone', (form.phone || '').trim());
      formData.append('address', (form.address || '').trim());
      if (form.birth_date) formData.append('birth_date', form.birth_date);
      formData.append('gender', form.gender || 'MALE');
      if (form.photo) formData.append('photo', form.photo);

      form.groups.forEach(id => {
        formData.append('groups', id);
      });

      const res = await api.put(`/api/v1/students/${editingId}`, formData);
      if (res.data) {
        getStudents();
        setIsDrawerOpen(false);
        setEditingId(null);
        resetForm();
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      alert('Xatolik: ' + (Array.isArray(msg) ? msg.join(', ') : msg || 'Yangilab bo\'lmadi'));
    }
  }

  const triggerDelete = (id) => {
    setStudentToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await api.delete(`/api/v1/students/${studentToDelete}`);
      getStudents(searchQuery);
      setDeleteConfirmOpen(false);
      setStudentToDelete(null);
    } catch (err) {
      alert('Xatolik: ' + (err.response?.data?.message || 'O\'chirib bo\'lmadi'));
    }
  };

  async function restoreStudent(id) {
    try {
      const formData = new FormData();
      formData.append('status', 'active');
      await api.put(`/api/v1/students/${id}`, formData);
      getStudents(searchQuery);
    } catch (err) {
      alert('Xatolik: ' + (err.response?.data?.message || 'Arxivdan chiqarib bo\'lmadi'));
    }
  }

  function resetForm() {
    setForm({ full_name: '', email: '', password: '', phone: '', address: '', birth_date: '', gender: 'MALE', photo: null, groups: [] });
  }

  useEffect(() => {
    if (!token() || token() === 'undefined') { window.location.href = '/login'; return; }
    const delayDebounce = setTimeout(() => {
      getStudents(searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, activeTab]);

  const totalPages = Math.max(1, Math.ceil(students.length / ITEMS_PER_PAGE));
  const paginated = students.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleToggleAll = (e) => setSelectedIds(e.target.checked ? paginated.map(s => s.id) : []);
  const handleToggleOne = (id) => setSelectedIds(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <Box sx={{ p: 0 }}>
      {/* ─── Header ─── */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>Talabalar</Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', maxWidth: 600 }}>
            Ushbu sahifada siz Talabalar ro'yxatini va ularning ma'lumotlarini topasiz.
            Har bir Talaba ismi, fanlari va aloqa ma'lumotlari keltirilgan.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained" startIcon={<AddIcon />}
            onClick={openCreateDrawer}
            sx={{ backgroundColor: '#7b61ff', textTransform: 'none', borderRadius: '10px', px: 2.5, fontWeight: 700, '&:hover': { backgroundColor: '#6a50e8' } }}
          >
            Talaba qo'shish
          </Button>
        </Stack>
      </Box>

      {/* ─── Tabs & Search ─── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, width: '100%' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[
            { key: 'students', label: "Talabalar" },
            { key: 'archive', label: "Arxiv", icon: <CalendarMonthIcon sx={{ fontSize: 16 }} /> }
          ].map(tab => (
            <Button key={tab.key} startIcon={tab.icon}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
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

        <TextField
          size="small" placeholder="Search" value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          sx={{ width: 260, '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#fff' } }}
          slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ fontSize: 20, color: '#9ca3af' }} /></InputAdornment>) } }}
        />
      </Box>

      {/* ─── Table ─── */}
      <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f9fafb' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox size="small" onChange={handleToggleAll} checked={paginated.length > 0 && selectedIds.length === paginated.length} indeterminate={selectedIds.length > 0 && selectedIds.length < paginated.length} />
                </TableCell>
                {['Nomi ↓', 'Guruh', 'Telefon raqamlari', 'Tug\'ilgan sanasi', 'Yaratilgan sana', 'Amallar'].map(col => (
                  <TableCell key={col} sx={{ fontWeight: 600, color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: '#9ca3af' }}>Ma'lumot topilmadi</TableCell></TableRow>
              ) : paginated.map((student) => {
                const groups = student.studentGroups?.map(g => g.groups?.name).filter(Boolean) || [];
                return (
                  <TableRow key={student.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell padding="checkbox"><Checkbox size="small" checked={selectedIds.includes(student.id)} onChange={() => handleToggleOne(student.id)} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={student.photo ? `https://crm-backend-l7jq.onrender.com/file/${student.photo}` : undefined} sx={{ width: 32, height: 32, backgroundColor: getColor(student.id), fontSize: '0.75rem', fontWeight: 700 }}>{getInitials(student.full_name)}</Avatar>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{student.full_name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {groups.length > 0 ? groups.map((g, i) => <Chip key={i} label={g} size="small" sx={{ fontSize: '0.7rem', height: 22, backgroundColor: '#f0eeff', color: '#7b61ff', fontWeight: 600 }} />) : <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af' }}>—</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#374151' }}>{student.phone}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#374151' }}>{formatDate(student.birth_date)}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatDate(student.created_at)}</Typography></TableCell>
                    <TableCell>
                      {activeTab === 'archive' ? (
                        <Tooltip title="Arxivdan chiqarish">
                          <IconButton size="small" onClick={() => restoreStudent(student.id)} sx={{ color: '#10b981', '&:hover': { color: '#059669' } }}>
                            <RefreshIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" sx={{ '&:hover': { color: '#7b61ff' } }}><VisibilityIcon sx={{ fontSize: 18 }} /></IconButton>
                          <IconButton size="small" onClick={() => triggerDelete(student.id)} sx={{ '&:hover': { color: '#ef4444' } }}><DeleteIcon sx={{ fontSize: 18 }} /></IconButton>
                          <IconButton size="small" onClick={() => openEditDrawer(student)} sx={{ '&:hover': { color: '#10b981' } }}><EditIcon sx={{ fontSize: 18 }} /></IconButton>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb' }}>
          <Button size="small" startIcon={<KeyboardArrowLeftIcon />} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <Button key={p} size="small" onClick={() => setPage(p)} sx={{ minWidth: 32, height: 32, borderRadius: '8px', fontWeight: page === p ? 700 : 400, backgroundColor: page === p ? '#7b61ff' : 'transparent', color: page === p ? '#fff' : '#4b5563' }}>{p}</Button>
            ))}
          </Box>
          <Button size="small" endIcon={<KeyboardArrowRightIcon />} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </Box>
      </Paper>

      {/* ─── Add Student Drawer ─── */}
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
        PaperProps={{ sx: { width: 400 } }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{editingId ? 'Talabani tahrirlash' : 'Talaba qo\'shish'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {editingId ? 'Mavjud talaba ma\'lumotlarini o\'zgartiring.' : 'Bu yerda siz yangi Talaba qo\'shishingiz mumkin.'}
            </Typography>
          </Box>
          <IconButton onClick={() => setIsDrawerOpen(false)}><CloseIcon /></IconButton>
        </Box>
        <Divider />

        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Telefon raqam</Typography>
              <TextField fullWidth size="small" placeholder="+998" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Box>

            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Mail</Typography>
              <TextField fullWidth size="small" placeholder="Elektron pochtani kiriting" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Box>

            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Talaba FIO</Typography>
              <TextField fullWidth size="small" placeholder="Ma'lumotni kiriting" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Box>

            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Tug'ilgan sanasi</Typography>
              <TextField fullWidth size="small" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Box>

            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Guruh</Typography>
              <Box
                onClick={() => { setGroupSearch(''); getAllGroups(); setSelectedGroups(form.groups); setIsGroupModalOpen(true); }}
                sx={{
                  border: '1.5px dashed #d1d5db', borderRadius: '8px', p: 1.5,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
                  '&:hover': { borderColor: '#7b61ff', backgroundColor: '#faf9ff' }
                }}
              >
                <AddIcon sx={{ fontSize: 18, color: '#7b61ff' }} />
                <Typography sx={{ fontSize: '0.82rem', color: '#7b61ff', fontWeight: 600 }}>
                  {form.groups.length > 0
                    ? allGroups
                      .filter(g => form.groups.includes(g.id))
                      .map(g => g.name)
                      .join(', ')
                    : 'Qo\'shish'}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Surati</Typography>
              <Box component="label" sx={{ border: '1.5px dashed #e5e7eb', borderRadius: '10px', p: 3, textAlign: 'center', cursor: 'pointer', display: 'block', '&:hover': { borderColor: '#7b61ff' } }}>
                <input type="file" hidden accept="image/*" onChange={(e) => setForm({ ...form, photo: e.target.files[0] })} />
                <CloudUploadIcon sx={{ fontSize: 28, color: '#9ca3af', mb: 0.5 }} />
                <Typography sx={{ fontSize: '0.75rem', color: '#7b61ff', fontWeight: 600 }}>{form.photo ? form.photo.name : 'Click to upload or drag and drop'}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: '#9ca3af' }}>JPG or PNG (max. 2 MB)</Typography>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Manzil</Typography>
              <TextField fullWidth size="small" placeholder="Manzilni kiriting" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} InputProps={{ startAdornment: <InputAdornment position="start"><PlaceIcon sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }} />
            </Box>

            <Box>
              <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Parol</Typography>
              <TextField fullWidth size="small" type="password" placeholder="Parolni kiriting" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} InputProps={{ startAdornment: <InputAdornment position="start"><KeyIcon sx={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment> }} />
            </Box>
          </Stack>
        </Box>

        <Divider />
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={() => setIsDrawerOpen(false)} sx={{ borderRadius: '8px', textTransform: 'none' }}>Bekor qilish</Button>
          <Button fullWidth variant="contained" onClick={handleSubmit} sx={{ backgroundColor: '#7b61ff', borderRadius: '8px', textTransform: 'none', '&:hover': { backgroundColor: '#6a50e8' } }}>Saqlash</Button>
        </Box>
      </Drawer>

      {/* ─── Guruhga biriktirish Modal ─── */}
      <Dialog
        open={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        maxWidth="sm" fullWidth
        sx={{ zIndex: 2100 }}
        slotProps={{
          backdrop: { sx: { backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(2px)' } }
        }}
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Guruhga biriktirish</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Bir yoki bir nechta guruhni tanlang
            </Typography>
          </Box>
          <IconButton onClick={() => setIsGroupModalOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2, pt: 1 }}>
          <TextField
            fullWidth size="small" placeholder="Guruh qidiring..."
            value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
                  </InputAdornment>
                )
              }
            }}
          />

          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {filteredGroups.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: '#9ca3af', py: 3 }}>Guruh topilmadi</Typography>
            ) : filteredGroups.map((group) => (
              <Box
                key={group.id}
                onClick={() => toggleGroupSelect(group.id)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                  borderRadius: '8px', cursor: 'pointer', mb: 0.5,
                  '&:hover': { backgroundColor: '#f9fafb' },
                  backgroundColor: selectedGroups.includes(group.id) ? '#f0eeff' : 'transparent'
                }}
              >
                <Checkbox
                  size="small"
                  checked={selectedGroups.includes(group.id)}
                  onChange={() => toggleGroupSelect(group.id)}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ '&.Mui-checked': { color: '#7b61ff' } }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '6px',
                    backgroundColor: '#7b61ff20', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <GroupsIcon sx={{ fontSize: 16, color: '#7b61ff' }} />
                  </Box>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 500 }}>{group.name}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
          <Button onClick={() => setIsGroupModalOpen(false)} variant="outlined"
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#e5e7eb', color: '#374151', flex: 1 }}>
            Bekor qilish
          </Button>
          <Button onClick={confirmGroups} variant="contained"
            sx={{ backgroundColor: '#7b61ff', borderRadius: '8px', textTransform: 'none', fontWeight: 700, flex: 1, '&:hover': { backgroundColor: '#6a50e8' } }}>
            Qo'shish
          </Button>
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
              Talabani arxivlash
            </Typography>

            <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5, mb: 4 }}>
              Haqiqatan ham ushbu talabani arxivga ko'chirmoqchimisiz? Uni keyinchalik arxiv bo'limidan yana faollashtirishingiz mumkin.
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
