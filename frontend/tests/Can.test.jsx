import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/context/AuthContext";
import Can from "../src/components/Can";

vi.mock("../src/api/client", () => import("./mocks/apiClient"));
import apiClient from "../src/api/client";

function renderCan(user, roles) {
  if (user) {
    localStorage.setItem("electrostock_token", "fake-token");
    localStorage.setItem("electrostock_user", JSON.stringify(user));
    apiClient.get.mockResolvedValueOnce({ data: { data: user } });
  }

  return render(
    <MemoryRouter>
      <AuthProvider>
        <Can roles={roles}>
          <div>ALLOWED_CONTENT</div>
        </Can>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("Can (role-gated UI)", () => {
  test("renders children when the user's role is in the allowed list", () => {
    renderCan({ id: 1, name: "Admin", role: "ADMIN" }, ["ADMIN", "SUPER_ADMIN"]);
    expect(screen.getByText("ALLOWED_CONTENT")).toBeInTheDocument();
  });

  test("renders nothing when the user's role is not in the allowed list", () => {
    renderCan({ id: 2, name: "Staff", role: "SALES_STAFF" }, ["ADMIN", "SUPER_ADMIN"]);
    expect(screen.queryByText("ALLOWED_CONTENT")).not.toBeInTheDocument();
  });

  test("renders nothing when there is no logged-in user", () => {
    renderCan(null, ["ADMIN"]);
    expect(screen.queryByText("ALLOWED_CONTENT")).not.toBeInTheDocument();
  });
});
