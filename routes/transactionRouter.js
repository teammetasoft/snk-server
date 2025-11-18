const express = require("express");
const router = express.Router();
const { verifyJwt } = require("../middleware/auth");
const {
  getPlanTransactions,
  getTransactions,
  getTransactionById,
} = require("../controllers/transactionController");
router.use(verifyJwt);

router.get("/", getTransactions);
router.get("/plan", getPlanTransactions);
router.get("/:id", getTransactionById);

module.exports = router;
