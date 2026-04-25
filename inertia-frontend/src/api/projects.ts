import { get, post } from './client'
import type {
  CommitReconciliationResponse,
  ProjectCreateResponse,
  ProjectDashboardResponse,
  ProjectJoinResponse,
  ProjectLookupResponse,
  ProjectSummary,
  StudentProfile,
  CommitRecord,
} from '../types'

export function createProject(name: string, teacherId: string) {
  return post<ProjectCreateResponse>('/projects', {
    name,
    teacher_id: teacherId,
  })
}

export function listProjects(teacherId: string) {
  return get<ProjectSummary[]>(`/projects?teacher_id=${encodeURIComponent(teacherId)}`)
}

export function lookupJoinCode(joinCode: string) {
  return get<ProjectLookupResponse>(`/projects/${encodeURIComponent(joinCode)}`)
}

export function joinProject(joinCode: string, studentId: string) {
  return post<ProjectJoinResponse>(`/projects/${encodeURIComponent(joinCode)}/join`, {
    student_id: studentId,
  })
}

export function getProjectDashboard(projectId: string) {
  return get<ProjectDashboardResponse>(`/projects/${encodeURIComponent(projectId)}/dashboard`)
}

export function getProjectStudents(projectId: string) {
  return get<StudentProfile[]>(`/projects/${encodeURIComponent(projectId)}/students`)
}

export function getProjectCommits(projectId: string) {
  return get<{ commits: CommitRecord[] }>(`/projects/${encodeURIComponent(projectId)}/commits`)
}

export function getProjectStudent(projectId: string, studentId: string) {
  return get<StudentProfile>(
    `/projects/${encodeURIComponent(projectId)}/students/${encodeURIComponent(studentId)}`,
  )
}

export function getStudentCommitReconciliation(projectId: string, studentId: string) {
  return get<CommitReconciliationResponse>(
    `/projects/${encodeURIComponent(projectId)}/students/${encodeURIComponent(studentId)}/commit-reconciliation`,
  )
}
