import { post } from './client'
import type { VerifyResponse } from '../types'

export function verifyAnswer(token_id: string, student_id: string, answer: string, project_id?: string) {
  return post<VerifyResponse>('/verify', { token_id, student_id, answer, project_id: project_id ?? '' })
}
