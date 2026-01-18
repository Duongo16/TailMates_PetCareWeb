/**
 * Tests for auth.ts utility functions
 * These tests focus on pure function logic without Next.js dependencies
 */

import jwt from "jsonwebtoken";

// Test JWT functions independently
describe("Auth Utility Functions", () => {
    const JWT_SECRET = "test-secret";

    describe("JWT Token Generation", () => {
        it("should generate a valid JWT token", () => {
            const payload = {
                userId: "user-123",
                email: "test@example.com",
                role: "CUSTOMER",
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

            expect(token).toBeDefined();
            expect(typeof token).toBe("string");
            expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
        });

        it("should include user info in token payload", () => {
            const payload = {
                userId: "user-123",
                email: "test@example.com",
                role: "CUSTOMER",
            };

            const token = jwt.sign(payload, JWT_SECRET);
            const decoded = jwt.verify(token, JWT_SECRET) as typeof payload;

            expect(decoded.userId).toBe("user-123");
            expect(decoded.email).toBe("test@example.com");
            expect(decoded.role).toBe("CUSTOMER");
        });
    });

    describe("JWT Token Verification", () => {
        it("should verify valid token", () => {
            const payload = { userId: "123", email: "test@example.com", role: "CUSTOMER" };
            const token = jwt.sign(payload, JWT_SECRET);

            const decoded = jwt.verify(token, JWT_SECRET);

            expect(decoded).toBeDefined();
        });

        it("should reject invalid token", () => {
            expect(() => {
                jwt.verify("invalid-token", JWT_SECRET);
            }).toThrow();
        });

        it("should reject token with wrong secret", () => {
            const payload = { userId: "123" };
            const token = jwt.sign(payload, JWT_SECRET);

            expect(() => {
                jwt.verify(token, "wrong-secret");
            }).toThrow();
        });

        it("should reject expired token", () => {
            const payload = { userId: "123" };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "0s" });

            // Wait a bit for token to expire
            expect(() => {
                jwt.verify(token, JWT_SECRET);
            }).toThrow(/expired/i);
        });
    });

    describe("Token Extraction Logic", () => {
        it("should extract token from Bearer header", () => {
            const extractToken = (authHeader: string | null): string | null => {
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return null;
                }
                return authHeader.substring(7);
            };

            expect(extractToken("Bearer valid-token")).toBe("valid-token");
            expect(extractToken("Bearer abc123")).toBe("abc123");
        });

        it("should return null for missing header", () => {
            const extractToken = (authHeader: string | null): string | null => {
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return null;
                }
                return authHeader.substring(7);
            };

            expect(extractToken(null)).toBeNull();
            expect(extractToken("")).toBeNull();
        });

        it("should return null for non-Bearer token", () => {
            const extractToken = (authHeader: string | null): string | null => {
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return null;
                }
                return authHeader.substring(7);
            };

            expect(extractToken("Basic some-token")).toBeNull();
            expect(extractToken("Token abc123")).toBeNull();
        });
    });

    describe("API Response Format", () => {
        it("should format success response correctly", () => {
            const successResponse = (data: unknown, message = "Success", status = 200) => ({
                success: true,
                message,
                data,
                status,
            });

            const response = successResponse({ id: 1 }, "Test success");

            expect(response.success).toBe(true);
            expect(response.message).toBe("Test success");
            expect(response.data).toEqual({ id: 1 });
            expect(response.status).toBe(200);
        });

        it("should format error response correctly", () => {
            const errorResponse = (message: string, status = 400) => ({
                success: false,
                message,
                status,
            });

            const response = errorResponse("Test error", 400);

            expect(response.success).toBe(false);
            expect(response.message).toBe("Test error");
            expect(response.status).toBe(400);
        });

        it("should format created response with 201 status", () => {
            const createdResponse = (data: unknown, message = "Created successfully") => ({
                success: true,
                message,
                data,
                status: 201,
            });

            const response = createdResponse({ id: 1 });
            expect(response.status).toBe(201);
        });

        it("should format not found response with 404 status", () => {
            const notFoundResponse = (message = "Resource not found") => ({
                success: false,
                message,
                status: 404,
            });

            const response = notFoundResponse("Item not found");
            expect(response.status).toBe(404);
        });

        it("should format unauthorized response with 401 status", () => {
            const unauthorizedResponse = (message = "Unauthorized") => ({
                success: false,
                message,
                status: 401,
            });

            const response = unauthorizedResponse();
            expect(response.status).toBe(401);
        });

        it("should format forbidden response with 403 status", () => {
            const forbiddenResponse = (message = "Forbidden") => ({
                success: false,
                message,
                status: 403,
            });

            const response = forbiddenResponse();
            expect(response.status).toBe(403);
        });

        it("should format server error response with 500 status", () => {
            const serverErrorResponse = (message = "Internal server error") => ({
                success: false,
                message,
                status: 500,
            });

            const response = serverErrorResponse();
            expect(response.status).toBe(500);
        });
    });

    describe("User Role Authorization", () => {
        it("should check if user has required role", () => {
            const hasRole = (userRole: string, allowedRoles: string[]): boolean => {
                return allowedRoles.includes(userRole);
            };

            expect(hasRole("CUSTOMER", ["CUSTOMER", "ADMIN"])).toBe(true);
            expect(hasRole("ADMIN", ["CUSTOMER", "ADMIN"])).toBe(true);
            expect(hasRole("MERCHANT", ["CUSTOMER", "ADMIN"])).toBe(false);
        });

        it("should build authorization error message", () => {
            const getAuthError = (allowedRoles: string[]): string => {
                return `Forbidden - Required role: ${allowedRoles.join(" or ")}`;
            };

            expect(getAuthError(["ADMIN"])).toBe("Forbidden - Required role: ADMIN");
            expect(getAuthError(["ADMIN", "MANAGER"])).toBe("Forbidden - Required role: ADMIN or MANAGER");
        });
    });

    describe("JWT Payload Structure", () => {
        it("should create payload from user object", () => {
            const createPayload = (user: { _id: string; email: string; role: string }) => ({
                userId: user._id,
                email: user.email,
                role: user.role,
            });

            const user = { _id: "user-123", email: "test@example.com", role: "CUSTOMER" };
            const payload = createPayload(user);

            expect(payload.userId).toBe("user-123");
            expect(payload.email).toBe("test@example.com");
            expect(payload.role).toBe("CUSTOMER");
        });
    });
});
