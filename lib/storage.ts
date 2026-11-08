// MediScan AI - Local Storage Service
// Ported from the reference project. Provides persistent data storage across
// browser sessions. Pure TypeScript, framework-agnostic.

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  onboardingComplete: boolean;
  // Personal info
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  bloodType?: string;
  // Health info
  height?: number; // in cm
  weight?: number; // in kg
  allergies?: string[];
  conditions?: string[];
  // Emergency contact
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  // Health goals
  healthGoals?: string[];
  activityLevel?: string;
  dietaryPreferences?: string[];
}

export type MedicineSlot = "morning" | "afternoon" | "night";
export type MedicineFoodTiming = "before" | "after" | "any";
export type MedicineStatus = "pending" | "taken" | "missed";

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  taken: boolean;
  takenAt?: string;
  notes?: string;
  prescriptionId?: string;
  // Extended fields (optional for backward compatibility)
  slot?: MedicineSlot;
  foodTiming?: MedicineFoodTiming;
  duration?: string;
  status?: MedicineStatus;
}

export interface Prescription {
  id: string;
  imageUrl?: string;
  extractedText: string;
  medicines: Medicine[];
  doctorName?: string;
  hospitalName?: string;
  date: string;
  createdAt: string;
  symptoms?: string;
  diagnosis?: string;
}

export interface XRayAnalysis {
  id: string;
  imageUrl?: string;
  bodyPart: string;
  confidence: number; // 0-100
  // Bounding box as fractions (0-1) of image dimensions
  box: { x: number; y: number; width: number; height: number };
  createdAt: string;
}

export interface WaterLog {
  date: string;
  amount: number; // in ml
  goal: number; // in ml
}

export interface BMIRecord {
  date: string;
  bmi: number;
  weight: number;
  height: number;
}

export interface HealthStat {
  date: string;
  heartRate?: number;
  steps?: number;
  sleepHours?: number;
  calories?: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const STORAGE_KEYS = {
  USER_PROFILE: "mediscan_user_profile",
  MEDICINES: "mediscan_medicines",
  PRESCRIPTIONS: "mediscan_prescriptions",
  WATER_LOGS: "mediscan_water_logs",
  BMI_RECORDS: "mediscan_bmi_records",
  HEALTH_STATS: "mediscan_health_stats",
  EMERGENCY_CONTACTS: "mediscan_emergency_contacts",
  CHAT_HISTORY: "mediscan_chat_history",
  XRAY_ANALYSES: "mediscan_xray_analyses",
};

class StorageService {
  private isClient = typeof window !== "undefined";

  private get<T>(key: string): T | null {
    if (!this.isClient) return null;
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch {
      return null;
    }
  }

  private set<T>(key: string, value: T): void {
    if (!this.isClient) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Storage error:", error);
    }
  }

  private remove(key: string): void {
    if (!this.isClient) return;
    localStorage.removeItem(key);
  }

  // User Profile
  getUserProfile(): UserProfile | null {
    return this.get<UserProfile>(STORAGE_KEYS.USER_PROFILE);
  }

  saveUserProfile(profile: UserProfile): void {
    this.set(STORAGE_KEYS.USER_PROFILE, profile);
  }

  clearUserProfile(): void {
    this.remove(STORAGE_KEYS.USER_PROFILE);
  }

  // Medicines
  getMedicines(): Medicine[] {
    return this.get<Medicine[]>(STORAGE_KEYS.MEDICINES) || [];
  }

  saveMedicines(medicines: Medicine[]): void {
    this.set(STORAGE_KEYS.MEDICINES, medicines);
  }

  addMedicine(medicine: Medicine): void {
    const medicines = this.getMedicines();
    medicines.push(medicine);
    this.saveMedicines(medicines);
  }

  updateMedicine(id: string, updates: Partial<Medicine>): void {
    const medicines = this.getMedicines();
    const index = medicines.findIndex((m) => m.id === id);
    if (index !== -1) {
      medicines[index] = { ...medicines[index], ...updates };
      this.saveMedicines(medicines);
    }
  }

  deleteMedicine(id: string): void {
    const medicines = this.getMedicines().filter((m) => m.id !== id);
    this.saveMedicines(medicines);
  }

