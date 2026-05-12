"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = exports.validateMultiple = exports.validate = void 0;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
// Validation middleware factory
const validate = (schema, target = 'body') => {
    return async (req, _res, next) => {
        try {
            const data = req[target];
            const validated = await schema.parseAsync(data);
            // Replace with validated (and transformed) data
            req[target] = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = {};
                error.errors.forEach((err) => {
                    const path = err.path.join('.');
                    if (!formattedErrors[path]) {
                        formattedErrors[path] = [];
                    }
                    formattedErrors[path].push(err.message);
                });
                next(new errors_1.ValidationError(formattedErrors));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validate = validate;
// Validate multiple targets
const validateMultiple = (validations) => {
    return async (req, res, next) => {
        try {
            const allErrors = {};
            for (const { schema, target } of validations) {
                try {
                    const validated = await schema.parseAsync(req[target]);
                    req[target] = validated;
                }
                catch (error) {
                    if (error instanceof zod_1.ZodError) {
                        error.errors.forEach((err) => {
                            const path = `${target}.${err.path.join('.')}`;
                            if (!allErrors[path]) {
                                allErrors[path] = [];
                            }
                            allErrors[path].push(err.message);
                        });
                    }
                    else {
                        throw error;
                    }
                }
            }
            if (Object.keys(allErrors).length > 0) {
                throw new errors_1.ValidationError(allErrors);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validateMultiple = validateMultiple;
// Validate request body
const validateBody = (schema) => (0, exports.validate)(schema, 'body');
exports.validateBody = validateBody;
// Validate query params
const validateQuery = (schema) => (0, exports.validate)(schema, 'query');
exports.validateQuery = validateQuery;
// Validate route params
const validateParams = (schema) => (0, exports.validate)(schema, 'params');
exports.validateParams = validateParams;
//# sourceMappingURL=validate.js.map