const express = require("express");
const router = express.Router();
const { createScheme, getSchemeById, deleteScheme } = require("../controllers/schemeController");
const { checkRole, verifyJwt } = require("../middleware/auth");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.use(verifyJwt);

router.post(
  "/createScheme",
  checkRole(["admin"]),
  upload.single("image"),
  createScheme
);

router.get("/getSchemeById/:id", getSchemeById);
router.delete("/deleteScheme/:id", deleteScheme);
module.exports = router;
// getAllSchemes  → list with filter, sort, pagination

// getSchemeById  → single scheme

// createScheme  → add (save/draft)

// updateScheme  → edit scheme

// deleteScheme  → single delete

// bulkDeleteSchemes  → multiple delete

// exportSchemesToExcel
// router.get("/getAllProperties", getAllProperties);
// router.get("/getPropertyById/:id", getPropertyById);
// router.put("/updateProperty/:id", upload.array('images', 10), updateProperty);
// router.delete("/deleteProperty/:id", deleteProperty);
// router.patch("/changeStatus/:id/status", changeStatus);
