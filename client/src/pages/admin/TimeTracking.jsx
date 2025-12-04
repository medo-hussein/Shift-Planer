import { useState, useEffect } from "react";
import { User, Download, Funnel, Eye, Clock, Calendar, X, Timer, Coffee } from "lucide-react";
import { attendanceService } from "../../api/services/admin/attendanceService";
import { useLoading } from "../../contexts/LoaderContext";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";

export default function TimeTracking() {

  const [isLive, setIsLive] = useState(true);
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const { show, hide } = useLoading();

  const fetchData = async () => {
    try {
      show();
      const res = await attendanceService.getBranchAttendance(selectedDate);
      setRecords(res.data.records || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      hide();
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const filteredRecords = records.filter(record => {
    if (filterStatus !== "all" && record.status !== filterStatus) return false;
    
    if (isLive) {
      return record.check_in && !record.check_out;
    }
    return true;
  });

  // Helper Functions
  const formatTime = (dateStr) => {
    if (!dateStr) return "--:--";
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn) return "0h";
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const diff = Math.abs(end - start) / 36e5; // hours
    return `${diff.toFixed(1)}h`;
  };

  const getStatusInfo = (record) => {
    if (!record.check_in) return { text: "Absent", bg: "bg-red-100", color: "text-red-700" };
    if (record.check_out) return { text: "Approved", bg: "bg-green-100", color: "text-green-700" };
    
    // Check Break
    const activeBreak = record.breaks?.find(b => b.start && !b.end);
    if (activeBreak) return { text: "On Break", bg: "bg-yellow-100", color: "text-yellow-700", icon: <Coffee size={14}/> };

    return { text: "Working", bg: "bg-blue-100", color: "text-blue-700", icon: <Timer size={14}/> };
  };

  // Actions 
  const handleExport = () => {
    if (filteredRecords.length === 0) return toast.error("No data to export");
    try {
      const data = filteredRecords.map(r => ({
        Name: r.user_id?.name,
        Date: new Date(r.date).toLocaleDateString(),
        In: formatTime(r.check_in),
        Out: r.check_out ? formatTime(r.check_out) : "Active",
        Status: r.status
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      XLSX.writeFile(wb, `Attendance_${selectedDate}.xlsx`);
      toast.success("Exported successfully");
    } catch (e) { toast.error("Export failed"); }
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setOpenModal(true);
  };

  return (
    <>
      <Toaster position="top-center" />

      <div className="min-h-screen bg-gray-50 p-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800">Time Tracking</h1>
            <p className="text-gray-600">Monitor employee clock in/out and manage time cards</p>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <button onClick={handleExport} className="px-3 py-1.5 rounded-md text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 flex items-center gap-1 shadow-sm transition">
              <Download className="w-4" /> Export
            </button>
            
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 rounded-md border flex items-center gap-1 shadow-sm transition ${
                    showFilters 
                    ? "bg-blue-50 text-blue-700 border-blue-200" 
                    : "text-gray-700 bg-white hover:bg-gray-100 border-gray-200"
                }`}
            >
              <Funnel className="w-4" /> Filters
            </button>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex w-full mb-6 bg-gray-200 p-1 rounded-lg max-w-md">
          <button
            className={`flex-1 py-2 rounded-md font-medium transition-all ${
              isLive ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setIsLive(true)}
          >
            Live Time Clock
          </button>
          <button
            className={`flex-1 py-2 rounded-md font-medium transition-all ${
              !isLive ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setIsLive(false)}
          >
            Time Cards
          </button>
        </div>

        {/* --- FILTERS SECTION (Collapsible) --- */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm animate-fadeIn">
             <div className="flex flex-wrap gap-4 items-center">
                <span className="text-sm font-medium text-gray-600">Filter By Status:</span>
                <div className="flex gap-2">
                    {['all', 'present', 'late', 'absent'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition ${
                                filterStatus === status
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
             </div>
          </div>
        )}

        {/* --- CONTENT: LIVE VIEW --- */}
        {isLive ? (
          <div className="bg-white shadow-sm rounded-lg p-6 min-h-[400px]">
            <div className="flex items-center gap-2 mb-6">
              <User className="text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-800">
                Currently Working ({filteredRecords.length})
              </h2>
            </div>

            <div className="space-y-4">
              {filteredRecords.length > 0 ? filteredRecords.map((record) => {
                const status = getStatusInfo(record);
                return (
                  <div key={record._id} className="card border border-sky-100 shadow-sm rounded-lg p-4 flex flex-col md:flex-row items-center justify-between hover:bg-blue-50 transition">
                    
                    {/* Employee Details */}
                    <div className="flex items-center gap-3 w-full md:w-auto mb-3 md:mb-0">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 text-lg">
                        {record.user_id?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{record.user_id?.name}</p>
                        <p className="text-gray-500 text-sm">{record.user_id?.position || "Employee"}</p>
                        <p className="text-gray-400 text-xs">{record.user_id?.email}</p>
                      </div>
                    </div>

                    {/* Timing & Status */}
                    <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                      <div className="flex flex-col text-center md:text-left">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Start Time</p>
                        <p className="font-semibold text-gray-800">{formatTime(record.check_in)}</p>
                      </div>

                      <div className="text-center md:text-right">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Duration</p>
                        <p className="font-semibold text-gray-800">
                          {calculateDuration(record.check_in, null)}
                        </p>
                      </div>

                      <div className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm ${
                          status.text === "On Break" 
                          ? "bg-yellow-50 text-yellow-700 border border-yellow-200" 
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                         {status.icon}
                         {status.text === "On Break" ? "Paused (Break)" : "Tracking..."}
                      </div>

                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-10 text-gray-400">
                    <p>No active employees found right now.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
        // --- CONTENT: TIME CARDS VIEW ---
          <div className="bg-white shadow-sm rounded-lg p-6 min-h-[400px]">
            <div className="bg-white p-1 rounded-xl">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-semibold text-gray-900">Time Card Management</h2>
              </div>

              <div className="space-y-4">
                {filteredRecords.length > 0 ? filteredRecords.map((record) => {
                    const status = getStatusInfo(record);
                    return (
                        <div key={record._id} className="card border border-sky-100 shadow-sm rounded-lg p-4 flex flex-col md:flex-row items-center justify-between hover:bg-blue-50 transition">
                            <div className="flex-1 w-full">
                                <div className="flex gap-3 items-center mb-1">
                                    <h3 className="font-semibold text-gray-800">{record.user_id?.name}</h3>
                                    <span className={`${status.bg} ${status.color} text-xs px-2 py-1 rounded-full capitalize`}>
                                        {record.status}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm flex items-center gap-2">
                                   <Calendar size={14} /> {new Date(record.date).toLocaleDateString()} 
                                   <span className="mx-1">•</span> 
                                   <Clock size={14} /> {formatTime(record.check_in)} - {record.check_out ? formatTime(record.check_out) : "Active"}
                                   <span className="font-bold ml-1">( {record.total_hours || calculateDuration(record.check_in, record.check_out) } H )</span>
                                </p>
                            </div>

                            <div className="flex gap-3 mt-3 md:mt-0 w-full md:w-auto justify-end">
                                <button 
                                    onClick={() => handleView(record)}
                                    className="px-3 py-1.5 rounded-md text-gray-700 hover:bg-gray-100 flex items-center gap-1 shadow-sm border border-gray-200 transition"
                                >
                                    <Eye className="w-4" /> View
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-10 text-gray-400">
                        <Calendar size={40} className="mb-2 opacity-20 mx-auto"/>
                        <p>No records found for this date.</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL --- */}
      {openModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl relative">
            <button 
                onClick={() => setOpenModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
            >
                <X size={20} />
            </button>

            <h2 className="text-lg font-semibold mb-6 text-gray-800 border-b pb-3">Time Card Details</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                    <h3 className="font-semibold text-gray-700 mb-1 text-sm">Employee</h3>
                    <p className="text-gray-900 font-medium">{selectedRecord.user_id?.name}</p>
                    <p className="text-gray-500 text-xs">{selectedRecord.user_id?.email}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-700 mb-1 text-sm">Summary</h3>
                    <p className="text-gray-900 text-sm">Date: {new Date(selectedRecord.date).toLocaleDateString()}</p>
                    <p className="text-gray-900 text-sm">Total: {selectedRecord.total_hours || 0} hrs</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                    <p className="text-gray-500 text-xs uppercase font-bold mb-1">Clock In</p>
                    <p className="font-mono text-blue-600 font-bold">{formatTime(selectedRecord.check_in)}</p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs uppercase font-bold mb-1">Clock Out</p>
                    <p className="font-mono text-blue-600 font-bold">{formatTime(selectedRecord.check_out)}</p>
                </div>
            </div>

            {selectedRecord.notes && (
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2 text-sm">Notes</h3>
                    <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 border border-blue-100 italic">
                        "{selectedRecord.notes}"
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-2">
                <button 
                    onClick={() => setOpenModal(false)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
                >
                    Close
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}