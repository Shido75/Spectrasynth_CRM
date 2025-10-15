import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";

const EmailInquiries = () => {
  const { inquiry_number } = useParams(); // get inquiry_number from URL
  const [inquiries, setInquiries] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/inquiries/${inquiry_number}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error || "Failed to fetch inquiries",
        });
        setLoading(false);
        return;
      }

      setCustomerName(data.customer_name);
      setInquiries(data.inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
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
  }, [inquiry_number]);

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
              <div className="row align-items-center">
                <div className="container mt-4">
                  <h1 className="mb-4">Email Inquiries - {customerName}</h1>
                  <div className="table-responsive">
                    <table className="table table-striped table-bordered">
                      <thead className="table-dark">
                        <tr>
                          <th>Product Image</th>
                          <th>Product Name</th>
                          <th>CAS No</th>
                          <th>Quantity</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inquiries.map((inquiry, index) => (
                          <tr key={index}>
                            <td
                              style={{
                                height: "80px",
                                verticalAlign: "middle",
                              }}
                            >
                              <div
                                className="d-flex justify-content-center align-items-center"
                                style={{ height: "100%" }}
                              >
                                <img
                                  src={
                                    `http://localhost:8000/${inquiry.image_url}` ||
                                    "https://via.placeholder.com/80"
                                  }
                                  alt={inquiry.ProductName}
                                  className="img-fluid"
                                  style={{
                                    maxWidth: "80px",
                                    maxHeight: "80px",
                                    objectFit: "contain",
                                  }}
                                />
                              </div>
                            </td>

                            <td>{inquiry.ProductName}</td>
                            <td>{inquiry.cas_number}</td>
                            <td>{inquiry.quantity_required}</td>
                            <td>
                              {new Date(inquiry.createdAt).toLocaleString()}
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
      </div>
    </div>
  );
};

export default EmailInquiries;