  // Prescriptions
  getPrescriptions(): Prescription[] {
    return this.get<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS) || [];
  }

  savePrescription(prescription: Prescription): void {
    const prescriptions = this.getPrescriptions();
    prescriptions.unshift(prescription);
    this.set(STORAGE_KEYS.PRESCRIPTIONS, prescriptions);
  }

  deletePrescription(id: string): void {
    const prescriptions = this.getPrescriptions().filter((p) => p.id !== id);
    this.set(STORAGE_KEYS.PRESCRIPTIONS, prescriptions);
  }

  // X-Ray Analyses
  getXRayAnalyses(): XRayAnalysis[] {
    return this.get<XRayAnalysis[]>(STORAGE_KEYS.XRAY_ANALYSES) || [];
  }

  saveXRayAnalysis(analysis: XRayAnalysis): void {
    const analyses = this.getXRayAnalyses();
    analyses.unshift(analysis);
    // Keep only last 20 (images can be large data URLs)
    this.set(STORAGE_KEYS.XRAY_ANALYSES, analyses.slice(0, 20));
  }

  deleteXRayAnalysis(id: string): void {
    const analyses = this.getXRayAnalyses().filter((a) => a.id !== id);
    this.set(STORAGE_KEYS.XRAY_ANALYSES, analyses);
  }

  // Water Logs
  getWaterLogs(): WaterLog[] {
    return this.get<WaterLog[]>(STORAGE_KEYS.WATER_LOGS) || [];
  }

  getTodayWaterLog(): WaterLog | null {
    const today = new Date().toISOString().split("T")[0];
    const logs = this.getWaterLogs();
    return logs.find((log) => log.date === today) || null;
  }

  updateWaterLog(amount: number, goal: number = 2500): void {
    const today = new Date().toISOString().split("T")[0];
    const logs = this.getWaterLogs();
    const existingIndex = logs.findIndex((log) => log.date === today);

    if (existingIndex !== -1) {
      logs[existingIndex].amount = amount;
      logs[existingIndex].goal = goal;
    } else {
      logs.push({ date: today, amount, goal });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const filtered = logs.filter((log) => new Date(log.date) >= thirtyDaysAgo);

    this.set(STORAGE_KEYS.WATER_LOGS, filtered);
  }

  // BMI Records
  getBMIRecords(): BMIRecord[] {
    return this.get<BMIRecord[]>(STORAGE_KEYS.BMI_RECORDS) || [];
  }

  addBMIRecord(record: BMIRecord): void {
    const records = this.getBMIRecords();
    records.unshift(record);
    this.set(STORAGE_KEYS.BMI_RECORDS, records.slice(0, 20));
  }

  // Health Stats
  getHealthStats(): HealthStat[] {
    return this.get<HealthStat[]>(STORAGE_KEYS.HEALTH_STATS) || [];
  }

  updateHealthStat(stat: Partial<HealthStat>): void {
    const today = new Date().toISOString().split("T")[0];
    const stats = this.getHealthStats();
    const existingIndex = stats.findIndex((s) => s.date === today);

    if (existingIndex !== -1) {
      stats[existingIndex] = { ...stats[existingIndex], ...stat };
    } else {
      stats.push({ date: today, ...stat });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const filtered = stats.filter((s) => new Date(s.date) >= thirtyDaysAgo);

    this.set(STORAGE_KEYS.HEALTH_STATS, filtered);
  }

  // Emergency Contacts
  getEmergencyContacts(): EmergencyContact[] {
    return (
      this.get<EmergencyContact[]>(STORAGE_KEYS.EMERGENCY_CONTACTS) || [
        { id: "1", name: "Emergency Services", phone: "911", relationship: "Emergency" },
      ]
    );
  }

  saveEmergencyContacts(contacts: EmergencyContact[]): void {
    this.set(STORAGE_KEYS.EMERGENCY_CONTACTS, contacts);
  }

  addEmergencyContact(contact: EmergencyContact): void {
    const contacts = this.getEmergencyContacts();
    contacts.push(contact);
    this.saveEmergencyContacts(contacts);
  }

  deleteEmergencyContact(id: string): void {
    const contacts = this.getEmergencyContacts().filter((c) => c.id !== id);
    this.saveEmergencyContacts(contacts);
  }

  // Chat History
  getChatHistory(): ChatMessage[] {
    return this.get<ChatMessage[]>(STORAGE_KEYS.CHAT_HISTORY) || [];
  }

  saveChatHistory(messages: ChatMessage[]): void {
    this.set(STORAGE_KEYS.CHAT_HISTORY, messages.slice(-100));
  }

  clearChatHistory(): void {
    this.remove(STORAGE_KEYS.CHAT_HISTORY);
  }

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => this.remove(key));
  }

  getMedicationAdherenceStats(): { taken: number; total: number; percentage: number } {
    const medicines = this.getMedicines();
    const taken = medicines.filter((m) => m.taken).length;
    const total = medicines.length;
    return {
      taken,
      total,
      percentage: total > 0 ? Math.round((taken / total) * 100) : 0,
    };
  }

  getWeeklyWaterStats(): { day: string; amount: number; goal: number }[] {
    const logs = this.getWaterLogs();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result: { day: string; amount: number; goal: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const log = logs.find((l) => l.date === dateStr);

      result.push({
        day: days[date.getDay()],
        amount: log?.amount || 0,
        goal: log?.goal || 2500,
      });
    }

    return result;
  }

  /**
   * Returns the stored profile, or creates a fresh one seeded from the given
   * email/name when none exists yet (used right after Firebase auth).
   */
  getOrCreateUserProfile(email: string, name?: string): UserProfile {
    const existing = this.getUserProfile();
    if (existing && existing.email === email) return existing;

    const profile: UserProfile = {
      id: Date.now().toString(),
      name: name || (email ? email.split("@")[0] : "User"),
      email,
      createdAt: new Date().toISOString(),
      onboardingComplete: false,
    };
    this.saveUserProfile(profile);
    return profile;
  }
}

export const storageService = new StorageService();
