import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, IconButton, Button,
  TextField, Tooltip
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

const MOCK_LESSONS = [
  {
    id: 1,
    topic: "crm talaba paneli frontend uy vazifasi, darslar, videolar",
    date: "09 Jun, 2026",
    state: "bajarilmagan", // bajarilmagan, kutayotgan, qabul_qilingan
    videos: [],
    homework: {
      description: "student panelni frontendini to'lliq qilib kelish",
      deadline: "10 iyun, 2026 yil 03:52",
      isOverdue: false,
      filesCount: 0,
      date: "2026-yil 9-iyun, soat 11:52",
      submitted: null,
      score: 0
    }
  },
  {
    id: 2,
    topic: "amaliyot",
    date: "08 Jun, 2026",
    state: "bajarilmagan",
    videos: [],
    homework: {
      description: "Amaliyot darsida o'tilgan mavzular bo'yicha mustaqil topshiriqlarni yakunlash.",
      deadline: "09 iyun, 2026 yil 00:00",
      isOverdue: true,
      filesCount: 0,
      date: "2026-yil 8-iyun, soat 10:00",
      submitted: null,
      score: 0
    }
  },
  {
    id: 3,
    topic: "crm talabalar paneli, uy vazifasi, darslar, videolar",
    date: "08 Jun, 2026",
    state: "kutayotgan",
    videos: [
      { id: 101, name: "117.2.mov", duration: "18:50", date: "13 Nov, 2025" },
      { id: 102, name: "117.1.mov", duration: "12:35", date: "12 Nov, 2025" }
    ],
    homework: {
      description: "darsda qilingan joyigacha qilib kelish",
      deadline: "09 iyun, 2026 yil 05:35",
      isOverdue: true,
      filesCount: 0,
      date: "2026-yil 8-iyun, soat 13:35",
      submitted: {
        text: "https://7-oy-xuep.vercel.app/login",
        filesCount: 0,
        date: "2026-yil 8-iyun, soat 13:35"
      },
      score: 0
    }
  },
  {
    id: 4,
    topic: "CRM talabalar paneli",
    date: "05 Jun, 2026",
    state: "bajarilmagan",
    videos: [],
    homework: null
  },
  {
    id: 5,
    topic: "Amaliyot",
    date: "05 Jun, 2026",
    state: "bajarilmagan",
    videos: [],
    homework: null
  },
  {
    id: 6,
    topic: "Next.js amaliyot | marshrutizatsiya",
    date: "04 Jun, 2026",
    state: "bajarilmagan",
    videos: [],
    homework: null
  },
  {
    id: 7,
    topic: "CRM Davom eting O'qituvchilar paneli",
    date: "04 Jun, 2026",
    state: "qabul_qilingan",
    videos: [
      { id: 201, name: "107.2.mov", duration: "21:13", date: "17 Nov, 2025" }
    ],
    homework: {
      description: "Homework uchun qilish backend",
      deadline: "15 May, 2026 07:10",
      isOverdue: true,
      filesCount: 0,
      date: "2026-yil 14-may, soat 15:10",
      submitted: {
        text: "https://7-oy-xuep.vercel.app/login",
        filesCount: 0,
        date: "2026-yil 15-may, soat 11:00"
      },
      teacherComment: {
        text: "Vazifa qabul qilindi",
        warning: "Kechikib topshirilgani uchun qo'yilgan 88 ball 5% ga kamaytirildi."
      },
      score: 88
    }
  },
  {
    id: 8,
    topic: "Next.js + Prisma",
    date: "03 Jun, 2026",
    state: "bajarilmagan",
    videos: [],
    homework: null
  }
];

