export type ScheduleStatus = 'office' | 'remote' | 'leave'

export type Profile = {
  id: string
  name: string
  initials: string
  accent: string
}

export type Schedule = {
  user_id: string
  schedule_date: string
  status: ScheduleStatus
}

export const statusLabels: Record<ScheduleStatus, string> = {
  office: 'In office',
  remote: 'WFH',
  leave: 'Leave',
}
