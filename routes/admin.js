const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const admin = require("../controllers/admin");
const { isLoggedIn, checkProfileOwner, isAdmin } = require("../middleware");

router.route("/admin").get(isLoggedIn, isAdmin, catchAsync(admin.userAdmin));

router.route("/admin/:id").put(isAdmin, checkProfileOwner, catchAsync(admin.updateAdmin));

module.exports = router;
