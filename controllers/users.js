const User = require("../models/user");
const Campground = require("../models/campground");
const Review = require("../models/review");
const { cloudinary } = require("../cloudinary");
const ADMIN_SECRET = process.env.ADMIN_SECRET;

module.exports.renderRegister = (req, res) => {
  res.render("users/register");
};

module.exports.register = async (req, res, next) => {
  try {
    const { email, username, password, firstName, lastName, phone, avatar, adminCode } = req.body;
    const user = new User({ email, username, firstName, lastName, phone, avatar, adminCode });

    if (adminCode === ADMIN_SECRET) {
      user.isAdmin = true;
    }

    // if user does not  submit an avatar image we give him a default avatar
    if (!req.file) {
      user.avatar = {
        url: "https://res.cloudinary.com/dswkd1tqw/image/upload/v1651312459/YelpCamp/default%20Avatar.png",
        filename: "default Avatar",
      };
    } else {
      user.avatar = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    const registerUser = await User.register(user, password);
    // Allows the user to automatically ne log-in after registering
    req.login(registerUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to Yelp Camp!");
      res.redirect("/campgrounds");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("register");
  }
};

module.exports.renderLogin = (req, res) => {
  res.render("users/login");
};

module.exports.login = (req, res) => {
  req.flash("success", "welcome back!");
  const redirectUrl = req.session.returnTo || "/campgrounds";
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "Goodbye");
  res.redirect("/campgrounds");
};

module.exports.userProfile = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    req.flash("error", "Cannot find User!");
    return res.redirect("/campgrounds");
  }

  const campground = await Campground.find().where("author").equals(user._id);
  const review = await Review.find().where("author").equals(user._id);
  //user.review = campground.reviews;

  // const campground = await Campground.find().where("author").equals(req.user._id);
  // const reviews = await Review.find().where("user").equals(req.user._id);
  if (!campground) {
    req.flash("error", "Cannot find Campgrounds!");
    return res.redirect("/campgrounds");
  }

  res.render("users/profile", { user, campground, review });
};

module.exports.renderEditProfile = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  const review = await Review.find().where("author").equals(user._id);
  const campground = await Campground.find().where("author").equals(user._id);

  if (!user) {
    req.flash("error", "That user doesn't exist");
    res.redirect("back");
  } else {
    res.render("users/edit", { user, review, campground });
  }
};

module.exports.updateProfile = async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, { ...req.body.user });
  // If user submits the form we want to first delete the old photo then replace

  // if user does not  submit an avatar image we do nothing else we replace
  if (!req.file) {
  } else {
    if (user.avatar) {
      for (const img of user.avatar) {
        await cloudinary.uploader.destroy(img.filename);
      }
    }
    user.avatar = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  await user.save();

  if (!user) {
    req.flash("error", "Invalid User");
    res.redirect("back");
  } else {
    req.flash("success", "Successfully Updated Profile!");
    res.redirect(`/users/${user._id}`);
  }
};

module.exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  const campground = await Campground.find().where("author").equals(user._id);
  const campgrounds = await Campground.findById(campground);
  if (campground.length == 0) {
    user.remove();
    if (user.avatar) {
      for (const img of user.avatar) {
        await cloudinary.uploader.destroy(img.filename);
      }
    }
  } else {
    await Campground.findByIdAndDelete(campgrounds);
    if (user.avatar) {
      for (const img of user.avatar) {
        await cloudinary.uploader.destroy(img.filename);
      }
    }
    user.remove();
  }

  req.flash("success", "Succesfully deleted User!");
  res.redirect("/campgrounds");
};
