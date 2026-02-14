const Joi = require("joi");

exports.createStudentSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(4).required(),
  year: Joi.number().required(),
  category: Joi.string().valid("Hosteller", "Day Scholar").required(),
  parent_phone: Joi.string().required(),
  department_id: Joi.number().required()
});
