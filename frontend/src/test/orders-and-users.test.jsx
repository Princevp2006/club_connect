import { describe, expect, it, vi } from "vitest";
import { ordersApi, usersApi } from "@/api";
import { api } from "@/api/apiClient";

describe("Orders & Users Admin API Client", () => {
  it("ordersApi.getAllOrders passes search, status, and pagination query params", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({
      items: [],
      total: 0,
    });

    const params = { search: "Alice", status: "PLACED", page: 2, limit: 10 };
    await ordersApi.getAllOrders(params);

    expect(getSpy).toHaveBeenCalledWith("/orders", params);
    getSpy.mockRestore();
  });

  it("usersApi.updateUser sends PATCH request to /users/:id with payload", async () => {
    const patchSpy = vi.spyOn(api, "patch").mockResolvedValueOnce({
      id: "user-123",
      fullName: "Updated Name",
      email: "updated@example.local",
    });

    const payload = {
      fullName: "Updated Name",
      email: "updated@example.local",
      studentId: "STU-999",
      phone: "+1-555-4321",
      collegeName: "College of Science",
      year: "3rd Year",
    };

    await usersApi.updateUser("user-123", payload);

    expect(patchSpy).toHaveBeenCalledWith("/users/user-123", payload);
    patchSpy.mockRestore();
  });
});
