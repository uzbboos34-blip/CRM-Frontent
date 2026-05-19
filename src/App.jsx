import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Management from './pages/Management';
import Teachers from './pages/Teachers';
import Groups from './pages/Groups';
import GroupInner from './pages/GroupInner';
import Attendance from './pages/Attendance';
import Students from './pages/Students';
import CreateHomeWork from './pages/CreateHomeWork';
import CreateVideo from './pages/CreateVideo';
import HomeworkDetail from './pages/HomeworkDetail';
import StudentHomeworkDetail from './pages/StudentHomeworkDetail';
import ExamDetail from './pages/ExamDetail';
import StudentExamDetail from './pages/StudentExamDetail';

import { UploadProvider } from './context/UploadContext';

function App() {
  return (
    <BrowserRouter>
      <UploadProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Dashboard Routes */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="management" element={<Management />} />
            <Route path="management/courses" element={<Management />} />
            <Route path="management/rooms" element={<Management />} />
            <Route path="management/branches" element={<Management />} />
            <Route path="management/staff" element={<Management />} />
            <Route path="management/reasons" element={<Management />} />
            <Route path="management/roles" element={<Management />} />
            <Route path="management/coin" element={<Management />} />
            <Route path="management/messages" element={<Management />} />
            <Route path="management/check" element={<Management />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="groups" element={<Groups />} />
            <Route path="group/:id" element={<GroupInner />} />
            <Route path="group/:id/attendance/:date" element={<Attendance />} />

            {/* ── Homework routes ── */}
            <Route path="group/:groupId/homework/create" element={<CreateHomeWork />} />
            <Route path="group/:groupId/homework/edit/:hwId" element={<CreateHomeWork />} />
            {/* 1st screenshot: homework detail (4 tabs) */}
            <Route path="group/:groupId/homework/:hwId" element={<HomeworkDetail />} />
            {/* 2nd+3rd screenshot: specific student submission + grading */}
            <Route path="group/:groupId/homework/:hwId/student/:studentId" element={<StudentHomeworkDetail />} />

            {/* ── Exam routes ── */}
            <Route path="group/:groupId/exam/:examId" element={<ExamDetail />} />
            <Route path="group/:groupId/exam/:examId/student/:studentId" element={<StudentExamDetail />} />

            {/* ── Video routes ── */}
            <Route path="group/:id/video/create" element={<CreateVideo />} />

            <Route path="students" element={<Students />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </UploadProvider>
    </BrowserRouter>
  );
}

export default App;
