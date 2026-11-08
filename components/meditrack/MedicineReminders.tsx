"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Clock,
  Moon,
  Pencil,
  Pill,
  Plus,
  Sun,
  Sunrise,
  Trash2,
  X,
} from "lucide-react";
import {
  storageService,
  type Medicine,
  type MedicineFoodTiming,
  type MedicineSlot,
} from "@/lib/storage";
import { GlassButton, GlassCard, GlassInput, StatTile } from "./ui";

const SLOTS: { id: MedicineSlot; label: string; Icon: typeof Sun }[] = [
  { id: "morning", label: "Morning", Icon: Sunrise },
  { id: "afternoon", label: "Afternoon", Icon: Sun },
  { id: "night", label: "Night", Icon: Moon },
];

const FOOD_LABEL: Record<MedicineFoodTiming, string> = {
  before: "Before food",
  after: "After food",
  any: "Any time",
};

function slotForTime(time: string): MedicineSlot {
  const hour = parseInt(time.split(":")[0] || "0", 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "night";
}

interface FormState {
  name: string;
  dosage: string;
  time: string;
  slot: MedicineSlot;
  foodTiming: MedicineFoodTiming;
  duration: string;
  frequency: string;
}

const emptyForm: FormState = {
  name: "",
  dosage: "",
  time: "08:00",
  slot: "morning",
  foodTiming: "after",
  duration: "",
  frequency: "Daily",
};

export function MedicineReminders() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    const saved = storageService.getMedicines();
    if (saved.length > 0) {
      setMedicines(saved);
    } else {
      const defaults: Medicine[] = [
        { id: "1", name: "Vitamin D3", dosage: "1000 IU", time: "08:00", frequency: "Daily", taken: true, status: "taken", slot: "morning", foodTiming: "after", duration: "30 days" },
        { id: "2", name: "Blood Pressure Med", dosage: "10mg", time: "14:00", frequency: "Daily", taken: false, status: "pending", slot: "afternoon", foodTiming: "before", duration: "Ongoing" },
        { id: "3", name: "Omega-3 Fish Oil", dosage: "1000mg", time: "21:00", frequency: "Daily", taken: false, status: "pending", slot: "night", foodTiming: "after", duration: "60 days" },
      ];
      setMedicines(defaults);
      storageService.saveMedicines(defaults);
    }
  }, []);

  const persist = (next: Medicine[]) => {
    setMedicines(next);
    storageService.saveMedicines(next);
  };

  const setStatus = (id: string, status: "taken" | "missed") => {
    persist(
      medicines.map((m) =>
        m.id === id
          ? {
              ...m,
              status,
              taken: status === "taken",
              takenAt: status === "taken" ? new Date().toISOString() : undefined,
            }
          : m
      )
    );
  };

  const remove = (id: string) => persist(medicines.filter((m) => m.id !== id));

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (m: Medicine) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      dosage: m.dosage,
      time: m.time,
      slot: m.slot ?? slotForTime(m.time),
      foodTiming: m.foodTiming ?? "any",
      duration: m.duration ?? "",
      frequency: m.frequency || "Daily",
    });
    setShowForm(true);
  };

  const submit = () => {
    if (!form.name || !form.dosage || !form.time) return;
    if (editingId) {
      persist(
        medicines.map((m) =>
          m.id === editingId
            ? { ...m, ...form, slot: form.slot || slotForTime(form.time) }
            : m
        )
      );
    } else {
      const medicine: Medicine = {
        id: Date.now().toString(),
        ...form,
        slot: form.slot || slotForTime(form.time),
        taken: false,
        status: "pending",
      };
      persist([...medicines, medicine]);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const takenCount = medicines.filter((m) => m.status === "taken" || m.taken).length;
  const missedCount = medicines.filter((m) => m.status === "missed").length;
  const total = medicines.length;

  const bySlot = (slot: MedicineSlot) =>
    medicines.filter((m) => (m.slot ?? slotForTime(m.time)) === slot);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total" value={total} icon={<Pill className="h-5 w-5 text-white" strokeWidth={1.5} />} />
        <StatTile label="Taken" value={takenCount} icon={<Check className="h-5 w-5 text-white" strokeWidth={1.5} />} />
        <StatTile label="Missed" value={missedCount} icon={<X className="h-5 w-5 text-white" strokeWidth={1.5} />} />
        <StatTile
          label="Adherence"
          value={`${total > 0 ? Math.round((takenCount / total) * 100) : 0}%`}
          icon={<Bell className="h-5 w-5 text-white" strokeWidth={1.5} />}
        />
      </div>

      <GlassCard>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-white">Medicine Schedule</h3>
          <GlassButton onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Medicine
          </GlassButton>
        </div>

        {showForm && (
          <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <GlassInput
                placeholder="Medicine name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <GlassInput
                placeholder="Dosage (e.g., 500mg)"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
              />
              <GlassInput
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value, slot: slotForTime(e.target.value) })}
              />
              <GlassInput
                placeholder="Duration (e.g., 7 days)"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setForm({ ...form, slot: s.id })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    form.slot === s.id ? "bg-white/20 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <span className="mx-1 self-center text-white/20">|</span>
              {(["before", "after", "any"] as MedicineFoodTiming[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setForm({ ...form, foodTiming: f })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    form.foodTiming === f ? "bg-white/20 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {FOOD_LABEL[f]}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <GlassButton onClick={submit}>{editingId ? "Save Changes" : "Add Medicine"}</GlassButton>
              <GlassButton variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </GlassButton>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Slot-based schedule */}
      {SLOTS.map((slot) => {
        const items = bySlot(slot.id);
        return (
          <GlassCard key={slot.id}>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <slot.Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-medium text-white">{slot.label}</h3>
              <span className="ml-auto text-xs text-white/50">{items.length} scheduled</span>
            </div>

            {items.length === 0 ? (
              <p className="py-4 text-center text-sm text-white/40">No medicines in this slot.</p>
            ) : (
              <div className="space-y-3">
                {items.map((m) => {
                  const status = m.status ?? (m.taken ? "taken" : "pending");
                  return (
                    <div key={m.id} className="rounded-xl bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                            <Pill className="h-5 w-5 text-white" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className={`font-medium ${status === "taken" ? "text-white/50 line-through" : "text-white"}`}>
                              {m.name}
                            </p>
                            <p className="text-sm text-white/50">
                              {m.dosage} · {m.frequency}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                                <Clock className="h-3 w-3" /> {m.time}
                              </span>
                              {m.foodTiming && m.foodTiming !== "any" && (
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                                  {FOOD_LABEL[m.foodTiming]}
                                </span>
                              )}
                              {m.duration && (
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                                  {m.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => openEdit(m)}
                            aria-label={`Edit ${m.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => remove(m.id)}
                            aria-label={`Delete ${m.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => setStatus(m.id, "taken")}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
                            status === "taken"
                              ? "bg-white/20 text-white"
                              : "bg-white/5 text-white/70 hover:bg-white/10"
                          }`}
                        >
                          <Check className="h-4 w-4" /> Taken
                        </button>
                        <button
                          onClick={() => setStatus(m.id, "missed")}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
                            status === "missed"
                              ? "bg-white/20 text-white"
                              : "bg-white/5 text-white/70 hover:bg-white/10"
                          }`}
                        >
                          <X className="h-4 w-4" /> Missed
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        );
      })}

      <div className="flex items-start gap-3 rounded-xl bg-white/5 p-4">
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-white/70" strokeWidth={1.5} />
        <p className="text-xs text-white/60">
          Always verify medicines and dosage with your doctor or pharmacist before taking them.
        </p>
      </div>
    </div>
  );
}
