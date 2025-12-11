import { useState } from "react";
import { X, Calendar, FileSpreadsheet, FileText, Sparkles, Loader2, Languages } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import ReactMarkdown from "react-markdown";
import { reportService } from "../../api/services/admin/reportService";
import { Alert } from "../../utils/alertService.js";
import { useTranslation } from "react-i18next";

function cleanInlineMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(.+?)\1/g, "$2");
}

function parseMarkdownForPDF(markdown) {
  if (!markdown) return [];
  const lines = markdown.split("\n");
  const blocks = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const headingMatch = trimmed.match(/^(#+)\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = cleanInlineMarkdown(headingMatch[2]);

      if (level === 1) blocks.push({ type: "h1", text });
      else if (level === 2) blocks.push({ type: "h2", text });
      else blocks.push({ type: "h3", text });
      return;
    }

    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      const text = cleanInlineMarkdown(bulletMatch[1]);
      blocks.push({ type: "bullet", text });
      return;
    }

    blocks.push({ type: "paragraph", text: cleanInlineMarkdown(trimmed) });
  });

  return blocks;
}

function renderMarkdownIntoPDF(doc, blocks, xPos, yPos, align) {
  blocks.forEach((block) => {
    if (block.type === "h1") {
      doc.setFontSize(18);
      doc.setFont("Tajawal", "normal");
      const wrapped = doc.splitTextToSize(block.text, 170);
      doc.text(wrapped, xPos, yPos, { align });
      yPos += wrapped.length * 7 + 4;
    } else if (block.type === "h2") {
      doc.setFontSize(15);
      doc.setFont("Tajawal", "normal");
      const wrapped = doc.splitTextToSize(block.text, 170);
      doc.text(wrapped, xPos, yPos, { align });
      yPos += wrapped.length * 7 + 3;
    } else if (block.type === "h3") {
      doc.setFontSize(13);
      doc.setFont("Tajawal", "normal");
      const wrapped = doc.splitTextToSize(block.text, 170);
      doc.text(wrapped, xPos, yPos, { align });
      yPos += wrapped.length * 7 + 3;
    } else if (block.type === "bullet") {
      doc.setFontSize(12);
      doc.setFont("Tajawal", "normal");
      const bulletText = "• " + block.text;
      const wrapped = doc.splitTextToSize(bulletText, 160);
      doc.text(wrapped, xPos, yPos, { align });
      yPos += wrapped.length * 6 + 2;
    } else if (block.type === "paragraph") {
      doc.setFontSize(12);
      doc.setFont("Tajawal", "normal");
      const wrapped = doc.splitTextToSize(block.text, 170);
      doc.text(wrapped, xPos, yPos, { align });
      yPos += wrapped.length * 6 + 4;
    }
  });

  return yPos;
}

