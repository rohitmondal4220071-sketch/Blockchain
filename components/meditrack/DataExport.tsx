"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { storageService } from "@/lib/storage";
import { GlassButton, GlassCard } from "./ui";

export function DataExport() {
  const [exporting, setExporting] = useState(false);

  const exportData = () => {
    setExporting(true);
    try {
      const profile = storageService.getUserProfile();
      const medicines = storageService.getMedicines();
      const prescriptions = storageService.getPrescriptions();
      const waterLogs = storageService.getWeeklyWaterStats();
      const bmiRecords = storageService.getBMIRecords();
      const healthStats = storageService.getHealthStats();
      const emergencyContacts = storageService.getEmergencyContacts();
      const chatHistory = storageService.getChatHistory();

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 48;
      let y = 0;

      // Header
      doc.setFillColor(17, 17, 17);
      doc.rect(0, 0, pageWidth, 80, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("MediScan AI — My Health Data Export", margin, 45);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(180, 180, 180);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 65);

      y = 110;
      doc.setTextColor(40, 40, 40);

      // Profile
      if (profile) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Patient Profile", margin, y); y += 20;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Name: ${profile.name}`, margin, y); y += 14;
        doc.text(`Email: ${profile.email}`, margin, y); y += 14;
        if (profile.bloodType) { doc.text(`Blood Type: ${profile.bloodType}`, margin, y); y += 14; }
        if (profile.height && profile.weight) { doc.text(`Height: ${profile.height}cm, Weight: ${profile.weight}kg`, margin, y); y += 14; }
        if (profile.allergies?.length) { doc.text(`Allergies: ${profile.allergies.join(", ")}`, margin, y); y += 14; }
        if (profile.conditions?.length) { doc.text(`Conditions: ${profile.conditions.join(", ")}`, margin, y); y += 14; }
        y += 10;
      }

      // Medicines
      if (medicines.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Medicine Reminders", margin, y); y += 20;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        medicines.forEach(m => {
          if (y > 750) { doc.addPage(); y = 50; }
          doc.text(`• ${m.name} — ${m.dosage} — ${m.time} — ${m.taken ? "Taken" : "Pending"}`, margin, y);
          y += 14;
        });
        y += 10;
      }

      // Emergency Contacts
      if (emergencyContacts.length > 0) {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Emergency Contacts", margin, y); y += 20;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        emergencyContacts.forEach(c => {
          doc.text(`• ${c.name} — ${c.phone} (${c.relationship})`, margin, y); y += 14;
        });
        y += 10;
      }

      // BMI Records
      if (bmiRecords.length > 0) {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("BMI History", margin, y); y += 20;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        bmiRecords.slice(0, 10).forEach(r => {
          doc.text(`• ${r.date}: BMI ${r.bmi} (${r.weight}kg, ${r.height}cm)`, margin, y); y += 14;
        });
        y += 10;
      }

      // Water Stats
      if (waterLogs.length > 0) {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Weekly Water Intake", margin, y); y += 20;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        waterLogs.forEach(w => {
          doc.text(`• ${w.day}: ${w.amount}ml / ${w.goal}ml`, margin, y); y += 14;
        });
        y += 10;
      }

      // Prescriptions count
      if (prescriptions.length > 0) {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(`Prescriptions Scanned: ${prescriptions.length}`, margin, y); y += 20;
      }

      // Chat history count
      if (chatHistory.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`AI Assistant conversations: ${chatHistory.length} messages`, margin, y); y += 14;
      }

      // Footer disclaimer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text("This export is for personal records only. Always consult a healthcare provider for medical decisions.", margin, pageHeight - 30);

      doc.save(`mediscan-health-data-${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <FileText className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Export My Health Data</p>
            <p className="text-xs text-white/50">Download all your data as a PDF</p>
          </div>
        </div>
        <GlassButton onClick={exportData} disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? "Exporting…" : "Download PDF"}
        </GlassButton>
      </div>
    </GlassCard>
  );
}
