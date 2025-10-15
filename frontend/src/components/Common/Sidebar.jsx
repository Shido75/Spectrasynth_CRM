import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
// NEW
import { jwtDecode } from "jwt-decode";

const Sidebar = () => {
  const location = useLocation();
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token); // note: jwtDecode, not jwt_decode
        setRoles(decoded.roles || []);
      } catch (err) {
        console.error("Invalid token", err);
      }
    }
  }, []);

  const navLinks = [
    { to: "Inquiry", label: "Inquiry", icon: "", roles: ["inquiry", "admin"] },

    {
      to: "Technical",
      label: "Technical Person",
      icon: "",
      roles: ["technical", "admin"],
    },
    {
      to: "marketing_person",
      label: "Marketing Person",
      icon: "",
      roles: ["marketing", "admin"],
    },
    {
      to: "product_master",
      label: "Product",
      icon: "ti ti-target",
      roles: ["inquiry", "admin"],
    },
    {
      to: "ProductList",
      label: "Company Price",
      icon: "ti ti-target",
      roles: ["inquiry", "admin"],
    },
    {
      to: "QuotationManagement",
      label: "Quotations",
      icon: "ti ti-file-text",
      roles: ["marketing", "admin"],
    },
    {
      to: "IndexUser",
      label: "Users",
      icon: "ti ti-refresh",
      roles: ["admin"],
    },
    {
      to: "Index_purchase_orders",
      label: "Purchase Orders",
      icon: "ti ti-layout-list",
      roles: ["admin"],
    },
  ];

  // Filter links if any of the user's roles match the link roles
  const filteredLinks = navLinks.filter((link) =>
    link.roles.some((r) => roles.includes(r))
  );

  return (
    <div className="sidebar" id="sidebar">
      <div className="profile-section">
        <img src="/assets/img/profiles/avatar-14.jpg" alt="Profile" />
        <div className="user-names">
          <h5>{roles.join(", ").toUpperCase() || "User"}</h5>
          <h6>
            {roles[0]
              ? roles[0].charAt(0).toUpperCase() + roles[0].slice(1)
              : "Role"}
          </h6>
        </div>
      </div>
      <ul className="sidebar-menu">
        {filteredLinks.map((item) => (
          <li className="sidebar-item" key={item.to}>
            <Link
              to={item.to}
              className={
                "sidebar-link" +
                (location.pathname === item.to ? " active" : "")
              }
            >
              {item.icon && <i className={`sidebar-icon ${item.icon}`}></i>}
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <style>
        {`
        .sidebar {
          background: #fff;
          min-height: 100vh;
          width: 245px;
          border-right: 1px solid #e9e9e9;
          padding: 0px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }
        .profile-section {
          display: flex;
          align-items: center;
          padding: 12px 8px 12px 22px;
          gap: 10px;
          border-radius: 10px;
          margin: 24px 8px 0 0;
          background: #f7f7fd;
          width: 90%;
        }
        .profile-section img {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          object-fit: cover;
        }
        .profile-section .user-names h5 {
          font-size: 14.3px;
          margin: 0 0 3px 0;
          color: #161616;
          font-weight: 600;
        }
        .profile-section .user-names h6 {
          font-size: 12px;
          margin: 0;
          color: #818181;
        }
        .sidebar-menu {
          margin-top: 7px;
        }
        .sidebar-item {
          margin-bottom: 7px;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 10px;
          font-size: 15.7px;
          font-weight: 500;
          padding: 9px 14px 9px 18px;
          color: #232323;
          background: transparent;
          text-decoration: none;
          transition: background 0.18s, color 0.14s;
        }
        .sidebar-link .sidebar-icon {
          font-size: 18px;
          margin-right: 2px;
          color: #989898;
          transition: color 0.17s;
        }
        .sidebar-link.active {
          background: #ffe2d1;
          color: #e65000;
          font-weight: 600;
        }
        .sidebar-link.active .sidebar-icon {
          color: #ff6600 !important;
        }
        .sidebar-link:hover {
          background: #ffe7dc;
          color: #ff6600;
        }
        .sidebar-link:hover .sidebar-icon {
          color: #ff6600;
        }
        `}
      </style>
      ;
    </div>
  );
};

export default Sidebar;
