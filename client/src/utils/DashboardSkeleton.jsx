export default function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-8 sm:space-y-10 min-h-screen dark:bg-slate-800">

      {/* ================= HERO ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-200 dark:bg-slate-700 h-40 sm:h-44 lg:h-52">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 dark:via-white/10 to-transparent animate-shimmer" />
        <div className="p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4">
          <div className="h-5 sm:h-6 w-48 sm:w-64 bg-slate-300 dark:bg-slate-600 rounded-lg" />
          <div className="h-4 sm:h-4 w-64 sm:w-96 bg-slate-300 dark:bg-slate-600 rounded-lg" />
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
            <div className="h-8 w-full sm:w-32 bg-slate-300 dark:bg-slate-600 rounded-full" />
            <div className="h-8 w-full sm:w-32 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3 sm:space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-10 sm:w-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="h-6 sm:h-8 w-20 sm:w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-3 sm:h-4 w-24 sm:w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          </div>
        ))}
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-8">

        {/* -------- TABLE -------- */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 sm:p-6 lg:p-6 space-y-4 sm:space-y-6">
          <div className="flex justify-between flex-col sm:flex-row gap-2 sm:gap-0">
            <div className="h-5 sm:h-6 w-36 sm:w-40 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-3 sm:h-4 w-20 sm:w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          </div>

          {/* Table rows */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 py-3"
            >
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 sm:h-4 w-24 sm:w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-2.5 sm:h-3 w-20 sm:w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
              <div className="h-4 sm:h-6 w-20 sm:w-24 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 sm:mt-0" />
            </div>
          ))}
        </div>

        {/* -------- SIDEBAR -------- */}
        <div className="space-y-4 sm:space-y-6">

          {/* Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 sm:p-6 space-y-3">
            <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-700 w-full"
              >
                <div className="h-10 w-10 bg-slate-200 dark:bg-slate-600 rounded-lg shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-600 rounded" />
                  <div className="h-2.5 w-20 bg-slate-200 dark:bg-slate-600 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className="bg-slate-200 dark:bg-slate-700 rounded-2xl p-4 sm:p-6 space-y-2 sm:space-y-3">
            <div className="h-4 w-28 bg-slate-300 dark:bg-slate-600 rounded" />
            <div className="h-3 w-full bg-slate-300 dark:bg-slate-600 rounded" />
            <div className="h-3 w-4/5 bg-slate-300 dark:bg-slate-600 rounded" />
          </div>

        </div>

      </div>
    </div>
  );
}
