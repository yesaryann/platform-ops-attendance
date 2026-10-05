import type { Profile, ScheduleStatus } from './types'

export const teamMembers: Profile[] = [
  { id: 'aryan-raj', name: 'Aryan Raj', initials: 'AR', accent: '#f6b8a9' },
  { id: 'jha-avichal', name: 'Jha Avichal', initials: 'JA', accent: '#f5dc87' },
  { id: 'padihary-subas', name: 'Padihary Subas', initials: 'PS', accent: '#8ed7e8' },
  { id: 'rani-yalamaddi', name: 'Rani Yalamaddi', initials: 'RY', accent: '#f5b8bb' },
  { id: 'singh-hargovind', name: 'Singh Hargovind', initials: 'SH', accent: '#d9d9d4' },
  { id: 'singh-khushbu', name: 'Singh Khushbu', initials: 'SK', accent: '#a7dfbd' },
  { id: 'thakur-tanmaya', name: 'Thakur Tanmaya', initials: 'TT', accent: '#ebb0c5' },
]

export const demoStatus = (day: number): ScheduleStatus => {
  if (day % 5 === 0) return 'remote'
  if (day === 3) return 'leave'
  return 'office'
}
