import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Box, Typography, Button, IconButton, Paper,
  Drawer, TextField, Stack, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

export default function Rooms() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState({ name: '', capacity: '' });
  const [rooms, setRooms] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  async function getRooms() {
    const res = await api.get(`/api/v1/rooms?status=${activeTab}`);
    setRooms(res.data || []);
  }

  useEffect(() => {
    getRooms();
  }, [activeTab]);

  function openCreateDrawer() {
    setEditingId(null);
    setForm({ name: '', capacity: '' });
    setIsDrawerOpen(true);
  }

  function openEditDrawer(room) {
    setEditingId(room.id);
    setForm({ name: room.name, capacity: room.capacity });
    setIsDrawerOpen(true);
  }

  async function handleSubmit() {
    if (editingId) {
      await updateRoom(editingId);
    } else {
      await createRoom();
    }
  }

  async function createRoom() {
    await api.post("/api/v1/rooms", {
      name: form.name,
      capacity: Number(form.capacity)
    })
    setIsDrawerOpen(false)
    setForm({ name: '', capacity: '' })
    getRooms()
  }

  const triggerDelete = (id) => {
    setRoomToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    try {
      await api.delete(`/api/v1/rooms/${roomToDelete}`);
      getRooms();
      setDeleteConfirmOpen(false);
      setRoomToDelete(null);
    } catch (e) {
      alert('Xatolik: ' + (e.response?.data?.message || 'O\'chirib bo\'lmadi'));
    }
  };

  async function restoreRoom(id) {
    try {
      await api.put(`/api/v1/rooms/${id}`, { status: 'active' });
      getRooms();
    } catch (e) {
      alert('Xatolik: ' + (e.response?.data?.message || 'Qaytarib bo\'lmadi'));
    }
  }

  async function updateRoom(id) {
    await api.put(`/api/v1/rooms/${id}`, {
      name: form.name,
      capacity: Number(form.capacity)
    })
    setIsDrawerOpen(false)
    setForm({ name: '', capacity: '' })
    setEditingId(null);
    getRooms()
  }


  return (
    <Box>
      <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>Xonalar</Typography>
            <IconButton size="small" onClick={getRooms}><RefreshIcon sx={{ fontSize: 18, color: '#6b7280' }} /></IconButton>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDrawer}
            sx={{ backgroundColor: '#7b61ff', borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, py: 1, '&:hover': { backgroundColor: '#6a50e8' } }}
          >
            Xonani qo'shish
          </Button>
        </Box>

        {/* Tabs */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          {[
            { key: 'active', label: "Xonalar" },
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

        {/* Xona kartalar — har doim 4 ta qatorda */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px'
        }}>
          {rooms.map(room => (
            <Box key={room.id}>
              <Paper elevation={0} sx={{
                p: 3,
                border: '2px solid #f3f4f6',
                borderRadius: '20px',
                backgroundColor: '#fff',
                '&:hover': { borderColor: '#e0d9ff', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' },
                transition: 'all 0.3s'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#111827', mb: 0.5 }}>
                      {room.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      Sig'imi: {room.capacity}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    {activeTab === 'inactive' ? (
                      <Tooltip title="Arxivdan chiqarish">
                        <IconButton size="small" onClick={() => restoreRoom(room.id)} sx={{ color: '#10b981', '&:hover': { color: '#059669' } }}>
                          <RefreshIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <>
                        <IconButton size="small" onClick={() => triggerDelete(room.id)} sx={{ color: '#9ca3af', '&:hover': { color: '#ef4444' } }}>
                          <DeleteIcon  sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => openEditDrawer(room)} sx={{ color: '#9ca3af', '&:hover': { color: '#7b61ff' } }}>
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </>
                    )}
                  </Stack>
                </Box>
              </Paper>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Xona qo'shish/tahrirlash Drawer */}
      <Drawer anchor="right" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}
        sx={{ zIndex: 2000 }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(2px)',
            }
          }
        }}
        PaperProps={{ sx: { width: 450, borderRadius: '24px 0 0 24px' } }}>
        <Box sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{editingId ? 'Xonani tahrirlash' : 'Xona qo\'shish'}</Typography>
            <IconButton onClick={() => setIsDrawerOpen(false)}><CloseIcon /></IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {editingId ? 'Mavjud xona ma\'lumotlarini o\'zgartiring.' : 'Bu yerda siz yangi xona qo\'shishingiz mumkin.'}
          </Typography>
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>Xona nomi</Typography>
              <TextField fullWidth placeholder="Masalan: 205-xona"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>Sig'imi</Typography>
              <TextField fullWidth type="number" placeholder="Masalan: 30"
                value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            </Box>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
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
              Xonani arxivlash
            </Typography>

            <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5, mb: 4 }}>
              Haqiqatan ham ushbu xonani arxivga ko'chirmoqchimisiz? Uni keyinchalik arxiv bo'limidan yana faollashtirishingiz mumkin.
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
