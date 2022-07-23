const Campground = require("../models/campground");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");

module.exports.index = async (req, res) => {
  let currentPage = Number(req.query.page);

  if (!currentPage || currentPage < 1) {
    // if client req /index w/o ?page
    currentPage = 1;
    // get campgrounds from the database
    req.session.campgrounds = await Campground.find({});

    // Initialize Pagination
    let length = req.session.campgrounds.length;
    req.session.pagination = {
      totalItems: length, // total # of campgrounds
      itemsPerPage: 9,
      totalPages: Math.ceil(length / 9), // total # of pages
    };
  }

  if (!req.session.pagination || !req.session.campgrounds) res.redirect("campgrounds/");

  const { itemsPerPage, totalItems, totalPages } = req.session.pagination;
  let start = (currentPage - 1) * itemsPerPage;
  let end = currentPage * itemsPerPage;
  if (end > totalItems) end = totalItems;

  const campgrounds = req.session.campgrounds;
  res.render("campgrounds/index", {
    campgrounds,
    totalPages,
    currentPage,
    start,
    end,
  });
};

module.exports.search = async (req, res) => {
  const { search } = req.query;
  if (search) {
    const searchTerm = new RegExp(escapeRegex(search), "gi");
    const campgrounds = await Campground.find().or([{ title: searchTerm }, { location: searchTerm }]);
    res.render("campgrounds/search", { campgrounds, searchTerm, search });
  } else {
    req.flash("error", "Please enter something in the search box ");
    res.redirect("back");
  }
};

module.exports.renderNewForm = (req, res) => {
  res.render("campgrounds/new");
};

module.exports.createCampground = async (req, res, next) => {
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1,
    })
    .send();
  const campground = new Campground(req.body.campground);
  campground.geometry = geoData.body.features[0].geometry;
  campground.images = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  campground.author = req.user._id;
  await campground.save();
  req.flash("success", "Successfully made a new Campground!");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.showCampground = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("author");

  if (!campground) {
    req.flash("error", "Cannot find campground");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/show", { campground });
};

module.exports.renderEditCampground = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    req.flash("error", "Cannot find campground");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/edit", { campground });
};

module.exports.updateCampground = async (req, res) => {
  const { id } = req.params;
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1,
    })
    .send();
  const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  campground.images.push(...imgs);
  campground.geometry = geoData.body.features[0].geometry;
  await campground.save();
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
  }
  req.flash("success", "Successfully Updated Campground!");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
  const { id } = req.params;
  await Campground.findByIdAndDelete(id);
  req.flash("success", "Succesfully deleted campground!");
  res.redirect("/campgrounds");
};

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "$&");
}
