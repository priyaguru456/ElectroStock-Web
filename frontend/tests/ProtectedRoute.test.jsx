import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/context/AuthContext";
import ProtectedRoute from "../src/components/ProtectedRoute";

vi.mock("../src/api/client", () => import("./mocks/apiClient"));
import apiClient from "../src/api/client";

function renderAt(path, roles) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>LOGIN_PAGE</div>} />
          <Route path="/dashboard" element={<div>DASHBOARD_PAGE</div>} />
          <Route element={<ProtectedRoute roles={roles} />}>
            <Route path="/secret" element={<div>SECRET_PAGE</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("ProtectedRoute", () => {
  test("redirects to /login when there is no logged-in user", async () => {
    renderAt("/secret");
    expect(await screen.findByText("LOGIN_PAGE")).toBeInTheDocument();
  });

  test("renders the protected page when the user is logged in with an allowed role", async () => {
    const storedUser = { id: 1, name: "Admin", role: "ADMIN" };
    localStorage.setItem("electrostock_token", "fake-token");
    localStorage.setItem("electrostock_user", JSON.stringify(storedUser));
    apiClient.get.mockResolvedValueOnce({ data: { data: storedUser } });

    renderAt("/secret", ["ADMIN", "SUPER_ADMIN"]);
    expect(await screen.findByText("SECRET_PAGE")).toBeInTheDocument();
  });

  test("redirects to /dashboard when the user's role is not allowed", async () => {
    const storedUser = { id: 2, name: "Staff", role: "WAREHOUSE_STAFF" };
    localStorage.setItem("electrostock_token", "fake-token");
    localStorage.setItem("electrostock_user", JSON.stringify(storedUser));
    apiClient.get.mockResolvedValueOnce({ data: { data: storedUser } });

    renderAt("/secret", ["ADMIN", "SUPER_ADMIN"]);
    expect(await screen.findByText("DASHBOARD_PAGE")).toBeInTheDocument();
  });
});
