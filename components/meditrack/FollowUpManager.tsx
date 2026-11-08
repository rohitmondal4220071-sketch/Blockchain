"use client";

import { useState, useEffect } from "react";
import { Bell, Calendar, Clock, Pill, Plus, Stethoscope, TestTube, Trash2 } from "lucide-react";
import { GlassButton, GlassCard, GlassInput, SectionTitle, StatTile } from "./ui";

type ReminderType = "follow-up" | "medicine-review" | "lab-test" | "appointment";
interface Reminder { id: string; type: ReminderType; title: string; date: string; time: string; notes?: string; completed: boolean; }

const STORAGE_KEY = "mediscan_followup_reminders";
function load(): Reminder[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function save(r: Reminder[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); }

const TYPE_ICON: Record<ReminderType, typeof Bell> = { "follow-up": Stethoscope, "medicine-review": Pill, "lab-test": TestTube, appointment: Calendar };
const TYPE_LABEL: Record<ReminderType, string> = { "follow-up": "Follow-Up", "medicine-review": "Medicine Review", "lab-test": "Lab Test", appointment: "Appointment" };

export function FollowUpManager() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "follow-up" as ReminderType, title: "", date: "", time: "", notes: "" });

  useEffect(() => { setReminders(load()); }, []);

  const addReminder = () => {
    if (!form.title || !form.date) return;
    const r: Reminder = { id: Date.now().toString(), ...form, completed: false };
    const updated = [r, ...reminders]; setReminders(updated); save(updated);
    setForm({ type: "follow-up", title: "", date: "", time: "", notes: "" }); setShowForm(false);
  };

  const toggle = (id: string) => { const updated = reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r); setReminders(updated); save(updated); };
  const remove = (id: string) => { const updated = reminders.filter(r => r.id !== id); setReminders(updated); save(updated); };

  const upcoming = reminders.filter(r => !r.completed).sort((a, b) => a.date.localeCompare(b.date));
  const completed = reminders.filter(r => r.completed);

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10"><Bell className="h-6 w-6 text-white" strokeWidth={1.5} /></div>
          <div><h2 className="text-lg font-medium text-white">Follow-Up Manager</h2><p className="mt-1 text-sm text-white/60">Track doctor follow-ups, medicine reviews, lab tests, and appointment reminders.</p></div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Upcoming" value={upcoming.length} icon={<Clock className="h-5 w-5 text-yellow-400" strokeWidth={1.5} />} />
        <StatTile label="Completed" value={completed.length} icon={<Bell className="h-5 w-5 text-green-400" strokeWidth={1.5} />} />
        <StatTile label="Follow-Ups" value={reminders.filter(r => r.type === "follow-up").length} icon={<Stethoscope className="h-5 w-5 text-white" strokeWidth={1.5} />} />
        <StatTile label="Lab Tests" value={reminders.filter(r => r.type === "lab-test").length} icon={<TestTube className="h-5 w-5 text-white" strokeWidth={1.5} />} />
      </div>

      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle icon={<Calendar className="h-5 w-5 text-white" strokeWidth={1.5} />}>Reminders</SectionTitle>
          <GlassButton onClick={() => setShowForm(s => !s)}><Plus className="h-4 w-4" /> Add Reminder</GlassButton>
        </div>

        {showForm && (
          <div className="mb-5 space-y-3 border-b border-white/10 pb-5">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TYPE_LABEL) as ReminderType[]).map(t => (
                <button key={t} onClick={() => setForm({ ...form, type: t })} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${form.type === t ? "bg-white/20 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>{TYPE_LABEL[t]}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <GlassInput placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <GlassInput type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              <GlassInput type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              <GlassInput placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <GlassButton onClick={addReminder}>Save Reminder</GlassButton>
          </div>
        )}

        <div className="space-y-3">
          {upcoming.length === 0 ? <p className="py-6 text-center text-sm text-white/40">No upcoming reminders.</p> : upcoming.map(r => {
            const Icon = TYPE_ICON[r.type];
            return (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggle(r.id)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/15"><Icon className="h-5 w-5 text-white" strokeWidth={1.5} /></button>
                  <div><p className="font-medium text-white">{r.title}</p><p className="text-xs text-white/50">{TYPE_LABEL[r.type]} · {r.date} {r.time}</p></div>
                </div>
                <button onClick={() => remove(r.id)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition"><Trash2 className="h-4 w-4" /></button>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
