const BaseJoi = require("joi");
const sanitizeHtml = require("sanitize-html");

const extension = (joi) => ({
  type: "string",
  base: joi.string(),
  messages: {
    "string.escapeHTML": "{{#label}} must not include HTML!",
  },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
        if (clean !== value) return helpers.error("string.escapeHTML", { value });
        return clean;
      },
    },
  },
});

const Joi = BaseJoi.extend(extension);

module.exports.campgroundSchema = Joi.object({
  campground: Joi.object({
    title: Joi.string().required().escapeHTML(),
    price: Joi.number().required().min(0),
    location: Joi.string().required().escapeHTML(),
    description: Joi.string().required().escapeHTML(),
  }).required(),
  deleteImages: Joi.array(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    body: Joi.string().required().escapeHTML(),
  }).required(),
});

module.exports.userSchema = Joi.object({
  user: Joi.object({
    firstName: Joi.string().required().escapeHTML(),
    lastName: Joi.string().required().escapeHTML(),
    email: Joi.string().required().escapeHTML(),
    phone: Joi.string().allow("").escapeHTML(),
    bio: Joi.string().allow("").escapeHTML(),
  }),
});

module.exports.userSchemaRegister = Joi.object({
  firstName: Joi.string().required().escapeHTML(),
  lastName: Joi.string().required().escapeHTML(),
  email: Joi.string().required().escapeHTML(),
  phone: Joi.string().allow("").escapeHTML(),
  username: Joi.string().required().escapeHTML(),
  password: Joi.string().required().escapeHTML(),
  adminCode: Joi.string().allow("").escapeHTML(),
});
