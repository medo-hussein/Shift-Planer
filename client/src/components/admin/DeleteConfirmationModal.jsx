import { X, AlertTriangle, User } from "lucide-react";

const DeleteConfirmationModal = ({ employee, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Delete Employee</h2>
              <p className="text-xs text-gray-600 dark:text-slate-400">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 dark:bg-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center shrink-0">
              {employee?.avatar ? (
                <img src={employee.avatar} alt={employee.name} className="w-12 h-12 rounded-full" />
              ) : (
                <User className="text-red-600 dark:text-red-400" size={20} />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-slate-100">{employee?.name}</p>
              <p className="text-sm text-gray-600 dark:text-slate-400">{employee?.email}</p>
              <p className="text-xs text-gray-500 dark:text-slate-500">{employee?.position}</p>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700 dark:text-red-400">
              Are you sure you want to delete this employee? All associated data including attendance records and shifts will be permanently removed.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 mb-4">
            <AlertTriangle size={14} className="text-red-500 dark:text-red-400 shrink-0" />
            <span>This action cannot be undone. Please confirm carefully.</span>
          </div>

          {/* Footer */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-3 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 transition-colors text-sm"
            >
              Delete Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;