export default function StudentLessonDetail() {
  const { groupId, lessonId } = useParams();
  const navigate = useNavigate();

  // Local state for interactive mockup lessons list
  const [lessons, setLessons] = useState(MOCK_LESSONS);
  const [expandedLessons, setExpandedLessons] = useState({ 3: true, 7: true });
  
  // Selected video within each lesson
  const [activeVideos, setActiveVideos] = useState({
    3: 101, // default selected video id for lesson 3
    7: 201  // default selected video id for lesson 7
  });

  // Homework submission input state
  const [submitText, setSubmitText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Active lesson defined by URL
  const activeLessonId = Number(lessonId) || 1;
  const activeLesson = lessons.find(l => l.id === activeLessonId) || lessons[0];
  const activeVideoId = activeVideos[activeLesson.id];
  const activeVideo = activeLesson.videos?.find(v => v.id === activeVideoId);

  // Toggle dropdown / expand card
  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpandedLessons(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Select lesson (Navigates to update URL)
  const selectLesson = (lesson) => {
    setSubmitText('');
    setIsEditing(false);
    navigate(`/student/groups/${groupId}/lessons/${lesson.id}`);
  };

  // Select video
  const selectVideo = (lessonId, videoId, e) => {
    e.stopPropagation();
    setActiveVideos(prev => ({ ...prev, [lessonId]: videoId }));
    navigate(`/student/groups/${groupId}/lessons/${lessonId}`);
  };

  // Submit Homework (Interactive feature!)
  const handleSendHomework = () => {
    if (!submitText.trim()) return;

    setLessons(prev => prev.map(l => {
      if (l.id === activeLesson.id) {
        return {
          ...l,
          state: 'kutayotgan',
          homework: {
            ...l.homework,
            submitted: {
              text: submitText,
              filesCount: 0,
              date: `2026-yil 9-iyun, soat ${new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`
            }
          }
        };
      }
      return l;
    }));
    setIsEditing(false);
    setSubmitText('');
  };

  // Edit Submission (Interactive feature!)
  const handleStartEdit = () => {
    if (activeLesson.homework?.submitted) {
      setSubmitText(activeLesson.homework.submitted.text);
      setIsEditing(true);
    }
  };

  // Save edit
  const handleSaveEdit = () => {
    if (!submitText.trim()) return;
    setLessons(prev => prev.map(l => {
      if (l.id === activeLesson.id) {
        return {
          ...l,
          homework: {
            ...l.homework,
            submitted: {
              ...l.homework.submitted,
              text: submitText
            }
          }
        };
      }
      return l;
    }));
    setIsEditing(false);
    setSubmitText('');
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-out', p: { xs: 1, md: 3 } }}>
      {/* Sarlavha va Orqaga */}
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
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
          Darslar va Uy vazifalari
        </Typography>
      </Box>

      {/* Main Grid Container */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 3,
        alignItems: 'stretch'
      }}>
        
        {/* Left Side: Middle details area (Player + Title + Vazifalar) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {/* Player Box */}
          <Box sx={{
            width: '100%',
            height: { xs: 220, sm: 360, md: 400 },
            backgroundColor: activeVideo ? '#0f172a' : '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: activeVideo ? 'none' : '1px solid #e5e7eb',
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
                  opacity: 0.1,
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

                <Box sx={{
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
                }}>
                  <PlayArrowIcon sx={{ fontSize: 40, ml: 0.5 }} />
                </Box>

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
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                    {activeVideo.name}
                  </Typography>
                  <Typography sx={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
                    {activeVideo.duration} &nbsp;&bull;&nbsp; {activeVideo.date}
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

          {/* Active Video/Topic Title Box */}
          <Paper elevation={0} sx={{
            p: 2.5,
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff'
          }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
              {activeLesson.topic} {activeVideo ? `(${activeVideo.name})` : ''}
            </Typography>
          </Paper>

          {/* Vazifalar Card */}
          <Paper elevation={0} sx={{
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            overflow: 'hidden'
          }}>
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
              <Typography sx={{ fontWeight: 700, color: '#6b7280', fontSize: '0.9rem' }}>
                To'p: {activeLesson.homework?.score || 0}
              </Typography>
            </Box>

            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              {activeLesson.homework ? (
                <>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
                        Uyga vazifa
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>
                        Fayllar soni: {activeLesson.homework.filesCount}
                      </Typography>
                    </Box>

                    {activeLesson.homework.isOverdue ? (
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        backgroundColor: '#ff3b30',
                        color: '#ffffff',
                        p: 2,
                        borderRadius: '10px',
                        mb: 2.5
                      }}>
                        <ErrorIcon sx={{ fontSize: 20 }} />
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>
                          Uyga vazifa muddati: {activeLesson.homework.deadline}
                        </Typography>
                      </Box>
                    ) : (
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
                          Uyga vazifa muddati: {activeLesson.homework.deadline}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography sx={{ fontSize: '0.92rem', color: '#374151', lineHeight: 1.6, fontWeight: 500 }}>
                        {activeLesson.homework.description}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 500 }}>
                        {activeLesson.homework.date}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ borderBottom: '1px dashed #e5e7eb' }} />

                  {/* Submission box states */}
                  {activeLesson.state === 'bajarilmagan' && !isEditing ? (
                    <Box>
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', mb: 1.5 }}>
                        Vazifa yuklash
                      </Typography>
                      <Box sx={{
                        position: 'relative',
                        border: '1px solid #e5e7eb',
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
                          placeholder="Fayl yig'ish va isoh qo'lga"
                          value={submitText}
                          onChange={(e) => setSubmitText(e.target.value)}
                          InputProps={{ disableUnderline: true }}
                          sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem', color: '#111827' } }}
                        />
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mt: 1
                        }}>
                          <Tooltip title="Fayl biriktirish">
                            <IconButton size="small" sx={{ color: '#9ca3af', '&:hover': { color: '#6b7280' } }}>
                              <AttachFileIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Tooltip>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 500 }}>
                              {submitText.length} / 1000
                            </Typography>
                            <IconButton 
                              onClick={handleSendHomework}
                              disabled={!submitText.trim()}
                              sx={{
                                backgroundColor: submitText.trim() ? '#ff9800' : 'rgba(0,0,0,0.04)',
                                color: '#ffffff',
                                '&:hover': { backgroundColor: '#e68a00' },
                                '&.Mui-disabled': { color: '#9ca3af' },
                                width: 34, height: 34,
                              }}
                            >
                              <SendIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ) : isEditing ? (
                    <Box>
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', mb: 1.5 }}>
                        Vazifani tahrirlash
                      </Typography>
                      <Box sx={{
                        border: '1px solid #e5e7eb',
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
                          placeholder="Fayl yig'ish va isoh qo'lga"
                          value={submitText}
                          onChange={(e) => setSubmitText(e.target.value)}
                          InputProps={{ disableUnderline: true }}
                          sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem', color: '#111827' } }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
                          <Button size="small" variant="text" onClick={() => setIsEditing(false)} sx={{ color: '#6b7280', textTransform: 'none', fontWeight: 600 }}>
                            Bekor qilish
                          </Button>
                          <Button 
                            size="small" 
                            variant="contained" 
                            onClick={handleSaveEdit}
                            disabled={!submitText.trim()}
                            sx={{
                              backgroundColor: '#ff9800',
                              color: '#fff',
                              textTransform: 'none',
                              fontWeight: 700,
                              boxShadow: 'none',
                              '&:hover': { backgroundColor: '#e68a00', boxShadow: 'none' }
                            }}
                          >
                            Saqlash
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>
                            Mening jo'natmalarim
                          </Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500, mt: 0.2 }}>
                            Fayllar soni: {activeLesson.homework.submitted?.filesCount || 0}
                          </Typography>
                        </Box>
                        {activeLesson.state === 'kutayotgan' && (
                          <IconButton size="small" onClick={handleStartEdit} sx={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                            <EditIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                          </IconButton>
                        )}
                      </Box>

                      <Box sx={{
                        p: 2,
                        borderRadius: '10px',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #f3f4f6',
                        mb: 1.5
                      }}>
                        <Typography sx={{ fontSize: '0.9rem', color: '#2563eb', fontWeight: 600, wordBreak: 'break-all' }}>
                          {activeLesson.homework.submitted?.text}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 500 }}>
                          {activeLesson.homework.submitted?.date}
                        </Typography>
                      </Box>

                      {activeLesson.state === 'qabul_qilingan' && activeLesson.homework.teacherComment && (
                        <>
                          <Box sx={{ borderBottom: '1px dashed #e5e7eb', my: 2.5 }} />
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#111827' }}>
                                O'qituvchi izohi
                              </Typography>
                              <Typography sx={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 700 }}>
                                {activeLesson.homework.teacherComment.text}
                              </Typography>
                            </Box>

                            {activeLesson.homework.teacherComment.warning && (
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
                                  {activeLesson.homework.teacherComment.warning}
                                </Typography>
                              </Box>
                            )}
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

        {/* Right Side: Sidebar List of Lessons */}
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
                <Paper
                  onClick={() => selectLesson(lesson)}
                  elevation={0}
                  sx={{
                    p: 2.2,
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
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
                      color: '#111827',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {lesson.topic}
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
                    Dars sanasi: {lesson.date}
                  </Typography>
                </Paper>

                {hasVideos && isExpanded && (
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.8,
                    pl: 1.5,
                    borderLeft: '1px dashed #e5e7eb',
                    ml: 1.5,
                    animation: 'slideDown 0.2s ease-out',
                    '@keyframes slideDown': {
                      from: { opacity: 0, transform: 'translateY(-8px)' },
                      to: { opacity: 1, transform: 'translateY(0)' }
                    }
                  }}>
                    {lesson.videos.map((video) => {
                      const isVideoActive = activeVideos[lesson.id] === video.id;
                      return (
                        <Paper
                          key={video.id}
                          onClick={(e) => selectVideo(lesson.id, video.id, e)}
                          elevation={0}
                          sx={{
                            p: 1.5,
                            borderRadius: '10px',
                            border: '1px solid #e5e7eb',
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
                            color: '#111827',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {video.id === 101 ? '1-video: ' : video.id === 102 ? '2-video: ' : ''}{video.name}
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
