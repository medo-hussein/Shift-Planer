import {
  LayoutDashboard,
  Users,
  UserCog,
  CalendarDays,
  Clock,
  BarChart3,
  Plane,
  FingerprintPattern,
  CreditCard,
  Building2,
  FileText,
  ArrowRightLeft, // ✅ Import Icon
} from "lucide-react";

// Shared Pages
import SharedProfile from "../shared/Profile";
import PaymentCallback from "../pages/shared/PaymentCallback";

// Platform Owner Pages
import PlatformDashboard from "../pages/platform/Dashboard";
import CompaniesPage from "../pages/platform/Companies";
import PlansPage from "../pages/platform/Plans";

// Super Admin Pages
import SA_Dashboard from "../pages/superadmin/Dashboard";
import SA_Teams from "../pages/superadmin/Teams";
import SA_Employees from "../pages/superadmin/Employees";
import SA_Reports from "../pages/superadmin/Reports";
import SA_TimeOffRequests from "../pages/superadmin/TimeOffRequests";
import SubscriptionPage from "../pages/superadmin/SubscriptionPage";

// Admin Pages
import A_Dashboard from "../pages/admin/Dashboard";
import A_Schedule from "../pages/admin/Schedule";
import A_Employees from "../pages/admin/Employees";
import A_TimeTracking from "../pages/admin/TimeTracking";
import A_TimeOff from "../pages/admin/TimeOff";
import A_Reports from "../pages/admin/Reports";
import SwapApprovals from "../pages/admin/SwapApprovals"; // ✅ Import Admin Page

// Employee Pages
import E_Dashboard from "../pages/employee/Dashboard";
import E_Schedule from "../pages/employee/MySchedule";
import E_TimeTracking from "../pages/employee/TimeTracking";
import E_TimeOff from "../pages/employee/TimeOffRequests";
import E_Reports from "../pages/employee/MyReports";
import E_SwapRequests from "../pages/employee/SwapRequests"; // ✅ Import Employee Page

const routes = {

  platform_owner: [
    { path: "/dashboard", element: PlatformDashboard, label: "Dashboard", icon: LayoutDashboard },
    { path: "/companies", element: CompaniesPage, label: "Companies", icon: Building2 },
    { path: "/plans", element: PlansPage, label: "Plans", icon: FileText },
    { path: "/profile", element: SharedProfile, label: "Profile", icon: FingerprintPattern },
    { path: "/payment/callback", element: PaymentCallback, label: "Payment Verification", icon: CreditCard, hidden: true },
  ],

  super_admin: [
    { path: "/dashboard", element: SA_Dashboard, label: "Dashboard", icon: LayoutDashboard },
    { path: "/teams", element: SA_Teams, label: "Teams", icon: Users },
    { path: "/employees", element: SA_Employees, label: "Employees", icon: UserCog },
    { path: "/time-off", element: SA_TimeOffRequests, label: "Leave Requests", icon: Plane },
    { path: "/reports", element: SA_Reports, label: "Reports", icon: BarChart3 },
    { path: "/subscription", element: SubscriptionPage, label: "Subscription", icon: CreditCard },
    { path: "/profile", element: SharedProfile, label: "Profile", icon: FingerprintPattern },
    { path: "/payment/callback", element: PaymentCallback, label: "Payment Verification", icon: CreditCard, hidden: true },
  ],

  admin: [
    { path: "/dashboard", element: A_Dashboard, label: "Dashboard", icon: LayoutDashboard },
    { path: "/schedule", element: A_Schedule, label: "Scheduler", icon: CalendarDays },
    { path: "/swaps", element: SwapApprovals, label: "Swap Approvals", icon: ArrowRightLeft }, // ✅ New Route for Admin
    { path: "/employees", element: A_Employees, label: "Employees", icon: Users },
    { path: "/time-tracking", element: A_TimeTracking, label: "Time Tracking", icon: Clock },
    { path: "/time-off", element: A_TimeOff, label: "Time Off", icon: Plane },
    { path: "/reports", element: A_Reports, label: "Reports", icon: BarChart3 },
    { path: "/profile", element: SharedProfile, label: "Profile", icon: FingerprintPattern },
  ],

  employee: [
    { path: "/dashboard", element: E_Dashboard, label: "Dashboard", icon: LayoutDashboard },
    { path: "/schedule", element: E_Schedule, label: "My Schedule", icon: CalendarDays },
    { path: "/swaps", element: E_SwapRequests, label: "Shift Swaps", icon: ArrowRightLeft }, // ✅ New Route for Employee
    { path: "/time-tracking", element: E_TimeTracking, label: "Time Tracking", icon: Clock },
    { path: "/time-off", element: E_TimeOff, label: "Time Off Requests", icon: Plane },
    { path: "/reports", element: E_Reports, label: "My Reports", icon: BarChart3 },
    { path: "/profile", element: SharedProfile, label: "Profile", icon: FingerprintPattern },
  ]
};

export default routes;