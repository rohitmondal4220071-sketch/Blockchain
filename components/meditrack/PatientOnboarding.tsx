"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Heart, Phone, Target, User } from "lucide-react";
import { type UserProfile } from "@/lib/storage";
import { GlassButton, GlassInput } from "./ui";

interface PatientOnboardingProps {
  user: UserProfile;
  onComplete: (profileData: Partial<UserProfile>) => void;
  onSkip: () => void;
}

const steps = [
  { id: 1, title: "Personal Info", Icon: User },
  { id: 2, title: "Health Details", Icon: Heart },
  { id: 3, title: "Emergency Contact", Icon: Phone },
  { id: 4, title: "Health Goals", Icon: Target },
];

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];
const activityLevels = ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Extremely Active"];
const healthGoalOptions = [
  "Lose Weight",
  "Gain Weight",
  "Build Muscle",
  "Improve Fitness",
  "Better Sleep",
  "Reduce Stress",
  "Manage Chronic Condition",
  "Improve Diet",
];
const commonConditions = ["Diabetes", "Hypertension", "Heart Disease", "Asthma", "Arthritis", "Thyroid Disorder", "None"];
const commonAllergies = ["Penicillin", "Aspirin", "Ibuprofen", "Latex", "Peanuts", "Shellfish", "None"];

export function PatientOnboarding({ user, onComplete, onSkip }: PatientOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    dateOfBirth: "",
    gender: "",
    phone: "",
    bloodType: "",
    height: undefined,
    weight: undefined,
    allergies: [],
    conditions: [],
    emergencyContact: { name: "", phone: "", relationship: "" },
    healthGoals: [],
    activityLevel: "",
  });

  const update = (field: string, value: unknown) => setFormData((p) => ({ ...p, [field]: value }));
  const updateEC = (field: string, value: string) =>
    setFormData((p) => ({ ...p, emergencyContact: { ...p.emergencyContact!, [field]: value } }));

  const toggleArray = (field: "allergies" | "conditions" | "healthGoals", item: string) => {
    const current = formData[field] || [];
    if (item === "None") {
      update(field, ["None"]);
    } else {
      const filtered = current.filter((i) => i !== "None");
      update(field, filtered.includes(item) ? filtered.filter((i) => i !== item) : [...filtered, item]);
    }
  };

  const next = () => (currentStep < 4 ? setCurrentStep(currentStep + 1) : onComplete(formData));
  const back = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const pill = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      active ? "bg-white/20 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"
    }`;

  const block = (active: boolean) =>
    `rounded-xl p-3 text-sm font-medium transition ${
      active ? "bg-white/20 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"
    }`;

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-medium text-white">Complete Your Profile</h1>
          <p className="text-sm text-white/60">
            Help us personalize your health experience, {user.name}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 transition ${
                  currentStep === step.id
                    ? "bg-white/20 text-white"
                    : currentStep > step.id
                      ? "bg-white/10 text-white/80"
                      : "bg-white/5 text-white/40"
                }`}
              >
                {currentStep > step.id ? <Check className="h-4 w-4" /> : <step.Icon className="h-4 w-4" />}
                <span className="hidden text-sm font-medium sm:inline">{step.title}</span>
              </div>
              {index < steps.length - 1 && <div className="mx-1 h-0.5 w-8 bg-white/10" />}
            </div>
          ))}
        </div>

        <div className="liquid-glass-strong rounded-[2rem] p-6 md:p-8">
          <h2 className="mb-6 text-lg font-medium text-white">{steps[currentStep - 1].title}</h2>

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Date of Birth</label>
                  <GlassInput
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => update("dateOfBirth", e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Phone Number</label>
                  <GlassInput
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/60">Gender</label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {genderOptions.map((o) => (
                    <button key={o} type="button" onClick={() => update("gender", o)} className={block(formData.gender === o)}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/60">Blood Type</label>
                <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
                  {bloodTypes.map((t) => (
                    <button key={t} type="button" onClick={() => update("bloodType", t)} className={block(formData.bloodType === t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Height (cm)</label>
                  <GlassInput
                    type="number"
                    placeholder="e.g., 175"
                    value={formData.height || ""}
                    onChange={(e) => update("height", Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Weight (kg)</label>
                  <GlassInput
                    type="number"
                    placeholder="e.g., 70"
                    value={formData.weight || ""}
                    onChange={(e) => update("weight", Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/60">Known Allergies</label>
                <div className="flex flex-wrap gap-2">
                  {commonAllergies.map((a) => (
                    <button key={a} type="button" onClick={() => toggleArray("allergies", a)} className={pill(!!formData.allergies?.includes(a))}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/60">Medical Conditions</label>
                <div className="flex flex-wrap gap-2">
                  {commonConditions.map((c) => (
                    <button key={c} type="button" onClick={() => toggleArray("conditions", c)} className={pill(!!formData.conditions?.includes(c))}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-white/60">Contact Name</label>
                <GlassInput
                  placeholder="John Doe"
                  value={formData.emergencyContact?.name}
                  onChange={(e) => updateEC("name", e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/60">Phone Number</label>
                <GlassInput
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.emergencyContact?.phone}
                  onChange={(e) => updateEC("phone", e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/60">Relationship</label>
                <GlassInput
                  placeholder="e.g., Spouse, Parent, Sibling"
                  value={formData.emergencyContact?.relationship}
                  onChange={(e) => updateEC("relationship", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-white/60">What are your health goals?</label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {healthGoalOptions.map((g) => (
                    <button key={g} type="button" onClick={() => toggleArray("healthGoals", g)} className={pill(!!formData.healthGoals?.includes(g))}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/60">Activity Level</label>
                <div className="space-y-2">
                  {activityLevels.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => update("activityLevel", l)}
                      className={`flex w-full items-center justify-between rounded-xl p-4 text-left transition ${
                        formData.activityLevel === l ? "bg-white/20 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <span className="font-medium">{l}</span>
                      {formData.activityLevel === l && <Check className="h-5 w-5" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
            {currentStep > 1 ? (
              <GlassButton variant="ghost" onClick={back}>
                <ArrowLeft className="h-4 w-4" /> Back
              </GlassButton>
            ) : (
              <GlassButton variant="ghost" onClick={onSkip}>
                Skip for now
              </GlassButton>
            )}
            <GlassButton onClick={next}>
              {currentStep === 4 ? "Complete Setup" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
}
