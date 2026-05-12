import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { query } from "../database";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: "admin" | "user";
        firstName: string;
        lastName: string;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  role: "admin" | "user";
  iat: number;
  exp: number;
}

// Authentication middleware
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided", "NO_TOKEN");
    }

    const token = authHeader.split(" ")[1];

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError("Token expired", "TOKEN_EXPIRED");
      }
      throw new UnauthorizedError("Invalid token", "INVALID_TOKEN");
    }

    // Verify user exists and is active
    const result = await query(
      `SELECT id, email, role, first_name, last_name, is_active 
       FROM users WHERE id = $1`,
      [decoded.userId],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError("User not found", "USER_NOT_FOUND");
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new UnauthorizedError(
        "Account is deactivated",
        "ACCOUNT_DEACTIVATED",
      );
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
  } catch (error) {
    next(error);
  }
};

// Optional authentication (doesn't throw if no token)
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

      const result = await query(
        `SELECT id, email, role, first_name, last_name, is_active 
         FROM users WHERE id = $1 AND is_active = true`,
        [decoded.userId],
      );

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
    } catch {
      // Ignore token errors in optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: Array<"admin" | "user">) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = authorize("admin");

// Generate tokens
export function generateTokens(user: {
  id: string;
  email: string;
  role: "admin" | "user";
}): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"] },
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: "refresh" },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"] },
  );

  return { accessToken, refreshToken };
}

// Verify refresh token
export function verifyRefreshToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as {
      userId: string;
      type: string;
    };

    if (decoded.type !== "refresh") {
      throw new UnauthorizedError("Invalid refresh token");
    }

    return { userId: decoded.userId };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError(
        "Refresh token expired",
        "REFRESH_TOKEN_EXPIRED",
      );
    }
    throw new UnauthorizedError(
      "Invalid refresh token",
      "INVALID_REFRESH_TOKEN",
    );
  }
}
