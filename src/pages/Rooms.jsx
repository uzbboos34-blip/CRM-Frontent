import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Box, Typography, Button, IconButton, Paper,
  Drawer, TextField, Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';

export default function Rooms() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState({ name: '', capacity: '' });
  const [rooms, setRooms] = useState([]);
  const [editingId, setEditingId] = useState(null);

  async function getRooms() {
    const res = await api.get("/api/v1/rooms?status=active")
    setRooms(res.data)
  }

  useEffect(() => {
    getRooms()
  }, [])

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

  async function deleteRoom(id) {
    try {
      await api.delete(`/api/v1/rooms/${id}`)
      getRooms()
    } catch (error) {
      console.error("Xonani o'chirishda xatolik:", error);
      alert("Xonani o'chirishda xatolik yuz berdi");
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
                    <IconButton size="small" onClick={() => deleteRoom(room.id)} sx={{ color: '#9ca3af', '&:hover': { color: '#ef4444' } }}>
                      <DeleteIcon  sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEditDrawer(room)} sx={{ color: '#9ca3af', '&:hover': { color: '#7b61ff' } }}>
                      <EditIcon sx={{ fontSize: 18 }} />
                    </IconButton>
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
    </Box>
  );
}
