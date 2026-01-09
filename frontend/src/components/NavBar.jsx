import React from "react";
import { Link } from "react-router-dom";
import "./NavBarStyles.css";

const NavBar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">Ranked Voting</Link>
      </div>

      <div className="nav-links">
        {user ? (
          <div className="user-section">
            <Link to="/my-polls" className="my-polls-link">
              My Polls
            </Link>
            <Link to="/polls/create" className="create-poll-link">
              Create Poll
            </Link>
            <span className="username">{user.username}</span>
            <button onClick={onLogout} className="logout-btn">
              Log out
            </button>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link to="/signup" className="nav-link">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
