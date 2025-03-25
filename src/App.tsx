import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom"; // Add useNavigate
import "./App.css";
import ComplaintForm from "./ComplaintForm";
import SavedResponses from "./SavedResponses";

interface Claim {
  typ: string;
  val: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    roles: string[];
    permissions: string;
  } | null>(null);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate(); // For programmatic navigation

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/.auth/me");
        if (response.ok) {
          const data = await response.json();
          const clientPrincipal = data.clientPrincipal;
          const getClaimValues = (claimType: string): string[] =>
            clientPrincipal.claims
              ?.filter((claim: Claim) => claim.typ === claimType)
              .map((claim: Claim) => claim.val) || [];
          setUser({
            name: clientPrincipal.userDetails,
            email:
              clientPrincipal.claims.find(
                (claim: Claim) => claim.typ === "emails"
              )?.val || clientPrincipal.userId,
            roles: clientPrincipal.userRoles,
            permissions: getClaimValues("roles").join(", "),
          });
        } else {
          setUser(null);
          navigate("/"); // Redirect to home if not logged in
        }
      } catch (err) {
        setError("Error fetching user info.");
        console.error(err);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    // Trigger logout and redirect to home
    window.location.href = "/.auth/logout?post_logout_redirect_uri=/";
  };

  return (
    <div className="App">
      <h1>Complaint Management System</h1>
      <nav
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <Link to="/" style={{ textDecoration: "none", color: "#0078d4" }}>
          Submit Complaint
        </Link>
        <Link
          to="/saved-responses"
          style={{ textDecoration: "none", color: "#0078d4" }}
        >
          View Saved Responses
        </Link>
        {user ? (
          <>
            <span style={{ fontWeight: "bold" }}>Welcome, {user.name}!</span>
            <span style={{ color: "gray" }}>
              Roles: ({user.roles.join(", ")})!
            </span>

            <button
              className="logout-button"
              onClick={handleLogout} // Use onClick instead of <a>
              style={{
                padding: "6px 12px",
                backgroundColor: "#d9534f",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <a href="/.auth/login/aad">
            <button
              className="login-button"
              style={{
                padding: "6px 12px",
                backgroundColor: "#5cb85c",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Login with Microsoft Entra
            </button>
          </a>
        )}
      </nav>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <Routes>
        <Route path="/" element={<ComplaintForm user={user} />} />
        <Route
          path="/saved-responses"
          element={<SavedResponses user={user} />}
        />
      </Routes>
    </div>
  );
};

export default App;
