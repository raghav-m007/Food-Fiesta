const { campgroundSchema, reviewSchema, userSchema, userSchemaRegister, adminSchema } = require("./schemas.js");
const ExpressError = require("./utils/ExpressError");
const Campground = require("./models/campground");
const Review = require("./models/review");
const User = require("./models/user");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "you must be signed in first!");
    return res.redirect("/login");
  }
  next();
};

module.exports.validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);

  if (error) {
    const msg = error.details.map((elements) => elements.message).join("");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (campground.author.equals(req.user._id) || req.user.isAdmin) {
    next();
  } else {
    req.flash("error", "You do not have permission to do that!");
    return res.redirect(`/campgrounds/${id}`);
  }
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (review.author.equals(req.user._id) || req.user.isAdmin) {
    next();
  } else {
    req.flash("error", "You do not have permission to do that!");
    return res.redirect(`/campgrounds/${id}`);
  }
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((elements) => elements.message).join("");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

module.exports.checkProfileOwner = (req, res, next) => {
  if (req.isAuthenticated()) {
    // If the profiles can be visited from the comments page, you can use the comment.author.id in an <a> tag to pass the the link into params as 'userid' for example
    // If profile is clickable as a campground author, you can use campground.author.id in an <a> tag to pass the the link into params as 'userid' for example

    if (req.user._id.equals(req.params.id) || req.isAuthenticated() || req.user.isAdmin) {
      next();
    } else {
      req.flash("error", "Access denied, this is not your profile.");
      res.redirect("back");
    }
  } else {
    req.flash("error", "You are not logged in.");
    res.redirect("back");
  }
};

module.exports.validateEditUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);

  if (error) {
    const msg = error.details.map((elements) => elements.message).join("");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

module.exports.validateUserRegister = (req, res, next) => {
  const { error } = userSchemaRegister.validate(req.body);

  if (error) {
    const msg = error.details.map((elements) => elements.message).join("");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

module.exports.isAdmin = (req, res, next) => {
  if (req.isAuthenticated()) {
    if (!req.user) {
      req.flash("error", "No User Found");
      req.redirect("/campgrounds");
    } else {
      if (req.user.isAdmin) {
        next();
      } else {
        req.flash("error", "You do not have permission to do that");
        res.redirect("/campgrounds");
      }
    }
  } else {
    req.flash("error", "You need to be logged in to do that.");
    res.redirect("/campgrounds");
  }
};
