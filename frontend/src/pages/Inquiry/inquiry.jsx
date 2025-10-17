import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

const Inquiry = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // Pagination calculations
  const totalPages = Math.ceil(inquiries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInquiries = inquiries.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers array
  const getPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

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
                    {currentInquiries.map((inquiry) => (
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

                {/* Pagination Info */}
                {inquiries.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span className="text-muted">
                        Showing {startIndex + 1} to {Math.min(endIndex, inquiries.length)} of {inquiries.length} inquiries
                      </span>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <nav aria-label="Inquiries pagination">
                        <ul className="pagination mb-0">
                          {/* Previous Button */}
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={handlePrevious}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </button>
                          </li>
                          
                          {/* Page Numbers */}
                          {getPageNumbers().map((pageNumber) => (
                            <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => handlePageChange(pageNumber)}
                              >
                                {pageNumber}
                              </button>
                            </li>
                          ))}
                          
                          {/* Next Button */}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={handleNext}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inquiry;
