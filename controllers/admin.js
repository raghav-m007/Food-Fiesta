const User = require("../models/user");
const Campground = require("../models/campground");
const Review = require("../models/review");
const { cloudinary } = require("../cloudinary");
const campground = require("../models/campground");
const ADMIN_SECRET = process.env.ADMIN_SECRET;

module.exports.userAdmin = async (req, res) => {
  User.find({}, (error, foundUsers) => {
    if (error || !foundUsers) {
      req.flash("error", "Something went wrong");
      res.redirect("/campgrounds");
    } else {
      res.render("users/admin", { users: foundUsers });
    }
  });
};

module.exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const users = await User.find({});
  const user = await User.findByIdAndUpdate(id, { ...req.body.user });
  if (!user) {
    req.flash("error", "Invalid User");
    res.redirect("/admin");
  }
  if (req.body.makeAdmin) {
    user.isAdmin = true;
    await user.save();
    req.flash("success", "User is now an admin");
  } else {
    user.isAdmin = false;
    await user.save();
    req.flash("success", "User is no longer an admin");
  }
  res.redirect("/admin");
};
