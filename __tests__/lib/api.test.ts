/**
 * Tests for API client functions (lib/api.ts)
 * These tests mock fetch calls and verify API client behavior
 */

// We need to run these tests in a browser-like environment
import { authAPI, petsAPI, productsAPI, ordersAPI, bookingsAPI } from "@/lib/api";

describe("API Client", () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
        mockFetch.mockClear();
        (localStorage.getItem as jest.Mock).mockReturnValue("test-token");
    });

    describe("authAPI", () => {
        describe("login", () => {
            it("should call login endpoint with credentials", async () => {
                const mockResponse = {
                    success: true,
                    data: { user: { id: "1", email: "test@example.com" }, token: "jwt-token" },
                };
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
                } as Response);

                const result = await authAPI.login("test@example.com", "password123");

                expect(mockFetch).toHaveBeenCalledWith("/api/v1/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: "test@example.com", password: "password123" }),
                });
                expect(result).toEqual(mockResponse);
            });
        });

        describe("register", () => {
            it("should call register endpoint with user data", async () => {
                const mockResponse = { success: true, data: { user: { id: "1" } } };
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
                } as Response);

                const userData = {
                    email: "new@example.com",
                    password: "password123",
                    full_name: "New User",
                    role: "CUSTOMER",
                };
                const result = await authAPI.register(userData);

                expect(mockFetch).toHaveBeenCalledWith("/api/v1/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(userData),
                });
                expect(result).toEqual(mockResponse);
            });
        });
    });

    describe("petsAPI", () => {
        describe("list", () => {
            it("should fetch pets list with auth header", async () => {
                const mockPets = [{ id: "1", name: "Max" }];
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true, data: mockPets }),
                } as Response);

                const result = await petsAPI.list();

                expect(mockFetch).toHaveBeenCalledWith("/api/v1/pets", expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: "Bearer test-token",
                    }),
                }));
                expect(result.success).toBe(true);
                expect(result.data).toEqual(mockPets);
            });
        });

        describe("create", () => {
            it("should create a new pet", async () => {
                const newPet = {
                    name: "Buddy",
                    species: "dog",
                    age_months: 12,
                    gender: "male",
                };
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true, data: { id: "1", ...newPet } }),
                } as Response);

                const result = await petsAPI.create(newPet);

                expect(mockFetch).toHaveBeenCalledWith("/api/v1/pets", expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify(newPet),
                }));
                expect(result.success).toBe(true);
            });
        });

        describe("delete", () => {
            it("should delete a pet", async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true, message: "Deleted" }),
                } as Response);

                const result = await petsAPI.delete("pet-123");

                expect(mockFetch).toHaveBeenCalledWith("/api/v1/pets/pet-123", expect.objectContaining({
                    method: "DELETE",
                }));
                expect(result.success).toBe(true);
            });
        });
    });

    describe("productsAPI", () => {
        describe("list", () => {
            it("should fetch products without filters", async () => {
                const mockProducts = { products: [], pagination: { total: 0 } };
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true, data: mockProducts }),
                } as Response);

                await productsAPI.list();

                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining("/api/v1/products"),
                    expect.any(Object)
                );
            });

            it("should fetch products with category filter", async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true, data: { products: [] } }),
                } as Response);

                await productsAPI.list({ category: "FOOD" });

                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining("category=FOOD"),
                    expect.any(Object)
                );
            });

            it("should fetch products with search query", async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true, data: { products: [] } }),
                } as Response);

                await productsAPI.list({ search: "dog food" });

                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining("search=dog"),
                    expect.any(Object)
                );
            });

            it("should fetch products with specification filters", async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true, data: { products: [] } }),
                } as Response);

                await productsAPI.list({
                    targetSpecies: "DOG",
                    lifeStage: "ADULT",
                    healthTags: ["WEIGHT_CONTROL"],
                });

                const callUrl = (mockFetch.mock.calls[0] as [string])[0];
                expect(callUrl).toContain("targetSpecies=DOG");
                expect(callUrl).toContain("lifeStage=ADULT");
                expect(callUrl).toContain("healthTags=WEIGHT_CONTROL");
            });
        });
    });

    describe("ordersAPI", () => {
        describe("create", () => {
            it("should create a new order", async () => {
                const orderData = {
                    items: [{ product_id: "prod-1", quantity: 2 }],
                    shipping_address: "123 Main St",
                };
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true, data: { id: "order-1" } }),
                } as Response);

                const result = await ordersAPI.create(orderData);

                expect(mockFetch).toHaveBeenCalledWith("/api/v1/orders", expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify(orderData),
                }));
                expect(result.success).toBe(true);
            });
        });
    });

    describe("bookingsAPI", () => {
        describe("create", () => {
            it("should create a service booking", async () => {
                const bookingData = {
                    service_id: "svc-1",
                    pet_id: "pet-1",
                    booking_time: "2024-01-20T10:00:00Z",
                };
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true, data: { id: "booking-1" } }),
                } as Response);

                const result = await bookingsAPI.create(bookingData);

                expect(mockFetch).toHaveBeenCalledWith("/api/v1/bookings", expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify(bookingData),
                }));
                expect(result.success).toBe(true);
            });
        });

        describe("getBookedSlots", () => {
            it("should fetch booked slots for a service", async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: { booked_slots: ["09:00", "10:00"] },
                    }),
                } as Response);

                const result = await bookingsAPI.getBookedSlots("svc-1", "2024-01-20");

                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining("service_id=svc-1"),
                    expect.any(Object)
                );
                expect(result.success).toBe(true);
            });
        });
    });

    describe("Error handling", () => {
        it("should handle API errors gracefully", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ success: false, message: "Server error" }),
            } as Response);

            const result = await petsAPI.list();

            expect(result.success).toBe(false);
            expect(result.message).toBe("Server error");
        });

        it("should handle network errors", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network error"));

            const result = await petsAPI.list();

            expect(result.success).toBe(false);
            expect(result.error).toBe("Network error");
        });
    });
});
