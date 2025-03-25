import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

interface Claim {
  typ: string;
  val: string;
}

const App: React.FC = () => {
  const [complaint, setComplaint] = useState<string>("");
  const [findings, setFindings] = useState<string>("");
  const [response, setResponse] = useState<string>(""); // Original AI response
  const [editedResponse, setEditedResponse] = useState<string>(""); // Editable response
  const [originalCategory, setOriginalCategory] = useState<string>(""); // AI-generated category
  const [editedCategory, setEditedCategory] = useState<string>(""); // User-edited category
  const [document, setDocument] = useState<File | null>(null); // Uploaded document
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<string>(""); // Feedback for save action
  const [responseId, setResponseId] = useState<string>(""); // Unique identifier
  const [user, setUser] = useState<{
    name: string;
    roles: string[];
    permissions: string;
  } | null>(null); // Authentication state

  const categories = ["Credit Cards", "Channels", "Staff", "Banking & Savings"];

  useEffect(() => {
    // Fetch user info from Static Web Apps authentication endpoint
    const fetchUser = async () => {
      try {
        const response = await fetch("/.auth/me");
        if (response.ok) {
          const data = await response.json();
          console.log("Raw payload from /.auth/me:", data); // Debug raw response
          const clientPrincipal = data.clientPrincipal;

          // Function to get all claim values by type
          const getClaimValues = (claimType: string): string[] => {
            if (
              !clientPrincipal.claims ||
              !Array.isArray(clientPrincipal.claims)
            ) {
              console.warn("No valid claims array found in clientPrincipal");
              return [];
            }

            const matchingClaims = clientPrincipal.claims.filter(
              (claim: Claim) => claim.typ === claimType
            );

            return matchingClaims.map((claim: Claim) => claim.val);
          };

          // Get all roles from claims (if present)
          const approles = getClaimValues("roles");

          setUser({
            name: clientPrincipal.userDetails,
            roles: clientPrincipal.userRoles, // Pre-populated by Static Web Apps
            permissions: approles.length > 0 ? approles.join(", ") : "", // Join multiple roles for display
          });
        } else {
          setError("Please log in to see your roles.");
        }
      } catch (err) {
        setError("Error fetching user info.");
        console.error(err); // Log error for debugging
      }
    };
    fetchUser();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setDocument(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResponse("");
    setEditedResponse("");
    setOriginalCategory("");
    setEditedCategory("");
    setSaveStatus("");
    setResponseId("");

    try {
      const res = await axios.post(
        "/api/processComplaint", // Azure Function endpoint
        { complaint, findings },
        { headers: { "Content-Type": "application/json" } }
      );
      const generatedResponse = res.data.response;
      const generatedCategory = res.data.category;
      setResponse(generatedResponse);
      setEditedResponse(generatedResponse);
      setOriginalCategory(generatedCategory);
      setEditedCategory(generatedCategory);
      console.log("Full response received:", generatedResponse);
      console.log("Category received:", generatedCategory);
    } catch (err) {
      setError("Failed to process complaint. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedResponse(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditedCategory(e.target.value);
  };

  const handleResetResponse = () => {
    setEditedResponse(response);
    setEditedCategory(originalCategory);
    setSaveStatus("");
    setResponseId("");
  };

  const handleSaveResponse = async () => {
    setSaveStatus("Saving...");
    const formData = new FormData();
    formData.append("complaint", complaint);
    formData.append("originalResponse", response);
    formData.append("editedResponse", editedResponse);
    formData.append("originalCategory", originalCategory);
    formData.append("editedCategory", editedCategory);
    if (document) formData.append("document", document);

    try {
      const res = await axios.post(
        "/api/saveResponse", // Azure Function endpoint
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSaveStatus(res.data.status);
      setResponseId(res.data.responseId);
      setDocument(null);
    } catch (err) {
      setSaveStatus("Failed to save response.");
      console.error("Failed to save response:", err);
    }
  };

  if (!user) {
    return (
      <div className="App">
        <h1>Complaint Management System</h1>
        <p>"Not logged in."</p>
        <a href="/.auth/login/aad">Login with Microsoft Entra</a>
      </div>
    );
  }

  if (!user.roles.includes("authenticated")) {
    return (
      <div className="App">
        <h1>Complaint Management System</h1>
        <p>
          "You {user.name} are not allowed to access this web, please contact
          complaintadmin@contoso.com, or switch to another user"
        </p>
        <a href="/.auth/logout">Logout</a>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Complaint Management System</h1>
      <div className="user-info">
        <p>
          Welcome, {user.name}! permission is {user.permissions}
        </p>
        <p>Your roles: {user.roles.join(", ")}</p>
        <a href="/.auth/logout">Logout</a>
      </div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Upload Supplementary Document:</label>
          <input
            type="file"
            accept=".pdf,.docx,.xlsx"
            onChange={handleFileChange}
            style={{ margin: "10px 0" }}
          />
        </div>
        <div>
          <label>Complaint:</label>
          <textarea
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Enter complaint details..."
            rows={5}
            required
          />
        </div>
        <div>
          <label>Investigation Findings:</label>
          <textarea
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            placeholder="Enter findings..."
            rows={3}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Submit Complaint"}
        </button>
      </form>

      {response && (
        <div>
          <h2>Edit Generated Response</h2>
          <textarea
            value={editedResponse}
            onChange={handleResponseChange}
            placeholder="Edit the response here..."
            rows={10}
            style={{ width: "100%", minHeight: "200px", resize: "vertical" }}
          />
          <p>Character count: {editedResponse.length}</p>
          <label>Category:</label>
          <select value={editedCategory} onChange={handleCategoryChange}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div>
            <button onClick={handleSaveResponse}>Save Response</button>
            <button onClick={handleResetResponse}>Reset to Original</button>
          </div>
          {saveStatus && <p>{saveStatus}</p>}
          {responseId && <p>Response ID: {responseId}</p>}
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default App;
