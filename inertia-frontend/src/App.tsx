import { Route, Routes } from 'react-router-dom'
import { NewProjectPage } from './pages/Dashboard/NewProjectPage'
import { ProjectDetailPage } from './pages/Dashboard/ProjectDetailPage'
import { ProjectListPage } from './pages/Dashboard/ProjectListPage'
import { StudentDetailPage } from './pages/Dashboard/StudentDetailPage'
import { HowItWorksPage } from './pages/Landing/HowItWorksPage'
import { LandingPage } from './pages/Landing/LandingPage'
import { StudentPage } from './pages/Puzzle/StudentPage'

export function App() {
  return (
    <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/student" element={<StudentPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/dashboard" element={<ProjectListPage />} />
        <Route path="/dashboard/new" element={<NewProjectPage />} />
        <Route path="/dashboard/:projectId" element={<ProjectDetailPage />} />
        <Route path="/dashboard/:projectId/:studentId" element={<StudentDetailPage />} />
      </Routes>
  )
}
