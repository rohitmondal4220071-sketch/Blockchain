"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Heart, MapPin, Phone, Plus, Shield, Trash2, User, X } from "lucide-react";
import { storageService, type EmergencyContact, type UserProfile } from "@/lib/storage";
import { GlassButton, GlassCard, GlassInput, SectionTitle } from "./ui";

interface EmergencySOSProps {
  user: UserProfile;
}

export function EmergencySOS({ user }: EmergencySOSProps) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" });

  useEffect(() => {
    const saved = storageService.getEmergencyContacts();
    if (user.emergencyContact?.name && user.emergencyContact?.phone) {
      const profileContact: EmergencyContact = {
        id: "profile",
        name: user.emergencyContact.name,
        phone: user.emergencyContact.phone,
        relationship: user.emergencyContact.relationship || "Personal Contact",
      };
      const exists = saved.some((c) => c.phone === profileContact.phone);
      setContacts(exists ? saved : [profileContact, ...saved]);
    } else {
      setContacts(saved);
    }
  }, [user]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    // countdown === 0
    setSosActive(true);
    setCountdown(null);
    const reset = setTimeout(() => setSosActive(false), 5000);
    return () => clearTimeout(reset);
  }, [countdown]);

  const addContact = () => {
    if (newContact.name && newContact.phone) {
      const contact: EmergencyContact = { id: Date.now().toString(), ...newContact };
      const updated = [...contacts, contact];
      setContacts(updated);
      storageService.saveEmergencyContacts(updated.filter((c) => c.id !== "profile"));
      setNewContact({ name: "", phone: "", relationship: "" });
      setShowAddForm(false);
    }
  };

  const deleteContact = (id: string) => {
    if (id === "1") return;
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    storageService.saveEmergencyContacts(updated.filter((c) => c.id !== "profile"));
  };

  const call = (phone: string) => window.open(`tel:${phone}`, "_blank");

  const quickCall = [
    { label: "911", sub: "Emergency Services", phone: "911", Icon: Phone },
    { label: "Poison Control", sub: "1-800-222-1222", phone: "1-800-222-1222", Icon: Heart },
    { label: "Crisis Hotline", sub: "988", phone: "988", Icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <GlassCard
        className={countdown !== null || sosActive ? "ring-2 ring-red-500/40" : ""}
      >
        <div className="py-6 text-center">
          {countdown !== null ? (
            <div>
              <p className="mb-2 font-medium text-red-100">SOS will be triggered in:</p>
              <p className="text-6xl font-medium text-red-100">{countdown}</p>
              <GlassButton
                variant="ghost"
                onClick={() => {
                  setCountdown(null);
                  setSosActive(false);
                }}
                className="mt-4"
              >
                <X className="h-4 w-4" /> Cancel
              </GlassButton>
            </div>
          ) : sosActive ? (
            <div>
              <div className="mx-auto mb-4 flex h-16 w-16 animate-ping items-center justify-center rounded-full bg-red-500/25">
                <AlertTriangle className="h-8 w-8 text-red-100" />
              </div>
              <p className="mb-2 text-xl font-medium text-red-100">SOS Activated</p>
              <p className="text-white/60">Emergency contacts are being notified with your location…</p>
            </div>
          ) : (
            <>
              <button
                onClick={() => setCountdown(5)}
                aria-label="Activate emergency SOS"
                className="liquid-glass-strong sos-pulse mx-auto mb-6 flex h-32 w-32 flex-col items-center justify-center rounded-full bg-red-500/15 text-red-100 shadow-red-500/20 transition-all hover:scale-105 hover:bg-red-500/25 active:scale-95"
              >
                <AlertTriangle className="mb-1 h-10 w-10" strokeWidth={1.75} />
                <span className="text-lg font-semibold tracking-wide">SOS</span>
              </button>
              <h2 className="mb-2 text-xl font-medium text-white">Emergency SOS</h2>
              <p className="mx-auto max-w-md text-sm text-white/60">
                Press the SOS button to alert your emergency contacts. Your location will be shared
                automatically.
              </p>
            </>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle icon={<Phone className="h-5 w-5 text-white" strokeWidth={1.5} />}>
          Quick Call
        </SectionTitle>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickCall.map(({ label, sub, phone, Icon }) => (
            <button
              key={label}
              onClick={() => call(phone)}
              className="flex items-center gap-3 rounded-xl bg-white/5 p-4 text-left transition hover:bg-white/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-white">{label}</p>
                <p className="text-xs text-white/50">{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle icon={<User className="h-5 w-5 text-white" strokeWidth={1.5} />}>
            Emergency Contacts
          </SectionTitle>
          <GlassButton onClick={() => setShowAddForm((s) => !s)}>
            <Plus className="h-4 w-4" /> Add Contact
          </GlassButton>
        </div>

        {showAddForm && (
          <div className="mb-5 grid grid-cols-1 gap-3 border-b border-white/10 pb-5 md:grid-cols-3">
            <GlassInput
              placeholder="Name"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
            />
            <GlassInput
              placeholder="Phone"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            />
            <div className="flex gap-2">
              <GlassInput
                placeholder="Relationship"
                value={newContact.relationship}
                onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                className="flex-1"
              />
              <GlassButton onClick={addContact}>Add</GlassButton>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl bg-white/5 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <User className="h-5 w-5 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-medium text-white">{c.name}</p>
                  <p className="text-sm text-white/50">
                    {c.phone}
                    {c.relationship ? ` · ${c.relationship}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => call(c.phone)}
                  aria-label={`Call ${c.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <Phone className="h-4 w-4" />
                </button>
                {c.id !== "1" && c.id !== "profile" && (
                  <button
                    onClick={() => deleteContact(c.id)}
                    aria-label={`Delete ${c.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-white/70" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-white">Location Sharing</p>
            <p className="text-xs text-white/50">
              When SOS is triggered, your current location will be shared with your emergency
              contacts to help them find you quickly.
            </p>
          </div>
        </div>
      </GlassCard>

      {user.bloodType && (
        <GlassCard>
          <SectionTitle icon={<Heart className="h-5 w-5 text-white" strokeWidth={1.5} />}>
            Medical Information
          </SectionTitle>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-xs text-white/50">Blood Type</p>
              <p className="font-medium text-white">{user.bloodType}</p>
            </div>
            {user.allergies && user.allergies.length > 0 && !user.allergies.includes("None") && (
              <div className="col-span-2">
                <p className="text-xs text-white/50">Allergies</p>
                <p className="font-medium text-white">{user.allergies.join(", ")}</p>
              </div>
            )}
            {user.conditions && user.conditions.length > 0 && !user.conditions.includes("None") && (
              <div className="col-span-2">
                <p className="text-xs text-white/50">Conditions</p>
                <p className="font-medium text-white">{user.conditions.join(", ")}</p>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
