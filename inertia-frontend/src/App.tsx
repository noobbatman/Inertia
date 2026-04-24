import { Route, Routes } from 'react-router-dom'
import { DashboardPage } from './pages/Dashboard/DashboardPage'
import { LandingPage } from './pages/Landing/LandingPage'
import { StudentPage } from './pages/Puzzle/StudentPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/student" element={<StudentPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  )
}
