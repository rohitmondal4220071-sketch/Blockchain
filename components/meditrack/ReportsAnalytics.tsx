"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { Activity, BarChart3, CheckCircle2, Download, Droplets, FileText, Pill } from "lucide-react";
import { storageService } from "@/lib/storage";
import { BarChart, GlassButton, GlassCard, SectionTitle, StatTile } from "./ui";

export function ReportsAnalytics() {
  const [medicineStats, setMedicineStats] = useState({ taken: 0, total: 0, percentage: 0 });
  const [weeklyWater, setWeeklyWater] = useState<{ day: string; amount: number; goal: number }[]>([]);
  const [bmiRecords, setBmiRecords] = useState<{ date: string; bmi: number }[]>([]);
  const [prescriptionCount, setPrescriptionCount] = useState(0);

  useEffect(() => {
    setMedicineStats(storageService.getMedicationAdherenceStats());
    setWeeklyWater(storageService.getWeeklyWaterStats());
    setBmiRecords(storageService.getBMIRecords());
    setPrescriptionCount(storageService.getPrescriptions().length);
  }, []);

  const weeklyAdherence = [
    { day: "Mon", rate: 100 },
    { day: "Tue", rate: 80 },
    { day: "Wed", rate: 100 },
    { day: "Thu", rate: 60 },
    { day: "Fri", rate: 100 },
    { day: "Sat", rate: 90 },
    { day: "Sun", rate: medicineStats.percentage },
  ];

  const avgAdherence = Math.round(weeklyAdherence.reduce((s, d) => s + d.rate, 0) / weeklyAdherence.length);
  const avgWater =
    weeklyWater.length > 0 ? Math.round(weeklyWater.reduce((s, d) => s + d.amount, 0) / weeklyWater.length) : 0;

  const healthScore = Math.round(
    avgAdherence * 0.4 +
      Math.min((avgWater / 2500) * 100, 100) * 0.3 +
      (bmiRecords.length > 0 && bmiRecords[0].bmi >= 18.5 && bmiRecords[0].bmi < 25 ? 100 : 70) * 0.3
  );

  const circumference = 2 * Math.PI * 70;

  const generateReport = () => {
    const profile = storageService.getUserProfile();
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;

    // ---- Header band ----
    doc.setFillColor(17, 17, 17);
    doc.rect(0, 0, pageWidth, 90, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("MediScan AI", margin, 46);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(180, 180, 180);
    doc.text("Health Report & Analytics", margin, 66);
    doc.setFontSize(9);
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      pageWidth - margin,
      66,
      { align: "right" }
    );

    y = 124;
    doc.setTextColor(40, 40, 40);

    // ---- Patient line ----
    if (profile) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Patient: ${profile.name}`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(110, 110, 110);
      doc.text(profile.email, margin, y + 16);
      y += 40;
      doc.setTextColor(40, 40, 40);
    }

    // ---- Overall health score box ----
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, contentWidth, 60, 8, 8, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Overall Health Score", margin + 16, y + 28);
    doc.setFontSize(26);
    doc.text(`${healthScore}/100`, pageWidth - margin - 16, y + 36, { align: "right" });
    y += 90;

    // Section helper
    const section = (title: string, rows: [string, string][]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(20, 20, 20);
      doc.text(title, margin, y);
      y += 8;
      doc.setDrawColor(225, 225, 225);
      doc.line(margin, y, pageWidth - margin, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      rows.forEach(([label, value]) => {
        doc.setTextColor(110, 110, 110);
        doc.text(label, margin + 6, y);
        doc.setTextColor(30, 30, 30);
        doc.text(String(value), pageWidth - margin - 6, y, { align: "right" });
        y += 20;
      });
      y += 12;
    };

    section("Medication Adherence", [
      ["Weekly Average", `${avgAdherence}%`],
      ["Medications Tracked", `${medicineStats.total}`],
      ["Medications Taken Today", `${medicineStats.taken}`],
      ["Prescriptions Scanned", `${prescriptionCount}`],
    ]);

    section("Hydration", [
      ["Weekly Average", `${avgWater} ml/day`],
      ["Daily Goal", "2500 ml"],
      ["Achievement Rate", `${Math.round((avgWater / 2500) * 100)}%`],
    ]);

    section("BMI Tracking", [
      ["Latest BMI", bmiRecords.length > 0 ? `${bmiRecords[0].bmi}` : "N/A"],
      ["Records", `${bmiRecords.length} entries`],
    ]);

    // ---- Disclaimer footer ----
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(225, 225, 225);
    doc.line(margin, pageHeight - 70, pageWidth - margin, pageHeight - 70);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    const disclaimer = doc.splitTextToSize(
      "Disclaimer: This report is for informational purposes only and does not replace professional medical advice. Always consult a certified healthcare provider.",
      contentWidth
    );
    doc.text(disclaimer, margin, pageHeight - 52);

    doc.save(`mediscan-report-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const breakdown = [
    { label: "Medication Adherence", value: avgAdherence, Icon: Pill },
    { label: "Hydration Level", value: Math.round(Math.min((avgWater / 2500) * 100, 100)), Icon: Droplets },
    {
      label: "BMI Health",
      value: bmiRecords.length > 0 ? (bmiRecords[0].bmi >= 18.5 && bmiRecords[0].bmi < 25 ? 100 : 70) : 0,
      Icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <BarChart3 className="h-6 w-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Health Reports &amp; Analytics</h2>
              <p className="text-sm text-white/60">Track your progress and generate detailed reports.</p>
            </div>
          </div>
          <GlassButton onClick={generateReport}>
            <Download className="h-4 w-4" /> Download PDF
          </GlassButton>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="relative h-40 w-40">
            <svg className="h-full w-full -rotate-90">
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - healthScore / 100)}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-medium text-white">{healthScore}</p>
              <p className="text-sm text-white/50">Health Score</p>
            </div>
          </div>

          <div className="w-full flex-1">
            <h3 className="mb-4 font-medium text-white">Score Breakdown</h3>
            <div className="space-y-3">
              {breakdown.map(({ label, value, Icon }) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="flex items-center gap-2 text-white/60">
                      <Icon className="h-4 w-4" /> {label}
                    </span>
                    <span className="font-medium text-white">{value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white/70 transition-all duration-500"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <SectionTitle icon={<Pill className="h-5 w-5 text-white" strokeWidth={1.5} />}>
            Weekly Medication Adherence
          </SectionTitle>
          <div className="mt-4">
            <BarChart
              data={weeklyAdherence.map((d) => ({ label: d.day, value: d.rate, max: 100 }))}
              unitDivisor={1}
              unitSuffix="%"
            />
          </div>
        </GlassCard>
        <GlassCard>
          <SectionTitle icon={<Droplets className="h-5 w-5 text-white" strokeWidth={1.5} />}>
            Weekly Hydration
          </SectionTitle>
          <div className="mt-4">
            <BarChart
              data={weeklyWater.map((d) => ({ label: d.day, value: d.amount, max: d.goal }))}
              unitDivisor={1000}
              unitSuffix="L"
            />
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Medicines" value={medicineStats.total} icon={<Pill className="h-5 w-5 text-white" strokeWidth={1.5} />} />
        <StatTile label="Prescriptions" value={prescriptionCount} icon={<FileText className="h-5 w-5 text-white" strokeWidth={1.5} />} />
        <StatTile label="Avg. Water" value={`${(avgWater / 1000).toFixed(1)}L`} icon={<Droplets className="h-5 w-5 text-white" strokeWidth={1.5} />} />
        <StatTile label="BMI Records" value={bmiRecords.length} icon={<CheckCircle2 className="h-5 w-5 text-white" strokeWidth={1.5} />} />
      </div>
    </div>
  );
}
