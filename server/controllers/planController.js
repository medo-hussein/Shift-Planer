import Plan from "../models/planModel.js";

// @desc    Create a new plan
// @route   POST /api/plans
// @access  Platform Owner
export const createPlan = async (req, res) => {
    try {
        const { name, slug, description, price, billing_cycle, limits, features } = req.body;

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
            features
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
            plan.name = req.body.name || plan.name;
            plan.description = req.body.description || plan.description;
            plan.price = req.body.price !== undefined ? req.body.price : plan.price;
            plan.limits = req.body.limits || plan.limits;
            plan.features = req.body.features || plan.features;
            plan.is_active = req.body.is_active !== undefined ? req.body.is_active : plan.is_active;

            const updatedPlan = await plan.save();
            res.json(updatedPlan);
        } else {
            res.status(404).json({ message: "Plan not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a plan (Soft delete)
// @route   DELETE /api/plans/:id
// @access  Platform Owner
export const deletePlan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);

        if (plan) {
            plan.is_active = false;
            await plan.save();
            res.json({ message: "Plan deactivated" });
        } else {
            res.status(404).json({ message: "Plan not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
