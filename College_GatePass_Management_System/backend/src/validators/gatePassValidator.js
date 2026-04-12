const Joi = require("joi");

exports.applySchema = Joi.object({
  reason: Joi.string().required(),
  out_time: Joi.string().required(),
  expected_return: Joi.string().required()
});
