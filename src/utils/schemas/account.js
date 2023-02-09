const Joi = require('@hapi/joi');

const schemaAccountId = Joi.number().min(1).max(9999).required()

module.exports = {
  schemaAccountId
};
