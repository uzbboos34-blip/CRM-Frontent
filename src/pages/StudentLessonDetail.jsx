import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, IconButton, Button,
  TextField, Tooltip, CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayCircleFilledWhiteOutlinedIcon from '@mui/icons-material/PlayCircleFilledWhiteOutlined';
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';
import api from '../api/axios';
import { supabaseUrl } from '../api/supabase';

function getFullVideoUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  let baseUrl = api.defaults.baseURL || import.meta.env.VITE_API_URL || 'https://crm-backend-l7jq.onrender.com';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  baseUrl = baseUrl.replace(/\/api\/v1$/, '');
  return `${baseUrl}/file/${url}`;
}

function getHomeworkFileUrl(filename) {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  if (filename.includes('/file/') || filename.startsWith('/')) {
    return getFullVideoUrl(filename.replace(/^\//, ''));
  }
  return `${supabaseUrl}/storage/v1/object/public/NajotEdu/${filename}`;
}

function parseHomeworkFiles(homework) {
  if (!homework) return [];
  const files = [];
  const add = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach(add);
      return;
    }
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          parsed.filter(Boolean).forEach(add);
          return;
        }
      } catch {
        // fall through
      }
    }
    files.push(trimmed);
  };
  add(homework.file);
  add(homework.files);
  add(homework.video_url);
  return [...new Set(files)];
}

function getHomeworkFileName(path) {
  if (!path) return 'Biriktirilgan fayl';
  const clean = path.split('?')[0];
  return decodeURIComponent(clean.split('/').pop() || 'Biriktirilgan fayl');
}

function VideoPlayerFrame({ video }) {
  const isEmbed =
    video.video_url?.includes('embed') || video.video_url?.includes('kinescope');

  return (
    <Box sx={{
      width: '100%',
      flexShrink: 0,
      position: 'relative',
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: '#111',
      minHeight: { xs: 200, sm: 260, md: 320 },
      '&::before': {
        content: '""',
        display: 'block',
        paddingTop: '56.25%',
      },
    }}>
      <Box sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111',
      }}>
        {isEmbed ? (
          <iframe
            src={video.video_url}
            title={video.title || 'Video'}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            style={{ border: 'none', width: '100%', height: '100%' }}
          />
        ) : (
          <video
            key={video.id}
            src={getFullVideoUrl(video.video_url)}
            controls
            playsInline
            preload="metadata"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              backgroundColor: '#000',
            }}
          />
        )}
      </Box>
    </Box>
  );
}

// Uy vazifasi holati config
const HW_STATUS = {
  ACCEPTED: { label: 'Qabul qilingan', bg: '#4caf50', color: '#fff' },
  PENDING: { label: 'Kutayotganlar', bg: '#5c6bc0', color: '#fff' },
  RETURNED: { label: 'Qaytarilgan', bg: '#ffa000', color: '#fff' },
  NOT_DONE: { label: 'Bajarilmagan', bg: '#ff3b30', color: '#fff' },
  NONE: { label: 'Berilmagan', bg: '#78909c', color: '#fff' },
};

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = [
    'yanvar','fevral','mart','aprel','may','iyun',
    'iyul','avgust','sentabr','oktabr','noyabr','dekabr'
  ];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}-yil ${d.getDate()}-${months[d.getMonth()]}, soat ${hh}:${mm}`;
}

function formatDeadlineShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()} ${hh}:${mm}`;
}

function formatLessonDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month}, ${year}`;
}

export default function StudentLessonDetail() {
  const { groupId, lessonId } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedLessonId, setExpandedLessonId] = useState(null);
  const [activeVideos, setActiveVideos] = useState({}); // lessonId -> videoId mapping
  const [submitText, setSubmitText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  // Fetch all lessons of group
  const fetchGroupLessons = () => {
    return api.get(`/api/v1/students/my/groups/${groupId}/lessons`)
      .then(res => {
        const data = res.data?.data || [];
        setLessons(data);
        
        const activeVids = { ...activeVideos };
        data.forEach(l => {
          if (l.videos?.length > 0 && !activeVids[l.id]) {
            activeVids[l.id] = l.videos[0].id;
          }
        });
        setActiveVideos(activeVids);
      })
      .catch(err => {
        console.error('API error fetching lessons details:', err);
      });
  };

  useEffect(() => {
    setLoading(true);
    fetchGroupLessons().finally(() => setLoading(false));
  }, [groupId, lessonId]);

  useEffect(() => {
    setExpandedLessonId(Number(lessonId));
  }, [lessonId]);

  const activeLessonId = Number(lessonId);
  const activeLesson = lessons.find(l => l.id === activeLessonId);
  const activeVideoId = activeLesson
    ? (activeVideos[activeLesson.id] ?? activeLesson.videos?.[0]?.id)
    : null;
  const activeVideo = activeLesson
    ? (activeLesson.videos?.find(v => v.id === activeVideoId) ?? activeLesson.videos?.[0])
    : null;

  // Navigates to selected lesson URL
  const selectLesson = (lesson) => {
    setSubmitText('');
    setSelectedFiles([]);
    setIsEditing(false);
    setExpandedLessonId(lesson.id);
    navigate(`/student/groups/${groupId}/lessons/${lesson.id}`);
  };

  // Select video and update URL / Active state
  const selectVideo = (lessonId, videoId, e) => {
    e.stopPropagation();
    setActiveVideos(prev => ({ ...prev, [lessonId]: videoId }));
    setExpandedLessonId(lessonId);
    if (lessonId !== activeLessonId) {
      navigate(`/student/groups/${groupId}/lessons/${lessonId}`);
    }
  };

  // Submit Homework to backend
  const handleSendHomework = () => {
    const homework = activeLesson?.homeWorks?.[0];
    if (!homework || (!submitText.trim() && selectedFiles.length === 0)) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append('comment', submitText);
    selectedFiles.forEach((file) => formData.append('files', file));

    api.post(`/api/v1/home-works/${homework.id}/submit`, formData)
      .then(() => {
        setSubmitText('');
        setSelectedFiles([]);
        setIsEditing(false);
        return fetchGroupLessons();
      })
      .catch(err => {
        console.error('Error submitting homework:', err);
      })
      .finally(() => setSubmitting(false));
  };

  // Start tahrirlash (editing)
  const handleStartEdit = () => {
    const answer = activeLesson?.homeWorks?.[0]?.homeWorkAnswers?.[0];
    if (answer) {
      setSubmitText(answer.title || '');
      setIsEditing(true);
    }
  };

  // Save tahrirlash submission
  const handleSaveEdit = () => {
    handleSendHomework();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#c5a059' }} />
      </Box>
    );
  }

  if (!activeLesson) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="textSecondary">Dars ma'lumotlari topilmadi</Typography>
        <Button onClick={() => navigate(`/student/groups/${groupId}/lessons`)} sx={{ mt: 2, color: '#c5a059' }}>
          Darslar ro'yxatiga qaytish
        </Button>
      </Box>
    );
  }

  // Extract homework details
  const homework = activeLesson.homeWorks?.[0];
  const homeworkFiles = parseHomeworkFiles(homework);
  const answer = homework?.homeWorkAnswers?.[0];
  const statusKey = homework ? (answer ? answer.homeworkStatus : 'NOT_DONE') : 'NONE';
  const hasSubmittedHomework = Boolean(answer);
  const score = answer?.homeWorkResults?.[0]?.grade || 0;
  const teacherComment = answer?.homeWorkResults?.[0];

  return (
    <Box sx={{
      animation: 'fadeIn 0.3s ease-out',
      p: 0,
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Main split grid */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 0, // No gap between columns!
        alignItems: 'stretch',
        flexGrow: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}>
        
        {/* Left column (Player + Title + Vazifalar card) */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          p: 3,
          height: '100%',
          overflowY: 'auto',
          pb: 4,
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#c5a059', borderRadius: '8px' },
        }}>
          
          {/* Video player — fixed 16:9 frame, always visible */}
          {activeVideo ? (
            <VideoPlayerFrame video={activeVideo} />
          ) : (
            <Box sx={{
              width: '100%',
              flexShrink: 0,
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#1a1a1a',
              minHeight: { xs: 200, sm: 260, md: 320 },
              '&::before': { content: '""', display: 'block', paddingTop: '56.25%' },
            }}>
              <Box sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                color: '#9ca3af',
              }}>
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 5L15 25L40 45L65 25L40 5Z" stroke="#c5a059" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22.5 31L15 37L40 57L65 37L57.5 31" stroke="#c5a059" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M30 49L40 57L50 49" stroke="#c5a059" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700 }}>
                  Video mavjud emas
                </Typography>
              </Box>
            </Box>
          )}

          {/* Active Lesson Title display */}
          <Paper elevation={0} sx={{
            p: 2.5,
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff'
          }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#2d3748', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
              {activeLesson.topic || activeLesson.description} {activeVideo ? `(${activeVideo.title})` : ''}
            </Typography>
          </Paper>

          {/* Tabs bar */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1.5px solid #e2e8f0',
            pb: 1,
            mb: 2.5
          }}>
            <Box sx={{ borderBottom: '2.5px solid #c5a059', pb: 1.2 }}>
              <Typography sx={{ fontWeight: 800, color: '#c5a059', fontSize: '0.92rem' }}>
                Vazifalar
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 800, color: '#2d3748', fontSize: '0.9rem' }}>
              To'p: {score}
            </Typography>
          </Box>

          {homework ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Card 1: Uyga vazifa description */}
              <Paper
                elevation={0}
                sx={{
                  px: { xs: 2.5, sm: 4 },
                  py: { xs: 3, sm: 4 },
                  borderRadius: '2px',
                  border: 'none',
                  backgroundColor: '#f8f3ef',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: { xs: 3, sm: 4 }
                }}
              >
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: { xs: 2, md: 2.5 },
                }}>
                  <Typography sx={{
                    flexShrink: 0,
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                    fontWeight: 500,
                    color: '#333',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Inter', 'Outfit', sans-serif"
                  }}>
                    Uyga vazifa
                  </Typography>

                  <Box sx={{
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexWrap: 'nowrap',
                    gap: { xs: 0.5, sm: 0.65 },
                    backgroundColor: hasSubmittedHomework ? '#ff2d12' : '#fffaf0',
                    color: hasSubmittedHomework ? '#fff' : '#4f3b10',
                    px: { xs: 1, sm: 1.25 },
                    py: { xs: 0.65, sm: 0.75 },
                    borderRadius: '6px',
                    maxWidth: { xs: '100%', md: 'none' },
                  }}>
                    {hasSubmittedHomework ? (
                      <ErrorOutlineIcon sx={{ fontSize: 16, color: '#fff', flexShrink: 0 }} />
                    ) : (
                      <WarningIcon sx={{ fontSize: 16, color: '#e6a72d', flexShrink: 0 }} />
                    )}
                    <Typography component="span" sx={{
                      fontSize: { xs: '0.68rem', sm: '0.74rem' },
                      lineHeight: 1.2,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      fontFamily: "'Inter', 'Outfit', sans-serif"
                    }}>
                      <Box component="span" sx={{ fontWeight: 700 }}>Uyga vazifa muddati:</Box>
                      {' '}
                      {hasSubmittedHomework
                        ? (homework.deadline ? formatDeadlineShort(homework.deadline) : formatDeadlineShort(homework.created_at))
                        : (homework.deadline ? formatDateTime(homework.deadline) : formatDateTime(homework.created_at))}
                    </Typography>
                  </Box>

                  <Typography sx={{
                    flexShrink: 0,
                    textAlign: { xs: 'left', md: 'right' },
                    fontSize: { xs: '0.9rem', sm: '0.95rem' },
                    color: '#333',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    fontFamily: "'Inter', 'Outfit', sans-serif"
                  }}>
                    Fayllar soni: {homeworkFiles.length}
                  </Typography>
                </Box>

                {/* HW details description */}
                <Box>
                  <Typography sx={{ fontSize: { xs: '1rem', sm: '1.12rem' }, color: '#333', lineHeight: 1.6, fontWeight: 500, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                    {homework.description || homework.title}
                  </Typography>
                </Box>

                {homeworkFiles.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {homeworkFiles.map((file, index) => (
                      <Button
                        key={`${file}-${index}`}
                        variant="outlined"
                        size="small"
                        startIcon={<AttachFileIcon sx={{ fontSize: 16 }} />}
                        onClick={() => window.open(getHomeworkFileUrl(file), '_blank', 'noopener,noreferrer')}
                        sx={{
                          alignSelf: 'flex-start',
                          textTransform: 'none',
                          color: '#c5a059',
                          borderColor: '#c5a059',
                          fontWeight: 600,
                          maxWidth: '100%',
                          '&:hover': { borderColor: '#e68a00', color: '#e68a00', backgroundColor: '#fffaf5' },
                        }}
                      >
                        {getHomeworkFileName(file)}
                      </Button>
                    ))}
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Typography sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' }, color: '#333', fontWeight: 500, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                    {homework.created_at ? formatDateTime(homework.created_at) : ''}
                  </Typography>
                </Box>
              </Paper>

              {/* Card 2: Submission input block / Edit block / submitted response card */}
              {statusKey === 'NOT_DONE' && !isEditing ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 0,
                    borderRadius: 0,
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <Box sx={{
                    position: 'relative',
                    backgroundColor: '#ffffff',
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 1.25, sm: 1.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                  }}>
                    <TextField
                      multiline
                      minRows={1}
                      maxRows={4}
                      fullWidth
                      variant="standard"
                      disabled={submitting}
                      placeholder="Fayl yig'ish va izoh qo'lga"
                      value={submitText}
                      onChange={(e) => setSubmitText(e.target.value.slice(0, 1000))}
                      InputProps={{ disableUnderline: true }}
                      sx={{
                        '& .MuiInput-root:before, & .MuiInput-root:after': {
                          display: 'none',
                        },
                        '& .MuiInput-root:hover:not(.Mui-disabled):before': {
                          borderBottom: '0',
                        },
                        '& .MuiInputBase-root': {
                          alignItems: 'flex-start',
                        },
                        '& .MuiInputBase-input': {
                          fontSize: { xs: '0.95rem', sm: '1rem' },
                          color: '#333',
                          fontWeight: 500,
                          py: 0.5,
                          lineHeight: 1.4,
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#8b8b8b',
                          opacity: 0.85,
                        }
                      }}
                    />
                    {selectedFiles.length > 0 && (
                      <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>
                        Tanlangan fayllar: {selectedFiles.length}
                      </Typography>
                    )}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}>
                      <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 500 }}>
                        {submitText.length} / 1000
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                        <Tooltip title="Fayl yuklash">
                          <IconButton
                            component="label"
                            sx={{
                              p: 0.5,
                              color: '#70757a',
                              '&:hover': { color: '#333' },
                            }}
                          >
                            <AttachFileIcon sx={{ fontSize: 16 }} />
                            <input
                              hidden
                              multiple
                              type="file"
                              onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                            />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          onClick={handleSendHomework}
                          disabled={(!submitText.trim() && selectedFiles.length === 0) || submitting}
                          sx={{
                            p: 0.5,
                            color: '#70757a',
                            '&:hover': { color: '#333', backgroundColor: 'transparent' },
                            '&.Mui-disabled': { color: '#b4b4b4' },
                          }}
                        >
                          {submitting ? <CircularProgress size={14} sx={{ color: '#70757a' }} /> : <SendIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              ) : isEditing ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                >
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#2d3748', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                    Vazifani tahrirlash
                  </Typography>
                  <Box sx={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    backgroundColor: '#fafafa',
                    p: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}>
                    <TextField
                      multiline
                      rows={3}
                      fullWidth
                      variant="standard"
                      disabled={submitting}
                      placeholder="Havola (link) yoki vazifa izohini qoldiring..."
                      value={submitText}
                      onChange={(e) => setSubmitText(e.target.value.slice(0, 1000))}
                      InputProps={{ disableUnderline: true }}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem', color: '#2d3748' } }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
                      <Button size="small" variant="text" disabled={submitting} onClick={() => setIsEditing(false)} sx={{ color: '#6b7280', textTransform: 'none', fontWeight: 600 }}>
                        Bekor qilish
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={handleSaveEdit}
                        disabled={!submitText.trim() || submitting}
                        sx={{
                          backgroundColor: '#ff9800',
                          color: '#fff',
                          textTransform: 'none',
                          fontWeight: 700,
                          boxShadow: 'none',
                          '&:hover': { backgroundColor: '#e68a00', boxShadow: 'none' }
                        }}
                      >
                        {submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Saqlash'}
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    px: { xs: 2.5, sm: 4 },
                    py: { xs: 3, sm: 4 },
                    borderRadius: '2px',
                    border: 'none',
                    backgroundColor: '#f8f3ef',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: { xs: 2, sm: 2.5 }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: { xs: '0.95rem', sm: '1rem' }, fontWeight: 500, color: '#333', whiteSpace: 'nowrap', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                      Mening jo'natmalarim
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                      <Typography sx={{ fontSize: { xs: '0.9rem', sm: '0.95rem' }, color: '#333', fontWeight: 500, whiteSpace: 'nowrap', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                        Fayllar soni: {answer.file ? JSON.parse(answer.file || '[]').length : 0}
                      </Typography>
                      {statusKey === 'PENDING' && (
                        <IconButton size="small" onClick={handleStartEdit} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                          <EditIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  <Typography sx={{ fontSize: { xs: '0.9rem', sm: '0.95rem' }, color: '#333', fontWeight: 500, lineHeight: 1.5, wordBreak: 'break-word', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                    {answer.title}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Typography sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' }, color: '#333', fontWeight: 500, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                      {formatDateTime(answer.updated_at || answer.created_at)}
                    </Typography>
                  </Box>
                </Paper>
              )}

              {/* Card 3: O'qituvchi izohi response */}
              {teacherComment && (
                <Paper
                  elevation={0}
                  sx={{
                    px: { xs: 2.5, sm: 4 },
                    py: { xs: 3, sm: 4 },
                    borderRadius: '2px',
                    border: 'none',
                    backgroundColor: '#f8f3ef',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: { xs: 2, sm: 2.5 }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontSize: { xs: '0.95rem', sm: '1rem' }, fontWeight: 500, color: '#333', whiteSpace: 'nowrap', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                      O'qituvchi izohi
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '0.9rem', sm: '0.95rem' }, color: statusKey === 'ACCEPTED' ? '#078600' : '#ef4444', fontWeight: 500, whiteSpace: 'nowrap', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                      {statusKey === 'ACCEPTED' ? 'Vazifa qabul qilindi' : 'Vazifa qaytarildi'}
                    </Typography>
                  </Box>

                  {teacherComment.title && (
                    <Box sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.65,
                      backgroundColor: '#fff9e6',
                      color: '#b25e00',
                      px: { xs: 1, sm: 1.25 },
                      py: { xs: 0.65, sm: 0.75 },
                      borderRadius: '6px',
                      alignSelf: 'flex-start',
                    }}>
                      <WarningIcon sx={{ fontSize: 16, color: '#ff9800', flexShrink: 0 }} />
                      <Typography sx={{ fontSize: { xs: '0.68rem', sm: '0.74rem' }, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                        {teacherComment.title}
                      </Typography>
                    </Box>
                  )}

                  <Typography sx={{ fontSize: { xs: '0.9rem', sm: '0.95rem' }, color: '#333', fontWeight: 500, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                    Tekshiruvchi: {teacherComment.teachers?.full_name || teacherComment.users?.full_name || 'O\'qituvchi'}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Typography sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' }, color: '#333', fontWeight: 500, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                      {teacherComment.created_at ? formatDateTime(teacherComment.created_at) : ''}
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Box>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff'
              }}
            >
              <Typography sx={{ color: '#9ca3af', fontWeight: 600, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                Uyga vazifa berilmagan
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Right side: Lesson accordion — production peach card style */}
        <Box sx={{
          width: { xs: '100%', lg: 340 },
          flexShrink: 0,
          height: '100%',
          backgroundColor: '#ffffff',
          overflowY: 'auto',
          p: { xs: 2, lg: 2.5 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#c5a059', borderRadius: '8px' },
        }}>
          {lessons.map((lesson) => {
            const isActive = lesson.id === activeLessonId;
            const hasVideos = lesson.videos?.length > 0;
            const isExpanded = expandedLessonId === lesson.id;
            const isOpen = isActive && hasVideos && isExpanded;

            return (
              <Box
                key={lesson.id}
                sx={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  backgroundColor: isOpen ? '#ebc9a4' : '#f9f5f1',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <Box
                  onClick={() => {
                    if (lesson.id === activeLessonId && hasVideos) {
                      setExpandedLessonId(isExpanded ? null : lesson.id);
                      return;
                    }
                    selectLesson(lesson);
                  }}
                  sx={{
                    px: 2.25,
                    py: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: '#1a1a1a',
                      lineHeight: 1.4,
                      mb: 0.75,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {lesson.topic || lesson.description}
                    </Typography>
                    <Typography sx={{
                      fontSize: '0.8rem',
                      color: '#3d3d3d',
                      fontWeight: 500,
                      lineHeight: 1.3,
                    }}>
                      Dars sanasi: {formatLessonDate(lesson.date)}
                    </Typography>
                  </Box>
                  {hasVideos && (
                    <ExpandMoreIcon sx={{
                      color: '#2d2d2d',
                      fontSize: 24,
                      mt: 0.1,
                      flexShrink: 0,
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }} />
                  )}
                </Box>

                {isOpen && (
                  <Box sx={{
                    px: 1.75,
                    pb: 1.75,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}>
                    {lesson.videos.map((video, idx) => {
                      const isVideoActive =
                        isActive && (activeVideos[lesson.id] ?? lesson.videos[0]?.id) === video.id;
                      return (
                        <Box
                          key={video.id}
                          onClick={(e) => selectVideo(lesson.id, video.id, e)}
                          sx={{
                            px: 1.75,
                            py: 1.35,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            backgroundColor: isVideoActive ? '#f2d4b8' : '#efd2ae',
                            transition: 'background-color 0.15s ease',
                            '&:hover': { backgroundColor: isVideoActive ? '#edd0b0' : '#e8c89e' },
                          }}
                        >
                          <Box sx={{ color: '#1a1a1a', display: 'flex', flexShrink: 0 }}>
                            {isVideoActive
                              ? <PlayCircleFilledWhiteOutlinedIcon sx={{ fontSize: 20 }} />
                              : <PanoramaFishEyeIcon sx={{ fontSize: 20 }} />}
                          </Box>
                          <Typography sx={{
                            fontSize: '0.86rem',
                            color: '#1a1a1a',
                            fontWeight: isVideoActive ? 700 : 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.3,
                          }}>
                            {idx + 1}-video: {video.title}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

      </Box>
    </Box>
  );
}
