import {
  LayoutDashboard,
  Users,
  UserCog,
  CalendarDays,
  Clock,
  BarChart3,
  Plane,
  FingerprintPattern,
} from "lucide-react";


// Shared Pages
import SA_Profile from "../shared/Profile";

// Super Admin Pages
import SA_Dashboard from "../pages/superadmin/Dashboard";
import SA_Teams from "../pages/superadmin/Teams";
import SA_Employees from "../pages/superadmin/Employees";
import SA_Reports from "../pages/superadmin/Reports";
import SA_TimeOffRequests from "../pages/superadmin/TimeOffRequests";

// Admin Pages
import A_Dashboard from "../pages/admin/Dashboard";
import A_Schedule from "../pages/admin/Schedule";
import A_Employees from "../pages/admin/Employees";
import A_TimeTracking from "../pages/admin/TimeTracking";
import A_TimeOff from "../pages/admin/TimeOff";
import A_Reports from "../pages/admin/Reports";

// Employee Pages
import E_Schedule from "../pages/employee/MySchedule";
import E_TimeTracking from "../pages/employee/TimeTracking";
import E_TimeOff from "../pages/employee/TimeOffRequests";

const routes = {

  super_admin: [
      { path: "/dashboard", element: SA_Dashboard, label: "Dashboard", icon: LayoutDashboard },
      { path: "/teams", element: SA_Teams, label: "Teams", icon: Users },
      { path: "/employees", element: SA_Employees, label: "Employees", icon: UserCog },
      { path: "/time-off", element: SA_TimeOffRequests, label: "Leave Requests", icon: Plane },
      { path: "/reports", element: SA_Reports, label: "Reports", icon: BarChart3 },
      { path: "/profile", element: SA_Profile, label: "Profile", icon: FingerprintPattern },
  ],

  admin: [
    { path: "/dashboard", element: A_Dashboard, label: "Dashboard", icon: LayoutDashboard },
    { path: "/schedule", element: A_Schedule, label: "Scheduler", icon: CalendarDays },
    { path: "/employees", element: A_Employees, label: "Employees", icon: Users },
    { path: "/time-tracking", element: A_TimeTracking, label: "Time Tracking", icon: Clock },
    { path: "/time-off", element: A_TimeOff, label: "Time Off", icon: Plane },
    { path: "/reports", element: A_Reports, label: "Reports", icon: BarChart3 },
    { path: "/profile", element: SA_Profile, label: "Profile", icon: FingerprintPattern },
  ],

  employee: [
      { path: "/dashboard", element: E_Schedule, label: "My Schedule", icon: CalendarDays },
      { path: "/time-tracking", element: E_TimeTracking, label: "Time Tracking", icon: Clock },
      { path: "/time-off", element: E_TimeOff, label: "Time Off Requests", icon: Plane },
      { path: "/profile", element: SA_Profile, label: "Profile", icon: FingerprintPattern },

  ]
};

export default routes;