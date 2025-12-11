import { lazy } from "react";
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
  ArrowRightLeft,
} from "lucide-react";

// ============================================
// LAZY LOADED PAGE COMPONENTS
// Each page is loaded only when the user navigates to it
// ============================================

// Shared Pages
const SharedProfile = lazy(() => import("../shared/Profile"));
const PaymentCallback = lazy(() => import("../pages/shared/PaymentCallback"));

// Platform Owner Pages
const PlatformDashboard = lazy(() => import("../pages/platform/Dashboard"));
const CompaniesPage = lazy(() => import("../pages/platform/Companies"));
const PlansPage = lazy(() => import("../pages/platform/Plans"));

// Super Admin Pages
const SA_Dashboard = lazy(() => import("../pages/superadmin/Dashboard"));
const SA_Teams = lazy(() => import("../pages/superadmin/Teams"));
const SA_Employees = lazy(() => import("../pages/superadmin/Employees"));
const SA_Reports = lazy(() => import("../pages/superadmin/Reports"));
const SA_TimeOffRequests = lazy(() => import("../pages/superadmin/TimeOffRequests"));
const BillingPage = lazy(() => import("../pages/superadmin/BillingPage"));

// Admin Pages
const A_Dashboard = lazy(() => import("../pages/admin/Dashboard"));
const A_Schedule = lazy(() => import("../pages/admin/Schedule"));
const A_Employees = lazy(() => import("../pages/admin/Employees"));
const A_TimeTracking = lazy(() => import("../pages/admin/TimeTracking"));
const A_TimeOff = lazy(() => import("../pages/admin/TimeOff"));
const A_Reports = lazy(() => import("../pages/admin/Reports"));
const SwapApprovals = lazy(() => import("../pages/admin/SwapApprovals"));

// Employee Pages
const E_Dashboard = lazy(() => import("../pages/employee/Dashboard"));
const E_Schedule = lazy(() => import("../pages/employee/MySchedule"));
const E_TimeTracking = lazy(() => import("../pages/employee/TimeTracking"));
const E_TimeOff = lazy(() => import("../pages/employee/TimeOffRequests"));
const E_Reports = lazy(() => import("../pages/employee/MyReports"));
const E_SwapRequests = lazy(() => import("../pages/employee/SwapRequests"));

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
    { path: "/billing", element: BillingPage, label: "Billing", icon: CreditCard }, // Updated Route
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