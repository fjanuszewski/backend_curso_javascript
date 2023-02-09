const Joi = require('@hapi/joi');

const schemaItemId = Joi.string().min(1).required()

module.exports = {
  schemaItemId
};
