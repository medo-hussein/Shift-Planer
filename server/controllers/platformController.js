import User from "../models/userModel.js";
import Company from "../models/companyModel.js";
import Revenue from "../models/revenueModel.js";
import Plan from "../models/planModel.js";

// @desc    Get Platform Dashboard Stats
// @route   GET /api/platform/dashboard
// @access  Platform Owner
export const getPlatformDashboard = async (req, res) => {
  try {
    const [
      totalCompanies,
      activeCompanies,
      totalRevenue,
      totalUsers,
      recentCompanies,
      revenueByPlan
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ isActive: true }),
      Revenue.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      User.countDocuments(),
      Company.find().sort({ createdAt: -1 }).limit(5),
      Revenue.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: "$plan", total: { $sum: "$amount" }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total_companies: totalCompanies,
          active_companies: activeCompanies,
          total_revenue: totalRevenue[0]?.total || 0,
          total_users: totalUsers
        },
        recent_companies: recentCompanies,
        revenue_by_plan: revenueByPlan
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Companies
// @route   GET /api/platform/companies
// @access  Platform Owner
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle Company Status
// @route   PATCH /api/platform/companies/:id/status
// @access  Platform Owner
export const toggleCompanyStatus = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    company.isActive = !company.isActive;
    await company.save();

    res.json({ success: true, message: `Company ${company.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
