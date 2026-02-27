const AppError = require('../utils/AppError');

/**
 * Create a validation middleware from a Joi schema
 * Usage: validate(schema) where schema = { body: Joi.object(), params: Joi.object(), query: Joi.object() }
 */
const validate = (schema) => {
    return (req, res, next) => {
        const errors = [];

        ['params', 'query', 'body'].forEach((key) => {
            if (schema[key]) {
                const { error, value } = schema[key].validate(req[key], {
                    abortEarly: false,
                    stripUnknown: true,
                });

                if (error) {
                    errors.push(
                        ...error.details.map((detail) => ({
                            field: detail.path.join('.'),
                            message: detail.message,
                        }))
                    );
                } else {
                    req[key] = value;
                }
            }
        });

        if (errors.length > 0) {
            return next(new AppError('ข้อมูลไม่ถูกต้อง', 400, errors));
        }

        next();
    };
};

module.exports = validate;
