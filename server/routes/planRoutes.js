import express from "express";
import { createPlan, getPlans, getAllPlans, updatePlan, togglePlanStatus, permanentDeletePlan, syncCompanyLimits } from "../controllers/planController.js";
import { protect, platformOwnerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/sync-limits", protect, platformOwnerOnly, syncCompanyLimits);
router.get("/admin/all", protect, platformOwnerOnly, getAllPlans);

router.route("/")
    .get(getPlans)
    .post(protect, platformOwnerOnly, createPlan);

router.route("/:id")
    .put(protect, platformOwnerOnly, updatePlan);

router.patch("/:id/status", protect, platformOwnerOnly, togglePlanStatus);
router.delete("/:id/permanent", protect, platformOwnerOnly, permanentDeletePlan);

export default router;
