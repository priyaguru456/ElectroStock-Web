import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Can from "./Can";
import apiClient from "../api/client";
import { roleToSlug } from "../utils/roleSlug";
import logo from "../assets/warehose image.png";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const base = `/${roleToSlug(user?.role)}`;

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("/notifications", { params: { isRead: "false", limit: 1 } })
      .then((res) => {
        if (!cancelled) setUnreadCount(res.data.data.total);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="WorkStock" className="sidebar-logo" />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">WorkStock</span>
            <span className="sidebar-brand-tagline">Organize · Track · Grow</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to={`${base}/dashboard`}>Dashboard</NavLink>
          <NavLink to={`${base}/products`}>Products</NavLink>
          <NavLink to={`${base}/categories`}>Categories</NavLink>
          <NavLink to={`${base}/suppliers`}>Suppliers</NavLink>
          <NavLink to={`${base}/warehouses`}>Warehouses</NavLink>
          <NavLink to={`${base}/inventory`}>Inventory</NavLink>
          <NavLink to={`${base}/inventory/transactions`}>Transactions</NavLink>
          <Can roles={["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER"]}>
            <NavLink to={`${base}/purchases`}>Purchase Orders</NavLink>
            <NavLink to={`${base}/adjustments`}>Stock Adjustments</NavLink>
            <NavLink to={`${base}/transfers`}>Stock Transfers</NavLink>
          </Can>
          <Can roles={["SUPER_ADMIN", "ADMIN", "SALES_MANAGER", "SALES_STAFF", "TELECALLER"]}>
            <NavLink to={`${base}/customers`}>Customers</NavLink>
            <NavLink to={`${base}/sales`}>Sales Orders</NavLink>
          </Can>
          <Can roles={["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "SALES_MANAGER", "TEAM_LEADER"]}>
            <NavLink to={`${base}/reports`}>Reports</NavLink>
            <NavLink to={`${base}/analytics`}>Analytics</NavLink>
          </Can>
          <NavLink to={`${base}/notifications`}>Notifications</NavLink>
          <NavLink to={`${base}/attendance`}>Attendance</NavLink>
          <NavLink to={`${base}/tasks`}>Tasks</NavLink>
          <Can roles={["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "TEAM_LEADER"]}>
            <NavLink to={`${base}/employees`}>Employees</NavLink>
          </Can>
          <Can roles={["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER"]}>
            <NavLink to={`${base}/departments`}>Departments</NavLink>
            <NavLink to={`${base}/shifts`}>Shifts</NavLink>
          </Can>
          <Can roles={["SUPER_ADMIN", "ADMIN", "SALES_MANAGER", "WAREHOUSE_MANAGER"]}>
            <NavLink to={`${base}/users`}>Users</NavLink>
          </Can>
          <Can roles={["SUPER_ADMIN", "ADMIN"]}>
            <NavLink to={`${base}/audit`}>Audit Logs</NavLink>
          </Can>
        </nav>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <span />
          <div className="topbar-user">
            <button className="bell-button" onClick={() => navigate(`${base}/notifications`)}>
              🔔{unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
            </button>
            <span>
              {user?.name} <small>({user?.role})</small>
            </span>
            <button onClick={logout}>Logout</button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
