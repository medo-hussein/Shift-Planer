import Plan from "../models/planModel.js";
import Company from "../models/companyModel.js";

// @desc    Create a new plan
// @route   POST /api/plans
// @access  Platform Owner
export const createPlan = async (req, res) => {
  try {
    const { name, slug, description, price, billing_cycle, limits, features } =
      req.body;

    const planExists = await Plan.findOne({ slug });
    if (planExists) {
      return res.status(400).json({ message: "Plan already exists" });
    }

    const plan = await Plan.create({
      name,
      slug,
      description,
      price,
      billing_cycle,
      limits,
      features,
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all plans
// @route   GET /api/plans
// @access  Public
export const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ is_active: true }).sort({ price: 1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a plan
// @route   PUT /api/plans/:id
// @access  Platform Owner
export const updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (plan) {
      const originalName = plan.name; // Keep tracking of original name in case it changes

      plan.name = req.body.name || plan.name;
      plan.description = req.body.description || plan.description;
      plan.price = req.body.price !== undefined ? req.body.price : plan.price;
      plan.limits = req.body.limits || plan.limits;
      plan.features = req.body.features || plan.features;
      plan.is_active =
        req.body.is_active !== undefined ? req.body.is_active : plan.is_active;

      const updatedPlan = await plan.save();

      // Auto-Sync: Update all companies subscribed to this plan
      // We match by plan_name since that seems to be how they are linked in Company model
      if (req.body.limits) {
        await Company.updateMany(
          { "subscription.plan_name": originalName },
          {
            $set: {
              "subscription.maxBranches": updatedPlan.limits.max_branches,
              "subscription.maxUsers": updatedPlan.limits.max_employees,
            },
          }
        );
        console.log(
          `Synced limits for plan '${updatedPlan.name}' to related companies.`
        );
      }

      res.json(updatedPlan);
    } else {
      res.status(404).json({ message: "Plan not found" });
    }
  } catch (error) {
    console.error("Update Plan Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all plans (Active & Inactive) - Admin Only
// @route   GET /api/plans/admin/all
// @access  Platform Owner
export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({}).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle plan status (Active/Inactive)
// @route   PATCH /api/plans/:id/status
// @access  Platform Owner
export const togglePlanStatus = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (plan) {
      plan.is_active = !plan.is_active;
      await plan.save();
      res.json({
        success: true,
        message: `Plan ${plan.is_active ? "activated" : "deactivated"}`,
        plan,
      });
    } else {
      res.status(404).json({ message: "Plan not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Permanently Delete a plan
// @route   DELETE /api/plans/:id/permanent
// @access  Platform Owner
export const permanentDeletePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Safety Check: Are any companies using this plan?
    // We check by plan name since that's the link used in subscription
    const companiesUsingPlan = await Company.countDocuments({
      "subscription.plan_name": plan.name,
    });

    if (companiesUsingPlan > 0) {
      return res.status(400).json({
        success: false,
        error: "PLAN_IN_USE",
        message: `Cannot delete plan. It is currently used by ${companiesUsingPlan} companies. Deactivate it instead.`,
      });
    }

    await plan.deleteOne();
    res.json({ success: true, message: "Plan permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manually sync all companies to their plan limits
// @route   POST /api/plans/sync-limits
// @access  Platform Owner
export const syncCompanyLimits = async (req, res) => {
  try {
    const plans = await Plan.find({ is_active: true });
    let updatedCount = 0;

    for (const plan of plans) {
      const result = await Company.updateMany(
        { "subscription.plan_name": plan.name },
        {
          $set: {
            "subscription.maxBranches": plan.limits.max_branches,
            "subscription.maxUsers": plan.limits.max_employees,
          },
        }
      );
      updatedCount += result.modifiedCount;
    }

    res.json({
      success: true,
      message: `Synced limits for ${updatedCount} companies across ${plans.length} active plans.`,
    });
  } catch (error) {
    console.error("Sync Limits Error:", error);
    res.status(500).json({ message: error.message });
  }
};
