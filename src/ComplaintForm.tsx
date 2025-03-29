import React, { useState } from "react";
import axios from "axios";

interface ComplaintFormProps {
  user: {
    name: string;
    email: string;
    roles: string[];
    permissions: string;
  } | null;
}

const ComplaintForm: React.FC<ComplaintFormProps> = ({ user }) => {
  const [complaint, setComplaint] = useState<string>("");
  const [findings, setFindings] = useState<string>("");
  const [responseTones, setResponseTones] = useState<string[]>([]);
  const [response, setResponse] = useState<string>("");
  const [editedResponse, setEditedResponse] = useState<string>("");
  const [originalCategory, setOriginalCategory] = useState<string>("");
  const [editedCategory, setEditedCategory] = useState<string>("");
  const [document, setDocument] = useState<File | null>(null);
  const [responseScore, setResponseScore] = useState<number | null>(null);
  const [responsePrompt, setResponsePrompt] = useState<string>(""); // New state for full prompt
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [responseId, setResponseId] = useState<string>("");

  const categories = ["Credit Cards", "Channels", "Staff", "Banking & Savings"];
  const toneOptions = ["polite", "formal", "creative", "concise", "empathetic"];
  const scoreOptions = [1, 2, 3, 4, 5];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setDocument(e.target.files[0]);
  };

  const handleToneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tone = e.target.value;
    if (e.target.checked) {
      setResponseTones((prev) => [...prev, tone]);
    } else {
      setResponseTones((prev) => prev.filter((t) => t !== tone));
    }
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResponseScore(parseInt(e.target.value, 10));
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
    setResponseScore(null);
    setResponsePrompt(""); // Reset prompt

    try {
      const res = await axios.post(
        "/api/processComplaint",
        { complaint, findings, responseTones },
        { headers: { "Content-Type": "application/json" } }
      );
      const generatedResponse = res.data.response;
      const generatedCategory = res.data.category;
      const generatedPrompt = res.data.prompt; // Capture full prompt from response
      setResponse(generatedResponse);
      setEditedResponse(generatedResponse);
      setOriginalCategory(generatedCategory);
      setEditedCategory(generatedCategory);
      setResponsePrompt(generatedPrompt);
    } catch (err) {
      setError("Failed to process complaint. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    if (responseScore !== null)
      formData.append("responseScore", responseScore.toString());
    formData.append("responsePrompt", responsePrompt); // Include full prompt

    try {
      const res = await axios.post("/api/saveResponse", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSaveStatus(res.data.status);
      setResponseId(res.data.responseId);
      setDocument(null);
    } catch (err) {
      setSaveStatus("Failed to save response.");
      console.error(err);
    }
  };

  const handleResetResponse = () => {
    setEditedResponse(response);
    setEditedCategory(originalCategory);
    setSaveStatus("");
    setResponseId("");
  };

  const authorizedRoles = ["complaintsysadmin"];
  const isUserAuthorized =
    user && authorizedRoles.some((value) => user.roles.includes(value));

  if (!user) return <p>Please log in to submit a complaint.</p>;
  if (!isUserAuthorized)
    return (
      <p>
        You are not authorized to access this page. Please contact
        admin@contoso.com.
      </p>
    );

  return (
    <div>
      <p></p>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf,.docx,.xlsx"
          onChange={handleFileChange}
        />
        <textarea
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          placeholder="Complaint..."
          rows={5}
          required
        />
        <textarea
          value={findings}
          onChange={(e) => setFindings(e.target.value)}
          placeholder="Findings..."
          rows={3}
        />
        <label>Select Response Tone(s):</label>
        <div style={{ margin: "10px 0" }}>
          {toneOptions.map((tone) => (
            <label key={tone} style={{ marginRight: "20px" }}>
              <input
                type="checkbox"
                value={tone}
                checked={responseTones.includes(tone)}
                onChange={handleToneChange}
              />
              {tone.charAt(0).toUpperCase() + tone.slice(1)}
            </label>
          ))}
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Submit"}
        </button>
      </form>
      {response && (
        <div>
          <h2>Edit Response</h2>
          <textarea
            value={editedResponse}
            onChange={(e) => setEditedResponse(e.target.value)}
            rows={10}
          />
          <select
            value={editedCategory}
            onChange={(e) => setEditedCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <label>Score the Generated Response (1-5):</label>
          <div style={{ margin: "10px 0" }}>
            {scoreOptions.map((score) => (
              <label key={score} style={{ marginRight: "15px" }}>
                <input
                  type="radio"
                  name="responseScore"
                  value={score}
                  checked={responseScore === score}
                  onChange={handleScoreChange}
                />
                {score}
              </label>
            ))}
          </div>
          <div>
            <button onClick={handleSaveResponse}>Save</button>
            <button onClick={handleResetResponse}>Reset to Original</button>
          </div>
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {saveStatus && <p>{saveStatus}</p>}
      {responseId && <p>Response ID: {responseId}</p>}
    </div>
  );
};

export default ComplaintForm;
