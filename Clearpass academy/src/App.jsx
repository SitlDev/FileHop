import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Catalog from './pages/Catalog'
import CoursePlayer from './pages/CoursePlayer'
import Certificates from './pages/Certificates'
import AIAdvisor from './pages/AIAdvisor'
import PolicyGenerator from './pages/PolicyGenerator'
import AdminDashboard from './pages/AdminDashboard'
import Verify from './pages/Verify'

import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/course/:courseId" element={<CoursePlayer />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/ai-advisor" element={<AIAdvisor />} />
          <Route path="/policy-gen" element={<PolicyGenerator />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/verify/:certificateId" element={<Verify />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
