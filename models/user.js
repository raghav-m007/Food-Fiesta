const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Campground = require("./campground");
const Review = require("./review");

const passportLocalMongoose = require("passport-local-mongoose");

const ImageProfileSchema = new Schema({
  url: String,
  filename: String,
});

ImageProfileSchema.virtual("thumbnail").get(function () {
  return this.url.replace("/upload", "/upload/ar_4:3,c_crop");
});

const UserSchema = new Schema({
  firstName: String,
  lastName: String,
  avatar: [ImageProfileSchema],
  phone: String,
  bio: String,
  isAdmin: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
    require: true,
    unique: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  campgrounds: [
    {
      type: Schema.Types.ObjectId,
      ref: "Campground",
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// handling the unique email error
UserSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000 && error.keyValue.email) {
    next(new Error("Email address was already taken, please choose a different one."));
  } else {
    next(error);
  }
});

UserSchema.post("remove", async function (campground) {
  await Review.deleteMany({ author: this._id });
  await Campground.deleteMany({ author: this._id });
  if (campground.images) {
    for (const img of campground.images) {
      await cloudinary.uploader.destroy(img.filename);
    }
  }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
