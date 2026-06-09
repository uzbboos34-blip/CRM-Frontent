import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, IconButton, Button,
  TextField, Tooltip, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import api from '../api/axios';

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

export default function StudentLessonDetail() {
  const { groupId, lessonId } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedLessons, setExpandedLessons] = useState({});
  const [activeVideos, setActiveVideos] = useState({}); // lessonId -> videoId mapping
  const [submitText, setSubmitText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Fetch all lessons of group
  const fetchGroupLessons = () => {
    return api.get(`/api/v1/students/my/groups/${groupId}/lessons`)
      .then(res => {
        const data = res.data?.data || [];
        setLessons(data);
        
        // Auto expand active lesson and default to first video if any
        const exp = {};
        const activeVids = { ...activeVideos };
        data.forEach(l => {
          if (l.id === Number(lessonId)) {
            exp[l.id] = true;
          }
          if (l.videos?.length > 0 && !activeVids[l.id]) {
            activeVids[l.id] = l.videos[0].id;
          }
        });
        setExpandedLessons(prev => ({ ...prev, ...exp }));
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

  const activeLessonId = Number(lessonId);
  const activeLesson = lessons.find(l => l.id === activeLessonId);

  // Toggle expanded lesson card
  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpandedLessons(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Navigates to selected lesson URL
  const selectLesson = (lesson) => {
    setSubmitText('');
    setIsEditing(false);
    navigate(`/student/groups/${groupId}/lessons/${lesson.id}`);
  };

  // Select video and update URL / Active state
  const selectVideo = (lessonId, videoId, e) => {
    e.stopPropagation();
    setActiveVideos(prev => ({ ...prev, [lessonId]: videoId }));
    if (lessonId !== activeLessonId) {
      navigate(`/student/groups/${groupId}/lessons/${lessonId}`);
    }
  };

  // Submit Homework to backend
  const handleSendHomework = () => {
    const homework = activeLesson?.homeWorks?.[0];
    if (!homework || !submitText.trim()) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append('comment', submitText);

    api.post(`/api/v1/home-works/${homework.id}/submit`, formData)
      .then(() => {
        setSubmitText('');
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
  const answer = homework?.homeWorkAnswers?.[0];
  const statusKey = homework ? (answer ? answer.homeworkStatus : 'NOT_DONE') : 'NONE';
  const score = answer?.homeWorkResults?.[0]?.grade || 0;
  const teacherComment = answer?.homeWorkResults?.[0];

  // Extract selected video
  const activeVideoId = activeVideos[activeLesson.id];
  const activeVideo = activeLesson.videos?.find(v => v.id === activeVideoId);

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out', p: { xs: 1, md: 3 } }}>
      {/* Back button and page title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <IconButton
          size="small"
          onClick={() => navigate(`/student/groups/${groupId}/lessons`)}
          sx={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            '&:hover': { backgroundColor: '#f3f4f6' },
            borderRadius: '8px',
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 18, color: '#374151' }} />
        </IconButton>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#2d3748' }}>
          Darslar va Uy vazifalari
        </Typography>
      </Box>

      {/* Main split grid */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 3,
        alignItems: 'stretch'
      }}>
        
        {/* Left column (Player + Title + Vazifalar card) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {/* Custom Video Player */}
          <Box sx={{
            width: '100%',
            height: { xs: 220, sm: 360, md: 400 },
            backgroundColor: activeVideo ? '#0f172a' : '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: activeVideo ? 'none' : '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            {activeVideo ? (
              <Box sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              }}>
                <Box sx={{
                  opacity: 0.08,
                  position: 'absolute',
                  width: '80%',
                  height: '80%',
                  backgroundImage: 'radial-gradient(circle, #c5a059 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }} />
                
                <Typography sx={{
                  position: 'absolute',
                  color: 'rgba(255,255,255,0.03)',
                  fontWeight: 900,
                  fontSize: { xs: '3rem', sm: '5rem' },
                  letterSpacing: 2,
                  userSelect: 'none'
                }}>
                  NAJOT TA'LIM
                </Typography>

                {/* Simulated center Play button */}
                <Box 
                  onClick={() => {
                    // Simulating playing file path
                    if (activeVideo.video_url) {
                      window.open(activeVideo.video_url.startsWith('http') ? activeVideo.video_url : `https://supabase.co/storage/v1/object/public/NajotEdu/${activeVideo.video_url}`, '_blank');
                    }
                  }}
                  sx={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    backgroundColor: '#ff9800',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#e68a00',
                      transform: 'scale(1.08)',
                    },
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 8px 25px rgba(255, 152, 0, 0.4)',
                    zIndex: 2,
                  }}
                >
                  <PlayArrowIcon sx={{ fontSize: 40, ml: 0.5 }} />
                </Box>

                {/* Player Bottom Bar */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 1.5,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  zIndex: 2,
                }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', fontWeight: 600 }}>
                    {activeVideo.title}
                  </Typography>
                  <Typography sx={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
                    {activeVideo.created_at ? new Date(activeVideo.created_at).toLocaleDateString('uz-UZ') : ''}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                p: 4,
                textAlign: 'center'
              }}>
                <Box sx={{
                  width: 90,
                  height: 90,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.7
                }}>
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40 5L15 25L40 45L65 25L40 5Z" stroke="#c5a059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22.5 31L15 37L40 57L65 37L57.5 31" stroke="#c5a059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M30 49L40 57L50 49" stroke="#c5a059" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Box>
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#4b5563' }}>
                  Video mavzu emas
                </Typography>
              </Box>
            )}
          </Box>

          {/* Active Lesson Title display */}
          <Paper elevation={0} sx={{
            p: 2.5,
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff'
          }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#2d3748' }}>
              {activeLesson.topic || activeLesson.description} {activeVideo ? `(${activeVideo.title})` : ''}
            </Typography>
          </Paper>

          {/* Vazifalar detail cards */}
          <Paper elevation={0} sx={{
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            overflow: 'hidden'
          }}>
            {/* Tabs bar */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f3f4f6',
              px: 3,
              py: 2
            }}>
              <Box sx={{ borderBottom: '2.5px solid #c5a059', pb: 1.5, mt: 1.5 }}>
                <Typography sx={{ fontWeight: 700, color: '#c5a059', fontSize: '0.92rem' }}>
                  Vazifalar
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.9rem' }}>
                To'p: {score}
              </Typography>
            </Box>

            {/* Main content body */}
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              {homework ? (
                <>
                  {/* Uyga vazifa description */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#2d3748' }}>
                        Uyga vazifa
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>
                        Fayllar soni: {homework.file ? 1 : 0}
                      </Typography>
                    </Box>

                    {/* Deadline/creation status */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      backgroundColor: '#fff9e6',
                      border: '1px solid #ffeeba',
                      color: '#b25e00',
                      p: 2,
                      borderRadius: '10px',
                      mb: 2.5
                    }}>
                      <WarningIcon sx={{ fontSize: 20, color: '#ff9800' }} />
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>
                        Uyga vazifa berildi: {formatDateTime(homework.created_at)}
                      </Typography>
                    </Box>

                    {/* HW details description */}
                    <Box sx={{ mb: 2 }}>
                      <Typography sx={{ fontSize: '0.92rem', color: '#4a5568', lineHeight: 1.6, fontWeight: 500 }}>
                        {homework.description || homework.title}
                      </Typography>
                    </Box>

                    {homework.file && (
                      <Box sx={{ mb: 2 }}>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => window.open(homework.file.startsWith('http') ? homework.file : `https://supabase.co/storage/v1/object/public/NajotEdu/${homework.file}`, '_blank')}
                          sx={{ textTransform: 'none', color: '#c5a059', borderColor: '#c5a059', '&:hover': { borderColor: '#e68a00', color: '#e68a00' } }}
                        >
                          Biriktirilgan fayl
                        </Button>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>
                        {homework.created_at ? new Date(homework.created_at).toLocaleDateString('uz-UZ') : ''}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ borderBottom: '1px dashed #e2e8f0' }} />

                  {/* Submission input block */}
                  {statusKey === 'NOT_DONE' && !isEditing ? (
                    <Box>
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#2d3748', mb: 1.5 }}>
                        Vazifa yuklash
                      </Typography>
                      <Box sx={{
                        position: 'relative',
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
                          onChange={(e) => setSubmitText(e.target.value)}
                          InputProps={{ disableUnderline: true }}
                          sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem', color: '#2d3748' } }}
                        />
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mt: 1
                        }}>
                          <Tooltip title="Fayl yuklash">
                            <IconButton size="small" sx={{ color: '#9ca3af', '&:hover': { color: '#4a5568' } }}>
                              <AttachFileIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Tooltip>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>
                              {submitText.length} / 1000
                            </Typography>
                            <IconButton 
                              onClick={handleSendHomework}
                              disabled={!submitText.trim() || submitting}
                              sx={{
                                backgroundColor: submitText.trim() ? '#ff9800' : 'rgba(0,0,0,0.04)',
                                color: '#ffffff',
                                '&:hover': { backgroundColor: '#e68a00' },
                                '&.Mui-disabled': { color: '#9ca3af' },
                                width: 34, height: 34,
                              }}
                            >
                              {submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SendIcon sx={{ fontSize: 16 }} />}
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ) : isEditing ? (
                    <Box>
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#2d3748', mb: 1.5 }}>
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
                          onChange={(e) => setSubmitText(e.target.value)}
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
                    </Box>
                  ) : (
                    // Submission review card
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#2d3748' }}>
                            Mening jo'natmalarim
                          </Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600, mt: 0.2 }}>
                            Fayllar soni: {answer.file ? JSON.parse(answer.file || '[]').length : 0}
                          </Typography>
                        </Box>
                        {statusKey === 'PENDING' && (
                          <IconButton size="small" onClick={handleStartEdit} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <EditIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                          </IconButton>
                        )}
                      </Box>

                      {/* Submitted response text */}
                      <Box sx={{
                        p: 2,
                        borderRadius: '10px',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #f3f4f6',
                        mb: 1.5
                      }}>
                        <Typography sx={{ fontSize: '0.9rem', color: '#2563eb', fontWeight: 600, wordBreak: 'break-all' }}>
                          {answer.title}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>
                          {formatDateTime(answer.updated_at || answer.created_at)}
                        </Typography>
                      </Box>

                      {/* Teacher's comment response */}
                      {teacherComment && (
                        <>
                          <Box sx={{ borderBottom: '1px dashed #e2e8f0', my: 2.5 }} />
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#2d3748' }}>
                                O'qituvchi izohi
                              </Typography>
                              <Typography sx={{ fontSize: '0.85rem', color: statusKey === 'ACCEPTED' ? '#16a34a' : '#ef4444', fontWeight: 800 }}>
                                {statusKey === 'ACCEPTED' ? 'Vazifa qabul qilindi' : 'Vazifa qaytarildi'}
                              </Typography>
                            </Box>

                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              backgroundColor: '#fff9e6',
                              border: '1px solid #ffeeba',
                              color: '#b25e00',
                              p: 2,
                              borderRadius: '10px'
                            }}>
                              <WarningIcon sx={{ fontSize: 20, color: '#ff9800' }} />
                              <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>
                                {teacherComment.title}
                              </Typography>
                            </Box>
                          </Box>
                        </>
                      )}
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: '#9ca3af' }}>
                  <Typography sx={{ fontWeight: 600 }}>Uyga vazifa berilmagan</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Right side: Sidebar List of Lessons */}
        <Box sx={{
          width: { xs: '100%', lg: 360 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5
        }}>
          {lessons.map((lesson) => {
            const isActive = lesson.id === activeLessonId;
            const hasVideos = lesson.videos?.length > 0;
            const isExpanded = !!expandedLessons[lesson.id];

            return (
              <Box key={lesson.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                {/* Individual Lesson Card */}
                <Paper
                  onClick={() => selectLesson(lesson)}
                  elevation={0}
                  sx={{
                    p: 2.2,
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: isActive ? '#faede0' : '#ffffff',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': {
                      backgroundColor: isActive ? '#f8e7d8' : '#f9fafb',
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}
                >
                  {isActive && (
                    <Box sx={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: 5,
                      backgroundColor: '#c5a059',
                      borderTopRightRadius: '12px',
                      borderBottomRightRadius: '12px',
                    }} />
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pr: isActive ? 1.5 : 0 }}>
                    <Typography sx={{
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 700 : 500,
                      color: '#2d3748', // Darker crisp text
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontFamily: "'Inter', 'Outfit', sans-serif"
                    }}>
                      {lesson.topic || lesson.description}
                    </Typography>
                    
                    {hasVideos && (
                      <IconButton
                        size="small"
                        onClick={(e) => toggleExpand(lesson.id, e)}
                        sx={{ p: 0.2, ml: 1, flexShrink: 0, color: '#9ca3af' }}
                      >
                        {isExpanded ? <ExpandLessIcon sx={{ fontSize: 20 }} /> : <ExpandMoreIcon sx={{ fontSize: 20 }} />}
                      </IconButton>
                    )}
                  </Box>

                  <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>
                    Dars sanasi: {lesson.date ? new Date(lesson.date).toLocaleDateString('uz-UZ') : '—'}
                  </Typography>
                </Paper>

                {/* Dropdown list of videos */}
                {hasVideos && isExpanded && (
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.8,
                    pl: 1.5,
                    borderLeft: '1px dashed #e2e8f0',
                    ml: 1.5,
                    animation: 'slideDown 0.2s ease-out',
                    '@keyframes slideDown': {
                      from: { opacity: 0, transform: 'translateY(-8px)' },
                      to: { opacity: 1, transform: 'translateY(0)' }
                    }
                  }}>
                    {lesson.videos.map((video, idx) => {
                      const isVideoActive = activeVideos[lesson.id] === video.id;
                      return (
                        <Paper
                          key={video.id}
                          onClick={(e) => selectVideo(lesson.id, video.id, e)}
                          elevation={0}
                          sx={{
                            p: 1.5,
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: isVideoActive ? '#f6e3cf' : '#ffffff',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: isVideoActive ? '#f4dbbe' : '#f9fafb'
                            },
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.2,
                            transition: 'all 0.12s'
                          }}
                        >
                          <PlayCircleOutlinedIcon sx={{ fontSize: 20, color: '#c5a059', flexShrink: 0 }} />
                          <Typography sx={{
                            fontSize: '0.83rem',
                            fontWeight: isVideoActive ? 700 : 500,
                            color: '#2d3748',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontFamily: "'Inter', 'Outfit', sans-serif"
                          }}>
                            {idx + 1}-video: {video.title}
                          </Typography>
                        </Paper>
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
