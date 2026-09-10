import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/context/AuthContext";
import Login from "../src/pages/Login";

vi.mock("../src/api/client", () => import("./mocks/apiClient"));
import apiClient from "../src/api/client";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>DASHBOARD_PAGE</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("Login page", () => {
  test("renders email and password fields and a submit button", () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  test("successful login navigates to the dashboard", async () => {
    apiClient.post.mockResolvedValueOnce({
      data: { data: { token: "fake-token", user: { id: 1, name: "Admin", role: "ADMIN" } } },
    });

    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "admin@electrostock.local");
    await user.type(screen.getByLabelText(/password/i), "ChangeMe123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText("DASHBOARD_PAGE")).toBeInTheDocument());
    expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
      email: "admin@electrostock.local",
      password: "ChangeMe123!",
    });
  });

  test("failed login shows an error message and stays on the login page", async () => {
    apiClient.post.mockRejectedValueOnce({ response: { data: { message: "Invalid credentials" } } });

    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "admin@electrostock.local");
    await user.type(screen.getByLabelText(/password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(screen.queryByText("DASHBOARD_PAGE")).not.toBeInTheDocument();
  });
});