export default function ReportDetailsModal({ report, onClose }) {
  const { t } = useTranslation();
  
  if (!report) return null;

  const { data, type, title } = report;

  const [aiSummary, setAiSummary] = useState(report.ai_summary || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [language, setLanguage] = useState("ar");

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      const reportId = report.id || report._id;
      const res = await reportService.generateAIAnalysis(reportId, language);
      setAiSummary(res.data.data.ai_summary);
    } catch (err) {
      console.error(err);
      Alert.error(t("admin.reports.errors.aiAnalysisFailed"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportExcel = () => {
    let sheetData = [];

    if (type === "attendance" && data.by_employee) {
      sheetData = data.by_employee.map((emp) => ({
        [t("admin.reports.tableHeaders.employee")]: emp.employee?.name || t("admin.common.notAvailable"),
        [t("admin.reports.tableHeaders.email")]: emp.employee?.email || t("admin.common.notAvailable"),
        [t("admin.reports.tableHeaders.totalHours")]: emp.total_worked_hours || 0,
        [t("admin.reports.tableHeaders.overtime")]: emp.overtime_hours || 0,
        [t("admin.reports.tableHeaders.lateCount")]: emp.late_count || 0,
        [t("admin.reports.tableHeaders.attendanceRate")]: emp.attendance_rate ? `${emp.attendance_rate}%` : "0%",
      }));
    } else if (type === "performance" && data.employees) {
      sheetData = data.employees.map((emp) => ({
        [t("admin.reports.tableHeaders.employee")]: emp.employee?.name || t("admin.common.notAvailable"),
        [t("admin.reports.tableHeaders.score")]: emp.performance_score != null ? `${emp.performance_score}%` : "0%",
        [t("admin.reports.tableHeaders.attendanceRate")]: emp.attendance?.rate != null ? `${emp.attendance.rate}%` : "0%",
        [t("admin.reports.tableHeaders.tasksRate")]: emp.shifts?.completion_rate != null ? `${emp.shifts.completion_rate}%` : "0%",
      }));
    } else if (type === "shift") {
      sheetData = [
        { [t("admin.reports.metrics.totalShifts")]: data.total_shifts || 0 },
        { [t("admin.reports.metrics.completed")]: data.by_status?.completed || 0 },
        { [t("admin.reports.metrics.scheduled")]: data.by_status?.scheduled || 0 },
        { [t("admin.reports.metrics.inProgress")]: data.by_status?.in_progress || 0 },
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t("admin.reports.sheetName"));
    XLSX.writeFile(workbook, `${(title || t("admin.reports.defaultTitle")).replace(/\s+/g, "_")}.xlsx`);
  };

  const handleExportPDF = async () => {
    try {
      document.body.style.cursor = "wait";

      const doc = new jsPDF();

      const fontUrl =
        "https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf";
      const fontResponse = await fetch(fontUrl);
      if (!fontResponse.ok) throw new Error(t("admin.reports.errors.fontFailed"));

      const fontBlob = await fontResponse.blob();
      const reader = new FileReader();

      reader.readAsDataURL(fontBlob);
      reader.onloadend = function () {
        const base64Font = reader.result.split(",")[1];

        doc.addFileToVFS("Tajawal-Regular.ttf", base64Font);
        doc.addFont("Tajawal-Regular.ttf", "Tajawal", "normal");
        doc.setFont("Tajawal", "normal");

        const isArabic = language === "ar";
        const align = isArabic ? "right" : "left";
        const xPos = isArabic ? 190 : 20;

        // Title + Date
        doc.setFontSize(22);
        doc.text(title || t("admin.reports.defaultTitle"), xPos, 22, { align });

        doc.setFontSize(10);
        const dateText = isArabic
          ? `${t("admin.reports.generatedDate")}: ${new Date().toLocaleDateString("ar-EG")}`
          : `${t("admin.reports.generatedDate")}: ${new Date().toLocaleDateString("en-US")}`;
        doc.text(dateText, xPos, 30, { align });

        let yPos = 45;

        // AI Summary
        if (aiSummary) {
          const aiTitle = isArabic ? t("admin.reports.aiSummary.ar") : t("admin.reports.aiSummary.en");
          doc.setFontSize(16);
          doc.text(aiTitle, xPos, yPos, { align });
          yPos += 10;

          const blocks = parseMarkdownForPDF(aiSummary);
          yPos = renderMarkdownIntoPDF(doc, blocks, xPos, yPos, align);
          yPos += 8;
        }

        // Table Section
        let tableHead = [];
        let tableBody = [];

        if (type === "attendance" && data.by_employee) {
          if (isArabic) {
            tableHead = [[
              t("admin.reports.attendanceTable.ar.rate"),
              t("admin.reports.attendanceTable.ar.late"),
              t("admin.reports.attendanceTable.ar.overtime"),
              t("admin.reports.attendanceTable.ar.hours"),
              t("admin.reports.attendanceTable.ar.employee"),
            ]];
            tableBody = data.by_employee.map((emp) => [
              emp.attendance_rate ? `${emp.attendance_rate}%` : "0%",
              emp.late_count || 0,
              emp.overtime_hours || 0,
              emp.total_worked_hours || 0,
              emp.employee?.name || t("admin.reports.unknown"),
            ]);
          } else {
            tableHead = [[
              t("admin.reports.attendanceTable.en.employee"),
              t("admin.reports.attendanceTable.en.hours"),
              t("admin.reports.attendanceTable.en.overtime"),
              t("admin.reports.attendanceTable.en.late"),
              t("admin.reports.attendanceTable.en.rate"),
            ]];
            tableBody = data.by_employee.map((emp) => [
              emp.employee?.name || t("admin.reports.unknown"),
              emp.total_worked_hours || 0,
              emp.overtime_hours || 0,
              emp.late_count || 0,
              emp.attendance_rate ? `${emp.attendance_rate}%` : "0%",
            ]);
          }
        } else if (type === "performance" && data.employees) {
          if (isArabic) {
            tableHead = [[
              t("admin.reports.performanceTable.ar.tasks"),
              t("admin.reports.performanceTable.ar.attendance"),
              t("admin.reports.performanceTable.ar.score"),
              t("admin.reports.performanceTable.ar.employee"),
            ]];
            tableBody = data.employees.map((emp) => [
              emp.shifts?.completion_rate != null
                ? `${emp.shifts.completion_rate}%`
                : "0%",
              emp.attendance?.rate != null ? `${emp.attendance.rate}%` : "0%",
              emp.performance_score != null
                ? `${emp.performance_score}%`
                : "0%",
              emp.employee?.name || t("admin.reports.unknown"),
            ]);
          } else {
            tableHead = [[
              t("admin.reports.performanceTable.en.employee"),
              t("admin.reports.performanceTable.en.score"),
              t("admin.reports.performanceTable.en.attendance"),
              t("admin.reports.performanceTable.en.tasks"),
            ]];
            tableBody = data.employees.map((emp) => [
              emp.employee?.name || t("admin.reports.unknown"),
              emp.performance_score != null ? `${emp.performance_score}%` : "0%",
              emp.attendance?.rate != null ? `${emp.attendance.rate}%` : "0%",
              emp.shifts?.completion_rate != null
                ? `${emp.shifts.completion_rate}%`
                : "0%",
            ]);
          }
        } else if (type === "shift") {
          if (isArabic) {
            tableHead = [[
              t("admin.reports.shiftTable.ar.value"),
              t("admin.reports.shiftTable.ar.metric"),
            ]];
            tableBody = [
              [data.total_shifts || 0, t("admin.reports.shiftTable.ar.totalShifts")],
              [data.by_status?.completed || 0, t("admin.reports.shiftTable.ar.completed")],
              [data.by_status?.scheduled || 0, t("admin.reports.shiftTable.ar.scheduled")],
              [data.by_status?.in_progress || 0, t("admin.reports.shiftTable.ar.inProgress")],
            ];
          } else {
            tableHead = [[
              t("admin.reports.shiftTable.en.metric"),
              t("admin.reports.shiftTable.en.value"),
            ]];
            tableBody = [
              [t("admin.reports.shiftTable.en.totalShifts"), data.total_shifts || 0],
              [t("admin.reports.shiftTable.en.completed"), data.by_status?.completed || 0],
              [t("admin.reports.shiftTable.en.scheduled"), data.by_status?.scheduled || 0],
              [t("admin.reports.shiftTable.en.inProgress"), data.by_status?.in_progress || 0],
            ];
          }
        }

        if (tableBody.length > 0) {
          autoTable(doc, {
            head: tableHead,
            body: tableBody,
            startY: yPos,
            theme: "grid",
            styles: {
              font: "Tajawal",
              halign: isArabic ? "right" : "left",
              fontSize: 10,
              cellPadding: 4,
              valign: "middle",
            },
            headStyles: {
              fillColor: [63, 81, 181],
              textColor: 255,
              halign: isArabic ? "right" : "left",
              fontStyle: "normal",
            },
          });
        }

        doc.save(`${(title || t("admin.reports.defaultTitle")).replace(/\s+/g, "_")}.pdf`);
        document.body.style.cursor = "default";
      };
    } catch (err) {
      console.error("PDF Error:", err);
      document.body.style.cursor = "default";
      alert(t("admin.reports.errors.pdfFailed"));
    }
  };

  const renderAttendanceDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label={t("admin.reports.stats.totalHours")} 
          value={data.total_worked_hours || 0} 
          color="blue" 
        />
        <StatCard
          label={t("admin.reports.stats.present")}
          value={data.summary?.present || data.present_count || 0}
          color="emerald"
        />
        <StatCard 
          label={t("admin.reports.stats.late")} 
          value={data.late_count || 0} 
          color="amber" 
        />
        <StatCard
          label={t("admin.reports.stats.attendanceRate")}
          value={`${data.attendance_rate || 0}%`}
          color="purple"
        />
      </div>

      {data.by_employee && (
        <TableContainer
          title={t("admin.reports.tables.employeeBreakdown")}
          headers={[
            t("admin.reports.tableHeaders.employee"),
            t("admin.reports.tableHeaders.hours"),
            t("admin.reports.tableHeaders.overtime"),
            t("admin.reports.tableHeaders.lateness"),
          ]}
        >
          {data.by_employee.map((emp, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="p-3 font-medium text-gray-900">
                {emp.employee?.name || t("admin.common.notAvailable")}
              </td>
              <td className="p-3">{emp.total_worked_hours}h</td>
              <td className="p-3 text-green-600">{emp.overtime_hours}h</td>
              <td className="p-3 text-red-500">{emp.late_count}</td>
            </tr>
          ))}
        </TableContainer>
      )}
    </div>
  );

  const renderShiftDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard 
          label={t("admin.reports.stats.totalShifts")} 
          value={data.total_shifts || 0} 
          color="slate" 
        />
        <StatCard 
          label={t("admin.reports.stats.completed")} 
          value={data.by_status?.completed || 0} 
          color="green" 
        />
        <StatCard 
          label={t("admin.reports.stats.scheduled")} 
          value={data.by_status?.scheduled || 0} 
          color="blue" 
        />
      </div>
    </div>
  );

  const renderPerformanceDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label={t("admin.reports.stats.avgPerformance")}
          value={`${data.averages?.avg_performance || 0}%`}
          color="purple"
        />
        <StatCard
          label={t("admin.reports.stats.avgAttendance")}
          value={`${data.averages?.avg_attendance || 0}%`}
          color="blue"
        />
      </div>

      {data.employees && (
        <TableContainer
          title={t("admin.reports.tables.performanceRanking")}
          headers={[
            t("admin.reports.tableHeaders.employee"),
            t("admin.reports.tableHeaders.score"),
            t("admin.reports.tableHeaders.attendance"),
            t("admin.reports.tableHeaders.tasks"),
          ]}
        >
          {data.employees.map((emp, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="p-3 font-medium text-gray-900">
                {emp.employee?.name || t("admin.common.notAvailable")}
              </td>
              <td className="p-3">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold text-xs">
                  {emp.performance_score}%
                </span>
              </td>
              <td className="p-3 text-slate-600">{emp.attendance?.rate}%</td>
              <td className="p-3 text-slate-600">{emp.shifts?.completion_rate}%</td>
            </tr>
          ))}
        </TableContainer>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-fadeIn flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{report.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
              <Calendar size={14} />
              {new Date(report.start_date).toLocaleDateString()} -{" "}
              {new Date(report.end_date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* AI Analysis Card */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100 relative overflow-hidden">
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="flex items-center gap-2 text-indigo-900">
                <Sparkles size={20} className="text-purple-600" />
                <h3 className="font-bold text-lg">{t("admin.reports.aiSmartAnalysis")}</h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/80 border border-indigo-200 rounded-lg px-2 py-1 h-9">
                  <Languages size={14} className="text-indigo-500 mr-2" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-indigo-700 font-medium cursor-pointer appearance-none pr-1"
                    disabled={isAnalyzing}
                  >
                    <option value="ar">{t("admin.reports.languages.arabic")}</option>
                    <option value="en">{t("admin.reports.languages.english")}</option>
                  </select>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-70 shadow-sm h-9"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> {t("admin.reports.analyzing")}
                    </>
                  ) : aiSummary ? (
                    `✨ ${t("admin.reports.regenerate")}`
                  ) : (
                    `✨ ${t("admin.reports.generateInsights")}`
                  )}
                </button>
              </div>
            </div>

            <div className="relative z-10">
              {isAnalyzing ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-indigo-200/50 rounded w-3/4"></div>
                  <div className="h-4 bg-indigo-200/50 rounded w-full"></div>
                  <div className="h-4 bg-indigo-200/50 rounded w-5/6"></div>
                </div>
              ) : aiSummary ? (
                <div
                  dir={language === "ar" ? "rtl" : "ltr"}
                  className={`prose prose-sm text-slate-700 max-w-none bg-white/50 p-4 rounded-lg border border-indigo-50 ${
                    language === "ar" ? "text-right" : "text-left"
                  }`}
                >
                  <ReactMarkdown>{aiSummary}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-indigo-800/70 italic">
                  {t("admin.reports.aiDescription")}
                </p>
              )}
            </div>

            <div className="absolute -right-6 -bottom-6 text-indigo-100 opacity-40 pointer-events-none">
              <Sparkles size={120} />
            </div>
          </div>

          {type === "attendance" && renderAttendanceDetails()}
          {type === "shift" && renderShiftDetails()}
          {type === "performance" && renderPerformanceDetails()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-medium"
            >
              <FileText size={16} /> {t("admin.reports.export.pdf")}
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition text-sm font-medium"
            >
              <FileSpreadsheet size={16} /> {t("admin.reports.export.excel")}
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            {t("admin.reports.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Small Components ----------
function StatCard({ label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 text-blue-900",
    emerald: "bg-emerald-50 text-emerald-600 text-emerald-900",
    amber: "bg-amber-50 text-amber-600 text-amber-900",
    purple: "bg-purple-50 text-purple-600 text-purple-900",
    slate: "bg-slate-50 text-slate-500 text-slate-800",
    green: "bg-green-50 text-green-600 text-green-800",
  };

  const colorString = colors[color] || colors["slate"];
  const [bg, labelC, valueC] = colorString.split(" ");

  return (
    <div className={`${bg} p-4 rounded-xl text-center`}>
      <p className={`text-xs ${labelC} font-semibold uppercase`}>{label}</p>
      <p className={`text-2xl font-bold ${valueC}`}>{value}</p>
    </div>
  );
}

function TableContainer({ title, headers, children }) {
  return (
    <div className="border rounded-xl overflow-hidden mt-4">
      <div className="bg-gray-50 px-4 py-2 border-b font-semibold text-gray-700 text-sm">
        {title}
      </div>
      <div className="max-h-60 overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white text-gray-500 font-medium sticky top-0 shadow-sm">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
}