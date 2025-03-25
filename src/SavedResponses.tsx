import React, { useState, useEffect } from "react";
import axios from "axios";

interface SavedResponse {
  Id: number;
  ResponseId: string;
  Complaint: string;
  OriginalResponse: string;
  EditedResponse: string;
  OriginalCategory: string;
  EditedCategory: string;
  DocumentUrl: string | null;
  SavedAt: string;
}

interface SavedResponsesProps {
  user: { name: string; email: string; roles: string[] } | null;
}

const SavedResponses: React.FC<SavedResponsesProps> = ({ user }) => {
  const [responses, setResponses] = useState<SavedResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const authorizedRoles = ["complaintsysadmin", "complaintsysuser"];
  const isUserAuthorized =
    user && authorizedRoles.some((value) => user.roles.includes(value));

  useEffect(() => {
    if (!isUserAuthorized) return;

    const fetchSavedResponses = async () => {
      try {
        const res = await axios.get("/api/GetSavedResponses");
        setResponses(res.data.responses);
      } catch (err) {
        setError("Failed to load saved responses.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSavedResponses();
  }, [user]);

  if (!user) return <p>Please log in to view saved responses.</p>;
  if (!isUserAuthorized)
    return (
      <p>
        You are not authorized to access this page. Please contact
        admin@contoso.com.
      </p>
    );
  if (loading) return <p>Loading saved responses...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Saved Responses</h2>
      {responses.length === 0 ? (
        <p>No saved responses found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Response ID
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Complaint
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Edited Response
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Category
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Saved At
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Document
              </th>
            </tr>
          </thead>
          <tbody>
            {responses.map((response) => (
              <tr key={response.Id}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {response.ResponseId}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {response.Complaint}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {response.EditedResponse}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {response.EditedCategory}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {new Date(response.SavedAt).toLocaleString()}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {response.DocumentUrl ? (
                    <a
                      href={response.DocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  ) : (
                    "N/A"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SavedResponses;
