import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createProject } from '../../api/projects'
import { handleApiError } from '../../utils/error'

export function NewProjectPage() {
  const navigate = useNavigate()
  const [teacherId, setTeacherId] = useState('teacher@uni.edu')
  const [projectName, setProjectName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!teacherId.trim() || !projectName.trim()) {
      setError('Teacher email and project name are required.')
      return
    }

    setError(null)
    try {
      const project = await createProject(projectName.trim(), teacherId.trim())
      navigate(`/dashboard/${project.project_id}`)
    } catch (err) {
      const handled = handleApiError(err)
      setError(handled.inlineMessage ?? handled.toastMessage)
    }
  }

  return (
    <div className="paper-bg" style={{ minHeight: '100vh', padding: 28, fontFamily: 'var(--ui)' }}>
      <main style={{ maxWidth: 760, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 38 }}>Create Project</h1>
          <Link to="/dashboard" style={{ border: '1px solid var(--ink)', padding: '8px 12px', textDecoration: 'none', color: 'var(--ink)' }}>
            Back
          </Link>
        </header>

        <form onSubmit={handleSubmit} style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: 16, display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Teacher email</span>
            <input value={teacherId} onChange={(event) => setTeacherId(event.target.value)} style={{ border: '1px solid var(--ink)', padding: 10 }} />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Project name</span>
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} style={{ border: '1px solid var(--ink)', padding: 10 }} />
          </label>

          <button type="submit" style={{ border: '1px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)', padding: '10px 16px', cursor: 'pointer' }}>
            Create project
          </button>

          {error ? <div style={{ color: 'var(--signal)', border: '1px solid var(--signal)', padding: 10 }}>{error}</div> : null}
        </form>
      </main>
    </div>
  )
}
