const Joi = require('@hapi/joi');

const schemaUserId = Joi.string().min(1).required()

module.exports = {
  schemaUserId
};
