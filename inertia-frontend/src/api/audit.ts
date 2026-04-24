import { post } from './client'
import type { AuditResponse } from '../types'

export function auditDiff(diff: string, student_id: string, project_id: string) {
  return post<AuditResponse>('/audit', { diff, student_id, project_id })
}
