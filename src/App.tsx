import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, LogOut } from 'lucide-react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { demoStatus, teamMembers } from './lib/mockData'
import { isWeekend, isoDate, monthDays, monthTitle } from './lib/date'
import type { Profile, Schedule, ScheduleStatus } from './lib/types'
import { statusLabels } from './lib/types'

const today = new Date()

function AuthScreen({ onDemo }: { onDemo: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) setError(signInError.message)
    setLoading(false)
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={signIn}>
        <img className="brand-logo" src="/orange-logo.png" alt="Orange" />
        <p className="eyebrow">Team schedule</p>
        <h1 className="brand-name">Platform Ops<br />&amp; Support</h1>
        <p className="muted">Sign in to view the team calendar and update your own availability.</p>
        {!isSupabaseConfigured && <p className="setup-note">Add your Supabase URL and anon key to <strong>.env.local</strong> to enable sign in.</p>}
        <h2>Welcome back</h2>
        <label className="form-field">Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
        </label>
        <label className="form-field">Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required minLength={6} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary-btn" disabled={loading || !isSupabaseConfigured}>{loading ? 'Signing in…' : 'Sign in'}</button>
        {!isSupabaseConfigured && <button type="button" className="demo-btn" onClick={onDemo}>Preview demo calendar</button>}
      </form>
    </main>
  )
}

