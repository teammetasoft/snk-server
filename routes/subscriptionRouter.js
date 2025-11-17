const express = require("express");
const router = express.Router();
const { verifyJwt } = require("../middleware/auth");
const { getPlans, getDuePlans, getPlanById, subscribePlan } = require("../controllers/subscriptionController");
router.use(verifyJwt);

router.get("/", getPlans);
router.get("/due", getDuePlans);
router.get("/:id", getPlanById);
router.post("/subscribe",subscribePlan);

module.exports = router;
