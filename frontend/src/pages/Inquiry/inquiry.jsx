import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

const Inquiry = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all inquiries
  const fetchInquiries = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/inquiries/fetchInquiries",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        const formatted = data.map((item, index) => ({
          id: index + 1,
          customer_name: item.customer_name,
          email: item.email,
          inquiry_number: item.inquiry_number,
          createdAt: item.createdAt,
          inquiry_update_date: item.inquiry_update_date,
          products: item.impurities.map((prod) => ({
            product_name: prod,
            cas_no: "-",
            hsn_no: "-",
            qty: "-",
          })),
          inquiry_status: item.inquiry_status || "pending",
          current_stage: item.current_stage || "inquiry_received",
        }));

        setInquiries(formatted);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error || "Failed to fetch inquiries",
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while fetching inquiries",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  // Handle forwarding inquiry
  const handleEvaluate = async (inquiry_number) => {
    const inquiry = inquiries.find(
      (inq) => inq.inquiry_number === inquiry_number
    );

    if (!inquiry) return;

    if (inquiry.inquiry_status === "forwarded") {
      Swal.fire(
        "Already Forwarded",
        "This inquiry has already been forwarded.",
        "info"
      );
      return;
    }

    Swal.fire({
      title: "Forward Inquiry?",
      text: "Once forwarded, it cannot be reverted.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, forward it",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(
            `http://localhost:8000/api/inquiries/${inquiry_number}/status`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                inquiry_status: "forwarded",
                current_stage: "technical_review",
              }),
            }
          );

          const data = await res.json();

          if (res.ok) {
            Swal.fire("Success", "Inquiry forwarded successfully!", "success");
            setInquiries((prev) =>
              prev.map((inq) =>
                inq.inquiry_number === inquiry_number
                  ? {
                      ...inq,
                      inquiry_status: "forwarded",
                      current_stage: "technical_review",
                    }
                  : inq
              )
            );
          } else {
            Swal.fire("Error", data.message || "Failed to update", "error");
          }
        } catch (error) {
          console.error("Forward Error:", error);
          Swal.fire("Error", "Failed to forward inquiry", "error");
        }
      }
    });
  };


  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container mt-4">Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row">
          <div className="col-md-12">
            <div className="page-header">
              <div className="container mt-4">
                <h2>Inquiries List</h2>

                {/* Always show Add New Inquiry button */}
                <Link to="CreateInquiry" className="btn btn-primary mb-3">
                  Add New Inquiry
                </Link>

                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Inquiry Number</th>
                      <th>Employee Name</th>
                      <th>Email</th>
                      <th>Date Inquiry</th>
                      <th>Current Stage</th>
                      <th>Evaluate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map((inquiry) => (
                      <tr key={inquiry.inquiry_number}>
                        <td>{inquiry.inquiry_number}</td>
                        <td>{inquiry.customer_name}</td>
                        <td>{inquiry.email}</td>

                        <td>
                          {new Date(inquiry.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>

                        <td>{inquiry.current_stage}</td>

                        {/* Evaluate Button */}
                        <td>
                          {inquiry.inquiry_status === "pending" ? (
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() =>
                                handleEvaluate(inquiry.inquiry_number)
                              }
                            >
                              New Inquiry
                            </button>
                          ) : (
                            <span className="badge bg-success">Forwarded</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td>
                          <Link
                            to={`EmailInquiries/${inquiry.inquiry_number}`}
                            className="btn btn-sm btn-warning me-2"
                          >
                            View
                          </Link>
                          {inquiry.inquiry_status !== "forwarded" && (
                            <>
                              <Link
                                to={`EditInquiry/${inquiry.inquiry_number}`}
                                className="btn btn-sm btn-warning me-2"
                              >
                                Edit
                              </Link>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inquiry;
