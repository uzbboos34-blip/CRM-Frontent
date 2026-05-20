import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Tab, Tabs } from '@mui/material';
import Courses from './Courses';
import Rooms from './Rooms';
import Staff from './Staff';

const tabs = [
  'Kurslar', 'Xonalar', 'Filiallar', 'Xodimlar', 'Sabablar',
  'Rollar', 'Coin', 'Xabar yuborish', 'Tekshiruv'
];

const PATH_TO_TAB = {
  '/management': 0,
  '/management/courses': 0,
  '/management/rooms': 1,
  '/management/branches': 2,
  '/management/staff': 3,
  '/management/reasons': 4,
  '/management/roles': 5,
  '/management/coin': 6,
  '/management/messages': 7,
  '/management/check': 8,
};

const TAB_TO_PATH = [
  '/management',
  '/management/rooms',
  '/management/branches',
  '/management/staff',
  '/management/reasons',
  '/management/roles',
  '/management/coin',
  '/management/messages',
  '/management/check',
];

export default function Management() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = PATH_TO_TAB[location.pathname] ?? 0;

  const renderContent = () => {
    switch (activeTab) {
      case 0: return <Courses />;
      case 1: return <Rooms />;
      case 3: return <Staff />;
      default:
        return (
          <Box sx={{ p: 10, textAlign: 'center', backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e5e7eb' }}>
            <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
              Hozircha "{tabs[activeTab]}" bo'limi ma'lumotlari mavjud emas
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mb: 1 }}>Boshqarish</Typography>

      {/* Horizontal Tabs */}
      <Box sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => navigate(TAB_TO_PATH[v])}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 40,
            '& .MuiTabs-indicator': { backgroundColor: '#7b61ff', height: 3, borderRadius: '3px 3px 0 0' },
            '& .MuiTab-root': { textTransform: 'none', minWidth: 0, px: 2, fontWeight: 700, fontSize: '0.95rem', color: '#9ca3af', mr: 2 },
            '& .Mui-selected': { color: '#7b61ff !important' }
          }}
        >
          {tabs.map(tab => <Tab key={tab} label={tab} />)}
        </Tabs>
      </Box>

      {renderContent()}
    </Box>
  );
}