function ScheduleApp({ userId, userEmail, onSignOut }: { userId: string; userEmail?: string; onSignOut: () => void }) {
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [members, setMembers] = useState<Profile[]>(teamMembers)
  const [selectedId, setSelectedId] = useState(teamMembers[0].id)
  const [saved, setSaved] = useState<Record<string, ScheduleStatus>>({})
  const [draft, setDraft] = useState<Record<string, ScheduleStatus>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [viewMode, setViewMode] = useState<'calendar' | 'sheet'>('calendar')

  const selectedMember = members.find((member) => member.id === selectedId) ?? members[0]
  const canEditSelected = selectedId === userId
  const days = useMemo(() => monthDays(month), [month])
  const monthPrefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
  const nextMonthStart = isoDate(new Date(month.getFullYear(), month.getMonth() + 1, 1))

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured) return
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('id,name,initials,accent').order('name')
      if (profileError) { setLoadError(profileError.message); return }
      if (profileData?.length) {
        const ownProfile = profileData.find((profile) => profile.id === userId)
        setMembers(profileData)
        setSelectedId(ownProfile?.id ?? profileData[0].id)
        if (!ownProfile) setLoadError('Your login works, but the team profiles are not synced to Auth yet. Run supabase/sync-profiles-from-auth.sql in Supabase, then refresh.')
      }
      const { data: scheduleData, error: scheduleError } = await supabase.from('schedules').select('user_id,schedule_date,status').gte('schedule_date', `${monthPrefix}-01`).lt('schedule_date', nextMonthStart)
      if (scheduleError) { setLoadError(scheduleError.message); return }
      const nextSaved: Record<string, ScheduleStatus> = {}
      scheduleData?.forEach((entry: Schedule) => { nextSaved[`${entry.user_id}:${entry.schedule_date}`] = entry.status })
      setSaved(nextSaved)
      setDraft(nextSaved)
    }
    void load()
  }, [month, monthPrefix, userId, userEmail])

  useEffect(() => {
    const ownMember = members.find((member) => member.id === userId)
    if (ownMember) setSelectedId(ownMember.id)
  }, [members, userEmail, userId])

  const getStatus = (memberId: string, date: Date) => draft[`${memberId}:${isoDate(date)}`] ?? demoStatus(date.getDate())
  const updateStatus = (date: Date, status: ScheduleStatus) => {
    setMessage('')
    setDraft((current) => ({ ...current, [`${selectedId}:${isoDate(date)}`]: status }))
  }

  const saveChanges = async () => {
    setSaving(true)
    setMessage('')
    const changes = days.filter((date): date is Date => date !== null && !isWeekend(date)).map((date) => ({
      user_id: userId,
      schedule_date: isoDate(date),
      status: getStatus(selectedId, date),
    }))
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('schedules').upsert(changes, { onConflict: 'user_id,schedule_date' })
      if (error) {
        setMessage(error.message.includes('schedules_user_id_fkey')
          ? 'Run supabase/sync-profiles-from-auth.sql in Supabase SQL Editor once, then refresh.'
          : error.message)
        setSaving(false)
        return
      }
    }
    setSaved((current) => ({ ...current, ...Object.fromEntries(changes.map((item) => [`${selectedId}:${item.schedule_date}`, item.status])) }))
    setMessage('Saved successfully')
    setSaving(false)
  }

  const officeDays = days.filter((date) => date && !isWeekend(date) && getStatus(selectedId, date) === 'office').length
  const hasChanges = days.some((date) => date && !isWeekend(date) && getStatus(selectedId, date) !== (saved[`${selectedId}:${isoDate(date)}`] ?? demoStatus(date.getDate())))

  const downloadSheet = () => {
    const rows = [
      ['Date', ...members.map((member) => member.name)],
      ...days.filter((date): date is Date => date !== null).map((date) => [
        isoDate(date),
        ...members.map((member) => isWeekend(date) ? 'Weekend' : statusLabels[getStatus(member.id, date)]),
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `platform-ops-support-${monthPrefix}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="app-shell">
      <div className="app-frame">
        <header className="topbar">
          <div><div className="eyebrow">Team schedule</div><h1 className="title">Platform Ops and Support</h1><div className="signed-in">Signed in as {userEmail ?? 'team member'}</div></div>
          <div className="top-actions">
            <div className="month-nav">
              <button className="icon-btn" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
              <span className="month-label">{monthTitle(month)}</span>
              <button className="icon-btn" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
            </div>
            <button className={`view-btn top-view-btn ${viewMode === 'sheet' ? 'active' : ''}`} onClick={() => setViewMode(viewMode === 'calendar' ? 'sheet' : 'calendar')}>{viewMode === 'calendar' ? 'Team sheet' : 'Calendar'}</button>
            <button className="logout-btn" onClick={onSignOut}><LogOut size={14} /> Sign out</button>
          </div>
        </header>
        <div className="notice">hi team, where’s the laptop at?</div>
        {loadError && <p className="error">{loadError}</p>}
        <div className="dashboard">
          <aside className="panel">
            <div className="panel-title"><span>People</span><span className="count">{members.length}</span></div>
            <div className="member-list">{members.map((member) => <button className={`member ${selectedId === member.id ? 'active' : ''}`} style={{ '--member-color': member.accent } as React.CSSProperties} key={member.id} onClick={() => setSelectedId(member.id)}>
              <span className="avatar" style={{ background: member.accent }}>{member.initials}</span><span className="member-name">{member.name}</span>
            </button>)}</div>
          </aside>
          <section className="panel calendar-panel" style={{ '--member-color': selectedMember?.accent } as React.CSSProperties}>
            <div className="calendar-heading"><div><span className="selected-name">{selectedMember?.name}</span>{canEditSelected ? <span className="edit-hint"> • Your schedule is editable</span> : <span className="edit-hint locked"> • View only</span>}</div><div className="view-actions">{viewMode === 'sheet' && <button className="download-btn" onClick={downloadSheet} title="Download team sheet"><Download size={15} /> Download</button>}</div></div>
            {viewMode === 'calendar' ? <><div className="calendar">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div className="weekday" key={day}>{day}</div>)}{days.map((date, index) => date ? <div className={`day-cell ${isWeekend(date) ? 'weekend' : ''} ${isWeekend(date) ? '' : getStatus(selectedId, date)}`} style={{ '--member-color': selectedMember?.accent } as React.CSSProperties} key={isoDate(date)}><span className="day-number">{date.getDate()}</span>{isWeekend(date) ? <div className="holiday">WEEKEND</div> : <select className={`status-select ${getStatus(selectedId, date)}`} value={getStatus(selectedId, date)} onChange={(event) => updateStatus(date, event.target.value as ScheduleStatus)} disabled={!canEditSelected}><option value="office">In office</option><option value="remote">WFH</option><option value="leave">Leave</option></select>}</div> : <div className="day-cell empty" key={`empty-${index}`} />)}</div></> : <div className="team-sheet-wrap"><table className="team-sheet"><thead><tr><th>Date</th>{members.map((member) => <th key={member.id} style={{ background: member.accent }}>{member.name}</th>)}</tr></thead><tbody>{days.filter((date): date is Date => date !== null).map((date) => <tr key={isoDate(date)}><td>{date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</td>{members.map((member) => { const status = isWeekend(date) ? null : getStatus(member.id, date); return <td key={member.id} className={status ?? 'weekend-cell'}>{status ? statusLabels[status] : 'Weekend'}</td> })}</tr>)}</tbody></table></div>}
            <div className="calendar-footer"><div><div className="footer-label">This month</div><div className="footer-value">{officeDays} days in office</div></div><div className="save-area">{message && <span className={message === 'Saved successfully' ? 'save-state' : 'save-state error'}>{message}</span>}<button className="primary-btn save-btn" onClick={saveChanges} disabled={saving || !canEditSelected || !hasChanges}>{saving ? 'Saving…' : 'Save changes'}</button></div></div>
          </section>
        </div>
        <footer className="app-footer">if any queries contact Aryan (mail: <a href="mailto:raj.aryan@orange.com">raj.aryan@orange.com</a>), happy to help :)</footer>
      </div>
    </main>
  )
}

export default function App() {
  const [session, setSession] = useState<{ user: { id: string; email?: string } } | null>(null)
  const [demoMode, setDemoMode] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session as { user: { id: string; email?: string } } | null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession as { user: { id: string; email?: string } } | null))
    return () => listener.subscription.unsubscribe()
  }, [])
  if (!session && !demoMode) return <AuthScreen onDemo={() => setDemoMode(true)} />
  if (demoMode) return <ScheduleApp userId={teamMembers[0].id} onSignOut={() => setDemoMode(false)} />
  return <ScheduleApp key={session!.user.id} userId={session!.user.id} userEmail={session!.user.email} onSignOut={() => void supabase.auth.signOut()} />
}
