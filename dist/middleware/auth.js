"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = exports.authorize = exports.optionalAuthenticate = exports.authenticate = void 0;
exports.generateTokens = generateTokens;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
const database_1 = require("../database");
// Authentication middleware
const authenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            throw new errors_1.UnauthorizedError("No token provided", "NO_TOKEN");
        }
        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new errors_1.UnauthorizedError("Token expired", "TOKEN_EXPIRED");
            }
            throw new errors_1.UnauthorizedError("Invalid token", "INVALID_TOKEN");
        }
        // Verify user exists and is active
        const result = await (0, database_1.query)(`SELECT id, email, role, first_name, last_name, is_active 
       FROM users WHERE id = $1`, [decoded.userId]);
        if (result.rows.length === 0) {
            throw new errors_1.UnauthorizedError("User not found", "USER_NOT_FOUND");
        }
        const user = result.rows[0];
        if (!user.is_active) {
            throw new errors_1.UnauthorizedError("Account is deactivated", "ACCOUNT_DEACTIVATED");
        }
        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
// Optional authentication (doesn't throw if no token)
const optionalAuthenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return next();
        }
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            const result = await (0, database_1.query)(`SELECT id, email, role, first_name, last_name, is_active 
         FROM users WHERE id = $1 AND is_active = true`, [decoded.userId]);
            if (result.rows.length > 0) {
                const user = result.rows[0];
                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.first_name,
                    lastName: user.last_name,
                };
            }
        }
        catch {
            // Ignore token errors in optional auth
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
// Role-based authorization middleware
const authorize = (...allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError("Authentication required"));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new errors_1.ForbiddenError("Insufficient permissions"));
        }
        next();
    };
};
exports.authorize = authorize;
// Admin only middleware
exports.adminOnly = (0, exports.authorize)("admin");
// Generate tokens
function generateTokens(user) {
    const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.expiresIn });
    const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, type: "refresh" }, config_1.config.jwt.refreshSecret, { expiresIn: config_1.config.jwt.refreshExpiresIn });
    return { accessToken, refreshToken };
}
// Verify refresh token
function verifyRefreshToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.refreshSecret);
        if (decoded.type !== "refresh") {
            throw new errors_1.UnauthorizedError("Invalid refresh token");
        }
        return { userId: decoded.userId };
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errors_1.UnauthorizedError("Refresh token expired", "REFRESH_TOKEN_EXPIRED");
        }
        throw new errors_1.UnauthorizedError("Invalid refresh token", "INVALID_REFRESH_TOKEN");
    }
}
//# sourceMappingURL=auth.js.map