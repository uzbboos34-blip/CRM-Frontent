import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, IconButton, Button,
  TextField, Tooltip, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails,
  List, ListItem
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
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import PlayCircleFilledWhiteOutlinedIcon from '@mui/icons-material/PlayCircleFilledWhiteOutlined';
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';
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

function formatDeadlineDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month}, ${year} ${hh}:${mm}`;
}

function formatLessonDate(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parts[2].padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[monthIndex];
    if (month) {
      return `${day} ${month}, ${year}`;
    }
  }
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
    <Box sx={{
      animation: 'fadeIn 0.3s ease-out',
      p: 0, // No padding on the edges!
      height: '100%', // Full height of parent container
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
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
          p: 3, // Padded inside the scrollable area
          borderRight: { lg: '2.5px solid #c5a059' },
          height: '100%',
          overflowY: 'auto',
          pb: 4,
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '4px' }
        }}>
          
          {/* Custom Video Player Container */}
          <Box sx={{
            width: '100%',
            aspectRatio: '16/9',
            backgroundColor: '#000000', // Solid black background for the video box!
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0, // No padding, video takes full container width!
          }}>
            {activeVideo ? (
              activeVideo.video_url?.includes('embed') || activeVideo.video_url?.includes('kinescope') ? (
                <iframe
                  src={activeVideo.video_url}
                  height="100%"
                  width="100%"
                  allow="autoplay; fullscreen; encrypted-media;"
                  style={{
                    border: 'none',
                    width: '100%',
                    height: '100%',
                    borderRadius: '12px',
                  }}
                  className="player__iframe"
                />
              ) : (
                <video
                  src={activeVideo.video_url?.startsWith('http') ? activeVideo.video_url : `https://mcjypffxtuoqfttoapjh.supabase.co/storage/v1/object/public/NajotEdu/${activeVideo.video_url}`}
                  controls
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#000000',
                    borderRadius: '12px',
                    display: 'block'
                  }}
                />
              )
            ) : (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2.5,
                py: 6,
                px: 4,
                textAlign: 'center'
              }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.95
                }}>
                  <svg width="150" height="150" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40 5L15 25L40 45L65 25L40 5Z" stroke="#c5a059" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22.5 31L15 37L40 57L65 37L57.5 31" stroke="#c5a059" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M30 49L40 57L50 49" stroke="#c5a059" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Box>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#2d3748', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                  Video mavzu emas
                </Typography>
              </Box>
            )}
          </Box>

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
                  p: 3,
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#2d3748', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                    Uyga vazifa
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                    Fayllar soni: {homework.file ? 1 : 0}
                  </Typography>
                </Box>

                {/* Deadline/creation status */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  backgroundColor: '#ff3b30', // Bright red background!
                  color: '#ffffff', // White text!
                  p: 2,
                  borderRadius: '8px',
                }}>
                  <ErrorIcon sx={{ fontSize: 20, color: '#ffffff' }} />
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                    Uyga vazifa muddati: {homework.deadline ? formatDeadlineDate(homework.deadline) : formatDeadlineDate(homework.created_at)}
                  </Typography>
                </Box>

                {/* HW details description */}
                <Box>
                  <Typography sx={{ fontSize: '0.92rem', color: '#4a5568', lineHeight: 1.6, fontWeight: 500, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                    {homework.description || homework.title}
                  </Typography>
                </Box>

                {homework.file && (
                  <Box>
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
                  <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                    {homework.created_at ? formatDateTime(homework.created_at) : ''}
                  </Typography>
                </Box>
              </Paper>

              {/* Card 2: Submission input block / Edit block / submitted response card */}
              {statusKey === 'NOT_DONE' && !isEditing ? (
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
                </Paper>
              ) : (
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#2d3748', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                        Mening jo'natmalarim
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
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
                  }}>
                    <Typography sx={{ fontSize: '0.9rem', color: '#2563eb', fontWeight: 600, wordBreak: 'break-all', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                      {answer.title}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
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
                    p: 3,
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#2d3748', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                      O'qituvchi izohi
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: statusKey === 'ACCEPTED' ? '#16a34a' : '#ef4444', fontWeight: 800, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                      {statusKey === 'ACCEPTED' ? 'Vazifa qabul qilindi' : 'Vazifa qaytarildi'}
                    </Typography>
                  </Box>

                  {/* Grading deduction delay warning banner */}
                  {teacherComment.title && (
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
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                        {teacherComment.title}
                      </Typography>
                    </Box>
                  )}

                  {/* Checker teacher details */}
                  <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    <Typography sx={{ fontSize: '0.88rem', color: '#4a5568', fontWeight: 600, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                      Tekshiruvchi: {teacherComment.teachers?.full_name || teacherComment.users?.full_name || 'O\'qituvchi'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
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

        {/* Right side: Sidebar List of Lessons */}
        <Accordion
          defaultExpanded
          elevation={0}
          sx={{
            width: { xs: '100%', lg: 360 },
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: '#ffffff',
            borderRadius: 0,
            overflowY: 'hidden',
            border: 'none',
            '&:before': { display: 'none' }, // Remove default divider
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#4b5563', fontSize: 24 }} />}
            sx={{
              flexShrink: 0,
              px: 3,
              py: 2,
              borderBottom: '1.5px solid #e2e8f0',
              '& .MuiAccordionSummary-content': { m: 0 }
            }}
          >
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#1a202c', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
              Mavzular
            </Typography>
          </AccordionSummary>
          
          <AccordionDetails 
            sx={{ 
              p: 0, 
              flexGrow: 1, 
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '4px' }
            }}
          >
            {lessons.map((lesson) => {
              const isActive = lesson.id === activeLessonId;
              const hasVideos = lesson.videos?.length > 0;
              const isExpanded = !!expandedLessons[lesson.id];

              if (!hasVideos) {
                return (
                  <Box
                    key={lesson.id}
                    onClick={() => selectLesson(lesson)}
                    sx={{
                      px: 3,
                      py: 2.2,
                      borderBottom: '1.5px solid #e2e8f0',
                      backgroundColor: isActive ? '#faede0' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out',
                      '&:hover': {
                        backgroundColor: isActive ? '#f3e2d1' : '#f9fafb',
                      }
                    }}
                  >
                    <Typography sx={{
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 700 : 600,
                      color: '#2d3748',
                      lineHeight: 1.4,
                      fontFamily: "'Inter', 'Outfit', sans-serif",
                      mb: 0.5
                    }}>
                      {lesson.topic || lesson.description}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 700, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                      Dars sanasi: {formatLessonDate(lesson.date)}
                    </Typography>
                  </Box>
                );
              }

              return (
                <Accordion
                  key={lesson.id}
                  expanded={isExpanded}
                  onChange={() => {
                    selectLesson(lesson);
                    setExpandedLessons(prev => ({ ...prev, [lesson.id]: !prev[lesson.id] }));
                  }}
                  elevation={0}
                  sx={{
                    backgroundColor: isActive ? '#faede0' : '#ffffff',
                    borderBottom: '1.5px solid #e2e8f0',
                    '&:before': { display: 'none' }, // Remove default divider
                    borderRadius: 0,
                    margin: '0 !important' // Override default MUI margin expansion
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: '#4b5563', fontSize: 22 }} />}
                    sx={{
                      px: 3,
                      py: 1.5,
                      backgroundColor: isActive ? '#faede0' : '#ffffff',
                      '&:hover': {
                        backgroundColor: isActive ? '#f3e2d1' : '#f9fafb',
                      },
                      '& .MuiAccordionSummary-content': { m: 0 }
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography sx={{
                        fontSize: '0.9rem',
                        fontWeight: isActive ? 700 : 600,
                        color: '#2d3748',
                        lineHeight: 1.4,
                        fontFamily: "'Inter', 'Outfit', sans-serif"
                      }}>
                        {lesson.topic || lesson.description}
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: isActive ? '#6b7280' : '#9ca3af', fontWeight: 700, fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                        Dars sanasi: {formatLessonDate(lesson.date)}
                      </Typography>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: 0, backgroundColor: '#ffffff' }}>
                    <List sx={{ p: 0 }}>
                      {lesson.videos.map((video, idx) => {
                        const isVideoActive = activeVideos[lesson.id] === video.id;
                        return (
                          <ListItem
                            key={video.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              selectVideo(lesson.id, video.id, e);
                            }}
                            sx={{
                              px: 4,
                              py: 1.8,
                              cursor: 'pointer',
                              backgroundColor: isVideoActive ? '#faede0' : '#ffffff',
                              borderBottom: idx === lesson.videos.length - 1 ? 'none' : '1px solid #f3f4f6',
                              '&:hover': {
                                backgroundColor: isVideoActive ? '#f3e2d1' : '#f9fafb',
                              },
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              transition: 'background-color 0.15s ease'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', color: '#c5a059' }}>
                              {isVideoActive ? (
                                <PlayCircleFilledWhiteOutlinedIcon sx={{ fontSize: 20 }} />
                              ) : (
                                <PanoramaFishEyeIcon sx={{ fontSize: 20 }} />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a202c', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                                {idx + 1}-video:
                              </Typography>
                              <Typography sx={{
                                fontSize: '0.85rem',
                                color: '#4a5568',
                                fontFamily: "'Inter', 'Outfit', sans-serif",
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {video.title}
                              </Typography>
                            </Box>
                          </ListItem>
                        );
                      })}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </AccordionDetails>
        </Accordion>

      </Box>
    </Box>
  );
}
