import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Box, Typography, Button, MenuItem, Select, FormControl,
  FormHelperText, Paper, Divider, CircularProgress,
  Snackbar, Alert, IconButton, Tooltip,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import CloudUpload from '@mui/icons-material/CloudUpload';
import AttachFile from '@mui/icons-material/AttachFile';
import Close from '@mui/icons-material/Close';

const ArrowBackIcon = ArrowBack;
const CloudUploadIcon = CloudUpload;
const AttachFileIcon = AttachFile;
const CloseIcon = Close;

/* ═══════════════════════════════════════════════════════════
   Minimal Rich-Text Toolbar (no external lib)
   Foydalanuvchi contentEditable div ichiga yozadi,
   toolbar tugmalar execCommand() bilan formatlaydi.
   ═══════════════════════════════════════════════════════════ */
const FONT_FAMILIES = ['Sans Serif', 'Serif', 'Monospace'];
const FONT_SIZES    = ['Normal', 'Small', 'Large', 'H1', 'H2'];

function RichEditor({ value, onChange }) {
  const editorRef = useRef(null);

  function exec(cmd, val = null) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    syncValue();
  }

  function syncValue() {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  const toolBtnSx = {
    minWidth: 32, height: 28, px: 0.5,
    border: '1px solid #e5e7eb', borderRadius: '6px',
    fontSize: '0.78rem', fontWeight: 700, color: '#374151',
    cursor: 'pointer', background: '#fff', lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    '&:hover': { background: '#f3f4f6', borderColor: '#d1d5db' },
    transition: 'all 0.15s',
  };

  return (
    <Box sx={{
      border: '1px solid #e5e7eb', borderRadius: '10px',
      overflow: 'hidden', background: '#fff',
    }}>
      {/* ── Toolbar ── */}
      <Box sx={{
        display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center',
        px: 1.5, py: 1, borderBottom: '1px solid #e5e7eb', background: '#fafafa',
      }}>
        {/* Heading buttons */}
        <Box component="button" sx={toolBtnSx} onClick={() => exec('formatBlock', '<h1>')}>H1</Box>
        <Box component="button" sx={toolBtnSx} onClick={() => exec('formatBlock', '<h2>')}>H2</Box>

        {/* Font family */}
        <Select
          size="small"
          defaultValue="Sans Serif"
          sx={{
            height: 28, fontSize: '0.78rem', minWidth: 100,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
            borderRadius: '6px',
          }}
          onChange={(e) => exec('fontName', e.target.value)}
        >
          {FONT_FAMILIES.map(f => <MenuItem key={f} value={f} sx={{ fontSize: '0.78rem' }}>{f}</MenuItem>)}
        </Select>

        {/* Font size */}
        <Select
          size="small"
          defaultValue="Normal"
          sx={{
            height: 28, fontSize: '0.78rem', minWidth: 90,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
            borderRadius: '6px',
          }}
          onChange={(e) => {
            const map = { Normal: '3', Small: '1', Large: '5', H1: '6', H2: '5' };
            exec('fontSize', map[e.target.value] || '3');
          }}
        >
          {FONT_SIZES.map(s => <MenuItem key={s} value={s} sx={{ fontSize: '0.78rem' }}>{s}</MenuItem>)}
        </Select>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Formatting */}
        <Tooltip title="Bold"><Box component="button" sx={{ ...toolBtnSx, fontWeight: 900 }} onClick={() => exec('bold')}>B</Box></Tooltip>
        <Tooltip title="Italic"><Box component="button" sx={{ ...toolBtnSx, fontStyle: 'italic' }} onClick={() => exec('italic')}>I</Box></Tooltip>
        <Tooltip title="Underline"><Box component="button" sx={{ ...toolBtnSx, textDecoration: 'underline' }} onClick={() => exec('underline')}>U</Box></Tooltip>
        <Tooltip title="Strikethrough"><Box component="button" sx={{ ...toolBtnSx, textDecoration: 'line-through' }} onClick={() => exec('strikeThrough')}>S</Box></Tooltip>
        <Tooltip title="Blockquote"><Box component="button" sx={toolBtnSx} onClick={() => exec('formatBlock', '<blockquote>')}>"</Box></Tooltip>
        <Tooltip title="Code"><Box component="button" sx={{ ...toolBtnSx, fontFamily: 'monospace' }} onClick={() => exec('formatBlock', '<pre>')}>&lt;/&gt;</Box></Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Lists */}
        <Tooltip title="Ordered list"><Box component="button" sx={toolBtnSx} onClick={() => exec('insertOrderedList')}>1.</Box></Tooltip>
        <Tooltip title="Unordered list"><Box component="button" sx={toolBtnSx} onClick={() => exec('insertUnorderedList')}>•</Box></Tooltip>
        <Tooltip title="Indent"><Box component="button" sx={toolBtnSx} onClick={() => exec('indent')}>→</Box></Tooltip>
        <Tooltip title="Outdent"><Box component="button" sx={toolBtnSx} onClick={() => exec('outdent')}>←</Box></Tooltip>

        {/* Link */}
        <Tooltip title="Link">
          <Box component="button" sx={toolBtnSx} onClick={() => {
            const url = prompt('URL kiriting:');
            if (url) exec('createLink', url);
          }}>🔗</Box>
        </Tooltip>
      </Box>

      {/* ── Editable area ── */}
      <Box
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncValue}
        sx={{
          minHeight: 140, p: 2,
          outline: 'none', fontSize: '0.9rem', color: '#111827',
          lineHeight: 1.7,
          '& h1': { fontSize: '1.5rem', fontWeight: 700, my: 1 },
          '& h2': { fontSize: '1.2rem', fontWeight: 700, my: 1 },
          '& blockquote': {
            borderLeft: '3px solid #e5e7eb', pl: 2,
            color: '#6b7280', my: 1,
          },
          '& pre': {
            background: '#f3f4f6', p: 1, borderRadius: '6px',
            fontFamily: 'monospace', fontSize: '0.82rem',
          },
          '&:empty:before': {
            content: '"Izoh yozing..."',
            color: '#9ca3af', pointerEvents: 'none',
          },
        }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════
   CreateHomeWork Page
   ═══════════════════════════════════════════════════════════ */
export default function CreateHomeWork() {
  const { id: groupId } = useParams();           // /group/:id/homework/create
  const navigate = useNavigate();

  const [lessons, setLessons]       = useState([]);
  const [lessonId, setLessonId]     = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile]             = useState(null);
  const [saving, setSaving]         = useState(false);
  const [errors, setErrors]         = useState({});
  const [snackbar, setSnackbar]     = useState({ open: false, msg: '', sev: 'success' });

  const fileInputRef = useRef(null);

  /* ── Fetch lessons for this group (as topic options) ── */
  useEffect(() => {
    if (!groupId) return;
    api.get(`/api/v1/lessson?group_id=${groupId}`)
      .then(res => {
        // Backend now filters by group_id and includes it in select
        const all = res.data?.data || res.data || [];
        setLessons(all);
      })
      .catch(() => setLessons([]));
  }, [groupId]);

  /* ── Validate ── */
  function validate() {
    const e = {};
    if (!lessonId) e.lessonId = "Mavzuni tanlang";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Submit ── */
  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const selectedLesson = lessons.find(l => l.id === lessonId);
      await api.post('/api/v1/home-works', {
        lesson_id: lessonId,
        group_id: parseInt(groupId),
        title: selectedLesson?.topic || `Dars ${lessonId}`,
        description: description,
        file: file?.name || undefined,
      });
      setSnackbar({ open: true, msg: "Uyga vazifa muvaffaqiyatli qo'shildi!", sev: 'success' });
      setTimeout(() => navigate(`/group/${groupId}?tab=1`), 1200);
    } catch (e) {
      setSnackbar({
        open: true,
        msg: e.response?.data?.message || 'Xatolik yuz berdi',
        sev: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  /* ── File drop/pick ── */
  function handleFileDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (f) setFile(f);
  }

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', animation: 'fadeIn 0.35s ease-out' }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            color: '#6b7280', p: 0.5,
            '&:hover': { color: '#7b61ff', background: '#f0eeff' },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
          Yangi uyga vazifa yaratish
        </Typography>
      </Box>

      {/* ── Form ── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Mavzu */}
        <Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', mb: 0.8 }}>
            <Box component="span" sx={{ color: '#ef4444', mr: 0.3 }}>*</Box>
            Mavzu
          </Typography>
          <FormControl fullWidth error={!!errors.lessonId}>
            <Select
              value={lessonId}
              onChange={e => { setLessonId(e.target.value); setErrors(er => ({ ...er, lessonId: '' })); }}
              displayEmpty
              sx={{
                borderRadius: '10px', fontSize: '0.88rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: errors.lessonId ? '#ef4444' : '#e5e7eb',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#7b61ff' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7b61ff' },
              }}
              renderValue={val => {
                if (!val) return <Box sx={{ color: '#9ca3af' }}>Mavzulardan birini tanlang</Box>;
                const l = lessons.find(ls => ls.id === val);
                return l?.topic || `Dars ${val}`;
              }}
            >
              {lessons.length === 0 ? (
                <MenuItem disabled sx={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                  Darslar topilmadi
                </MenuItem>
              ) : (
                lessons.map(l => (
                  <MenuItem key={l.id} value={l.id} sx={{ fontSize: '0.85rem' }}>
                    {l.topic || `Dars #${l.id}`}
                  </MenuItem>
                ))
              )}
            </Select>
            {errors.lessonId && <FormHelperText>{errors.lessonId}</FormHelperText>}
          </FormControl>
        </Box>

        {/* Izoh */}
        <Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', mb: 0.8 }}>
            <Box component="span" sx={{ color: '#ef4444', mr: 0.3 }}>*</Box>
            Izoh
          </Typography>
          <RichEditor value={description} onChange={setDescription} />
        </Box>

        {/* File upload */}
        <Box>
          <Box
            onDragOver={e => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: '1.5px dashed #d1d5db', borderRadius: '10px',
              py: 2.5, px: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 1.5, cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': { borderColor: '#7b61ff', background: '#f9f7ff' },
            }}
          >
            {file ? (
              <>
                <AttachFileIcon sx={{ color: '#7b61ff', fontSize: 20 }} />
                <Typography sx={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>
                  {file.name}
                </Typography>
                <IconButton
                  size="small"
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                  sx={{ color: '#9ca3af', p: 0.3, '&:hover': { color: '#ef4444' } }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            ) : (
              <>
                <CloudUploadIcon sx={{ color: '#9ca3af', fontSize: 20 }} />
                <Typography sx={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                  Yuklash
                </Typography>
              </>
            )}
          </Box>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleFileDrop}
          />
        </Box>

        {/* Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontWeight: 700,
              px: 4, py: 1.1, borderColor: '#e5e7eb', color: '#374151',
              '&:hover': { borderColor: '#7b61ff', color: '#7b61ff' },
            }}
          >
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontWeight: 700,
              px: 4, py: 1.1,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              },
              '&:disabled': { opacity: 0.7 },
            }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : "E'lon qilish"}
          </Button>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.sev}
          variant="filled"
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
