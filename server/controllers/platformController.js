import User from "../models/userModel.js";
import Company from "../models/companyModel.js";
import Revenue from "../models/revenueModel.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

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
      revenueByPlan,
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ isActive: true }),
      Revenue.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.countDocuments(),
      Company.find().sort({ createdAt: -1 }).limit(5),
      Revenue.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: "$plan",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total_companies: totalCompanies,
          active_companies: activeCompanies,
          total_revenue: totalRevenue[0]?.total || 0,
          total_users: totalUsers,
        },
        recent_companies: recentCompanies,
        revenue_by_plan: revenueByPlan,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Companies (Paginated with Enriched Data + Filtering)
// @route   GET /api/platform/companies
// @access  Platform Owner
export const getAllCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const planFilter = req.query.plan || ""; // Filter by plan_name
    const statusFilter = req.query.status || ""; // Filter by isActive
    const skip = (page - 1) * limit;

    // Build match query
    const matchQuery = {};
    if (search) {
      matchQuery.name = { $regex: search, $options: "i" };
    }
    if (planFilter) {
      matchQuery["subscription.plan_name"] = planFilter;
    }
    if (statusFilter === "active") {
      matchQuery.isActive = true;
    } else if (statusFilter === "inactive") {
      matchQuery.isActive = false;
    }

    // Aggregation pipeline for enriched data (LIGHTWEIGHT VERSION)
    const pipeline = [
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      // Just fetcth Super Admin for the card display
      {
        $lookup: {
          from: "users",
          let: { companyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$company", "$$companyId"] },
                    { $eq: ["$role", "super_admin"] },
                  ],
                },
              },
            },
            { $project: { name: 1, email: 1, avatar: 1 } },
            { $limit: 1 },
          ],
          as: "superAdmin",
        },
      },
      {
        $addFields: {
          superAdmin: { $arrayElemAt: ["$superAdmin", 0] },
        },
      },
      { $skip: skip },
      { $limit: limit },
    ];

    const [companies, totalCount] = await Promise.all([
      Company.aggregate(pipeline),
      Company.countDocuments(matchQuery),
    ]);

    const total = totalCount || 0;

    // Get available plans for filter dropdown
    const availablePlans = await Company.distinct("subscription.plan_name");

    res.json({
      success: true,
      data: companies,
      filters: {
        plans: availablePlans.filter((p) => p), // Remove nulls
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[getAllCompanies] Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Detailed Company Stats (Details on Demand)
// @route   GET /api/platform/companies/:id
// @access  Platform Owner
export const getCompanyDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 [getCompanyDetails] Fetching details for Company ID:", id);

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const [
      employeeCount,
      adminCount,
      totalRevenue,
      superAdmin
    ] = await Promise.all([
      // 1. Actual Employee Count
      User.countDocuments({ company: id, role: "employee" }),

      // 2. Actual Branch/Admin Count
      User.countDocuments({ company: id, role: "admin" }),

      // 3. Total Revenue
      Revenue.aggregate([
        { $match: { company_id: company._id, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),

      // 4. Super Admin Info
      User.findOne({ company: id, role: "super_admin" }).select("name email phone position avatar")
    ]);

    res.json({
      success: true,
      data: {
        _id: company._id,
        name: company.name,
        subscription: company.subscription,
        isActive: company.isActive,
        createdAt: company.createdAt,
        stats: {
          employees: employeeCount,
          branches: adminCount,
          revenue: totalRevenue[0]?.total || 0
        },
        superAdmin: superAdmin
      }
    });

  } catch (error) {
    console.error("getCompanyDetails Error:", error);
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

    res.json({
      success: true,
      message: `Company ${company.isActive ? "activated" : "deactivated"}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
