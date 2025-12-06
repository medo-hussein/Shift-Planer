import express from "express";
import { createPlan, getPlans, updatePlan, deletePlan } from "../controllers/planController.js";
import { protect, platformOwnerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
    .get(getPlans)
    .post(protect, platformOwnerOnly, createPlan);

router.route("/:id")
    .put(protect, platformOwnerOnly, updatePlan)
    .delete(protect, platformOwnerOnly, deletePlan);

export default router;
