import React from "react";
import { X, Calendar, FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ 1. التعديل هنا: استيراد الدالة
import * as XLSX from "xlsx";

export default function ReportDetailsModal({ report, onClose }) {
  if (!report) return null;

  const { data, type, title } = report;

  // --- دوال التصدير (Export Functions) ---

  // 1. تصدير Excel
  const handleExportExcel = () => {
    let sheetData = [];

    // تجهيز الداتا حسب نوع التقرير
    if (type === 'attendance' && data.by_employee) {
      sheetData = data.by_employee.map(emp => ({
        Employee: emp.employee?.name || "N/A",
        Email: emp.employee?.email || "N/A",
        "Total Hours": emp.total_worked_hours || 0,
        "Overtime": emp.overtime_hours || 0,
        "Late Count": emp.late_count || 0,
        "Attendance Rate": emp.attendance_rate ? `${emp.attendance_rate}%` : "0%"
      }));
    } else if (type === 'performance' && data.employees) {
      sheetData = data.employees.map(emp => ({
        Employee: emp.employee?.name || "N/A",
        Score: emp.performance_score != null ? `${emp.performance_score}%` : "0%",
        "Attendance Rate": emp.attendance?.rate != null ? `${emp.attendance.rate}%` : "0%",
        "Tasks Rate": emp.shifts?.completion_rate != null ? `${emp.shifts.completion_rate}%` : "0%"
      }));
    } else if (type === 'shift') {
      sheetData = [
        { Metric: "Total Shifts", Value: data.total_shifts || 0 },
        { Metric: "Completed", Value: data.by_status?.completed || 0 },
        { Metric: "Scheduled", Value: data.by_status?.scheduled || 0 },
        { Metric: "In Progress", Value: data.by_status?.in_progress || 0 },
      ];
    }

    // إنشاء ملف الإكسيل
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${(title || "Report").replace(/\s+/g, '_')}.xlsx`);
  };

  // 2. تصدير PDF (النسخة المصححة)
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // العنوان
      doc.setFontSize(18);
      doc.text(title || "Report Details", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      let tableHead = [];
      let tableBody = [];

      // تجهيز الجدول حسب النوع
      if (type === 'attendance' && data.by_employee) {
        tableHead = [['Employee', 'Hours', 'Overtime', 'Late', 'Rate']];
        tableBody = data.by_employee.map(emp => [
          emp.employee?.name || "Unknown",
          emp.total_worked_hours || 0,
          emp.overtime_hours || 0,
          emp.late_count || 0,
          emp.attendance_rate ? `${emp.attendance_rate}%` : "0%"
        ]);
      } else if (type === 'performance' && data.employees) {
        tableHead = [['Employee', 'Score', 'Attendance', 'Tasks']];
        tableBody = data.employees.map(emp => [
          emp.employee?.name || "Unknown",
          emp.performance_score != null ? `${emp.performance_score}%` : "0%",
          emp.attendance?.rate != null ? `${emp.attendance.rate}%` : "0%",
          emp.shifts?.completion_rate != null ? `${emp.shifts.completion_rate}%` : "0%"
        ]);
      } else if (type === 'shift') {
        tableHead = [['Metric', 'Value']];
        tableBody = [
          ['Total Shifts', data.total_shifts || 0],
          ['Completed', data.by_status?.completed || 0],
          ['Scheduled', data.by_status?.scheduled || 0],
          ['In Progress', data.by_status?.in_progress || 0]
        ];
      }

      // رسم الجدول
      if (tableBody.length > 0) {
        // ✅ 2. التعديل هنا: استخدام دالة autoTable وتمرير doc لها
        autoTable(doc, {
          head: tableHead,
          body: tableBody,
          startY: 40,
          theme: 'grid',
          headStyles: { fillColor: [29, 41, 49] },
          styles: { fontSize: 10, cellPadding: 3 },
        });
        doc.save(`${(title || "Report").replace(/\s+/g, '_')}.pdf`);
      } else {
        alert("No detailed data available to export.");
      }

    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to generate PDF. Check console.");
    }
  };

  // --- مكونات العرض (Render Components) ---

  const renderAttendanceDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Hours" value={data.total_worked_hours || 0} color="blue" />
        <StatCard label="Present" value={data.summary?.present || data.present_count || 0} color="emerald" />
        <StatCard label="Late" value={data.late_count || 0} color="amber" />
        <StatCard label="Attendance Rate" value={`${data.attendance_rate || 0}%`} color="purple" />
      </div>
      {data.by_employee && (
        <TableContainer title="Employee Breakdown" headers={["Employee", "Hours", "Overtime", "Lateness"]}>
          {data.by_employee.map((emp, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="p-3 font-medium text-gray-900">{emp.employee?.name || "N/A"}</td>
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
        <StatCard label="Total Shifts" value={data.total_shifts || 0} color="slate" />
        <StatCard label="Completed" value={data.by_status?.completed || 0} color="green" />
        <StatCard label="Scheduled" value={data.by_status?.scheduled || 0} color="blue" />
      </div>
    </div>
  );

  const renderPerformanceDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Avg Performance" value={`${data.averages?.avg_performance || 0}%`} color="purple" />
        <StatCard label="Avg Attendance" value={`${data.averages?.avg_attendance || 0}%`} color="blue" />
      </div>
      {data.employees && (
        <TableContainer title="Performance Ranking" headers={["Employee", "Score", "Attendance", "Tasks"]}>
          {data.employees.map((emp, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="p-3 font-medium text-gray-900">{emp.employee?.name || "N/A"}</td>
              <td className="p-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold text-xs">{emp.performance_score}%</span></td>
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
        <div className="bg-white p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{report.title}</h2>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              <Calendar size={14} />
              {new Date(report.start_date).toLocaleDateString()} - {new Date(report.end_date).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {type === 'attendance' && renderAttendanceDetails()}
          {type === 'shift' && renderShiftDetails()}
          {type === 'performance' && renderPerformanceDetails()}
        </div>

        {/* Footer with Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          
          {/* Export Buttons */}
          <div className="flex gap-3">
            <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-medium"
            >
                <FileText size={16} /> PDF
            </button>
            <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition text-sm font-medium"
            >
                <FileSpreadsheet size={16} /> Excel
            </button>
          </div>

          <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components for clean code ---

function StatCard({ label, value, color }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600 text-blue-900",
        emerald: "bg-emerald-50 text-emerald-600 text-emerald-900",
        amber: "bg-amber-50 text-amber-600 text-amber-900",
        purple: "bg-purple-50 text-purple-600 text-purple-900",
        slate: "bg-slate-50 text-slate-500 text-slate-800",
        green: "bg-green-50 text-green-600 text-green-800"
    };
    
    // Fallback if color doesn't match
    const colorString = colors[color] || colors['slate'];
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
            <div className="bg-gray-50 px-4 py-2 border-b font-semibold text-gray-700 text-sm">{title}</div>
            <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-gray-500 font-medium sticky top-0 shadow-sm">
                        <tr>
                            {headers.map((h, i) => <th key={i} className="p-3">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
}