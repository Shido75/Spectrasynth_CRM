import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Header = () => {
  const navigate = useNavigate();

  const handleLogoutClick = (e) => {
    e.preventDefault();

    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove token
        localStorage.removeItem("token"); // adjust if using sessionStorage or other auth
        navigate("/");
        Swal.fire(
          "Logged Out!",
          "You have been successfully logged out.",
          "success"
        );
      }
    });
  };

  return (
    <div className="header">
      {/* Logo */}
      <div className="header-left active">
        <Link to="/" className="logo logo-normal">
          <img
            src="/assets/img/spect_logo.png"
            alt="Logo"
            style={{ width: "250px", height: "auto" }}
          />
          <img
            src="/assets/img/white-logo.svg"
            className="white-logo"
            alt="Logo"
          />
        </Link>
        <Link to="/" className="logo-small">
          <img src="/assets/img/logo-small.svg" alt="Logo" />
        </Link>
        <a id="toggle_btn" href="#" onClick={(e) => e.preventDefault()}>
          <i className="ti ti-arrow-bar-to-left"></i>
        </a>
      </div>

      <a id="mobile_btn" className="mobile_btn" href="#sidebar">
        <span className="bar-icon">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </a>

      <div className="header-user">
        <ul className="nav user-menu">
          <li className="nav-item nav-search-inputs me-auto">
            <div className="top-nav-search">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="responsive-search"
              >
                <i className="fa fa-search"></i>
              </a>
            </div>
          </li>

          {/* Profile Dropdown */}
          <li className="nav-item dropdown has-arrow main-drop">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="nav-link userset"
              data-bs-toggle="dropdown"
            >
              <span className="user-info">
                <span className="user-letter">
                  <img src="/assets/img/profiles/avatar-20.jpg" alt="Profile" />
                </span>
                <span className="badge badge-success rounded-pill"></span>
              </span>
            </a>
            <div className="dropdown-menu menu-drop-user">
              <div className="profilename">
                <Link to="/dashboard" className="dropdown-item">
                  <i className="ti ti-layout-2"></i> Dashboard
                </Link>
                <Link to="/profile" className="dropdown-item">
                  <i className="ti ti-user-pin"></i> My Profile
                </Link>
                <a
                  href="#"
                  className="dropdown-item"
                  onClick={handleLogoutClick}
                >
                  <i className="ti ti-lock"></i> Logout
                </a>
              </div>
            </div>
          </li>
        </ul>
      </div>

      {/* Mobile Menu */}
      <div className="dropdown mobile-user-menu">
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="nav-link dropdown-toggle"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i className="fa fa-ellipsis-v"></i>
        </a>
        <div className="dropdown-menu">
          <Link to="/dashboard" className="dropdown-item">
            <i className="ti ti-layout-2"></i> Dashboard
          </Link>
          <Link to="/profile" className="dropdown-item">
            <i className="ti ti-user-pin"></i> My Profile
          </Link>
          <a href="#" className="dropdown-item" onClick={handleLogoutClick}>
            <i className="ti ti-lock"></i> Logout
          </a>
        </div>
      </div>
    </div>
  );
};

export default Header;
