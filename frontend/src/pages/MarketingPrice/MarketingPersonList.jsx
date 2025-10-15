import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const MaketingPersonList = ({
  canAdd = true,
  canEdit = true,
  canDelete = true,
}) => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch quotations from API
  const fetchQuotations = async () => {
    try {
      const token = localStorage.getItem("token"); // get JWT token from localStorage

      const response = await axios.get("http://localhost:8000/api/quotations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setQuotations(response.data.data || []);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete quotation
  const handleDelete = async (quotation_number) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      try {
        const token = localStorage.getItem("token");

        await axios.delete(
          `http://localhost:8000/api/quotations/${quotation_number}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSuccessMessage(
          `Quotation ${quotation_number} deleted successfully.`
        );
        setQuotations((prev) =>
          prev.filter((q) => q.quotation_number !== quotation_number)
        );
      } catch (error) {
        console.error("Error deleting quotation:", error);
        alert(
          error.response?.data?.message ||
            "Failed to delete quotation. Please check your permissions."
        );
      }
    }
  };
  const handleSendEmail = async (quotationId) => {
    if (
      window.confirm("Are you sure you want to send this quotation via email?")
    ) {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.post(
          `http://localhost:8000/api/quotations/${quotationId}/send-email`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        alert(response.data.message);

        // Update quotation status locally
        setQuotations((prev) =>
          prev.map((q) =>
            q.id === quotationId
              ? {
                  ...q,
                  inquiry: { ...q.inquiry, quotation_status: "forwarded" },
                }
              : q
          )
        );
      } catch (error) {
        console.error("Error sending email:", error);
        alert(
          error.response?.data?.message ||
            "Failed to send email. Please check your permissions."
        );
      }
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5>Marketing Person Evalutation</h5>
          </div>
          <div className="card-body">
            <ul className="nav nav-tabs" id="quotationTabs" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className="nav-link active"
                  id="quotations-tab"
                  data-bs-toggle="tab"
                  type="button"
                  role="tab"
                  aria-controls="quotations"
                  aria-selected="true"
                >
                  Quotations
                </button>
              </li>
            </ul>

            <div className="tab-content mt-3" id="quotationTabsContent">
              <div
                className="tab-pane fade show active"
                id="quotations"
                role="tabpanel"
                aria-labelledby="quotations-tab"
              >
                {loading ? (
                  <div className="text-center mt-4">Loading quotations...</div>
                ) : (
                  <>
                    {successMessage && (
                      <div className="alert alert-success mt-3">
                        {successMessage}
                      </div>
                    )}
                    <div className="table-responsive mt-3">
                      <table className="table table-striped table-bordered">
                        <thead>
                          <tr>
                            <th>Quotation No</th>
                            <th>Date</th>

                            <th>Status</th>
                            <th>Created By</th>
                            <th>Days Since Forwarded</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quotations.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center">
                                No quotations found.
                              </td>
                            </tr>
                          ) : (
                            quotations.map((quotation) => {
                              // Calculate days since forwarded using technical_update_date
                              const referenceDate = quotation.inquiry
                                ?.technical_update_date
                                ? new Date(
                                    quotation.inquiry.technical_update_date
                                  )
                                : null;

                              let daysSinceForwarded = "-";

                              if (referenceDate && !isNaN(referenceDate)) {
                                // Extract only the date part (local)
                                const today = new Date();
                                const todayDateOnly = new Date(
                                  today.getFullYear(),
                                  today.getMonth(),
                                  today.getDate()
                                );
                                const forwardedDateOnly = new Date(
                                  referenceDate.getFullYear(),
                                  referenceDate.getMonth(),
                                  referenceDate.getDate()
                                );

                                // Calculate the difference in full days
                                const diffMs =
                                  todayDateOnly - forwardedDateOnly;
                                const diffDays = Math.max(
                                  0,
                                  Math.floor(diffMs / (1000 * 60 * 60 * 24))
                                );

                                daysSinceForwarded =
                                  diffDays === 0
                                    ? "Today"
                                    : `${diffDays} day(s)`;
                              }
                              // console.log(daysSinceForwarded);

                              return (
                                <tr key={quotation.quotation_number}>
                                  <td>{quotation.quotation_number}</td>
                                  <td>
                                    {quotation.date
                                      ? new Date(
                                          quotation.date
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </td>

                                  <td>
                                    {quotation?.quotation_status
                                      ? quotation.quotation_status
                                      : "N/A"}
                                  </td>

                                  <td>{quotation.quotation_by || "N/A"}</td>

                                  {/* New column */}
                                  <td>{`${daysSinceForwarded} `}</td>

                                  <td>
                                    <>
                                      {quotation.inquiry?.management_status ===
                                      "pending" ? (
                                        <button
                                          className="btn btn-danger me-2 btn-sm"
                                          disabled
                                        >
                                          New
                                        </button>
                                      ) : quotation.inquiry
                                          ?.management_status ===
                                        "forwarded" ? (
                                        <button
                                          className="btn btn-success btn-sm me-2"
                                          disabled
                                        >
                                          Forwarded
                                        </button>
                                      ) : null}

                                      {canEdit && (
                                        <Link
                                          to={`EditQuotation/${quotation.quotation_number}`}
                                          className="btn btn-warning  btn-sm me-1"
                                        >
                                          View{" "}
                                        </Link>
                                      )}
                                    </>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaketingPersonList;
