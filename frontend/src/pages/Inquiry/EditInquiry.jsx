import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const EditInquiries = () => {
  const { inquiry_number } = useParams();
  const navigate = useNavigate();

  const [inquiries, setInquiries] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch all inquiries for this email
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

      if (!response.ok)
        throw new Error(data.error || "Failed to fetch inquiries");

      setCustomerName(data.customer_name);
      // Add editable fields to each inquiry
      const editable = data.inquiries.map((inq) => ({
        ...inq,
        ProductName: inq.ProductName || "",
        cas_number: inq.cas_number || "",
        product_code: inq.product_code || "", // add if backend has
        quantity_required: inq.quantity_required || "",
      }));
      setInquiries(editable);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [inquiry_number]);

  const handleChange = (index, field, value) => {
    const updated = [...inquiries];
    updated[index][field] = value;
    setInquiries(updated);
  };

  const handleSubmit = async () => {
    try {
      // Send all inquiries for update
      const response = await fetch(
        `http://localhost:8000/api/inquiries/updateAll/${inquiry_number}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ inquiries }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Update failed");

      Swal.fire("Success", data.message, "success");
      navigate("/dashboard/Inquiry");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.message, "error");
    }
  };

  if (loading) return <div className="container mt-4">Loading...</div>;

  return (
    <div className="page-wrapper">
      <div className="container mt-4">
        <h2>Edit Inquiries - {customerName}</h2>
        {inquiries.map((inq, index) => (
          <div key={index} className="card mb-3 p-3">
            <div className="mb-3">
              <label className="form-label">Product Name</label>
              <input
                type="text"
                className="form-control"
                value={inq.ProductName}
                onChange={(e) =>
                  handleChange(index, "ProductName", e.target.value)
                }
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">CAS No</label>
              <input
                type="text"
                className="form-control"
                value={inq.cas_number}
                onChange={(e) =>
                  handleChange(index, "cas_number", e.target.value)
                }
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">HSN / Product Code</label>
              <input
                type="text"
                className="form-control"
                value={inq.product_code}
                onChange={(e) =>
                  handleChange(index, "product_code", e.target.value)
                }
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                className="form-control"
                value={inq.quantity_required}
                onChange={(e) =>
                  handleChange(index, "quantity_required", e.target.value)
                }
                required
              />
            </div>
          </div>
        ))}

        <button className="btn btn-success me-2" onClick={handleSubmit}>
          Update All
        </button>
        <Link to="/Inquiry" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </div>
  );
};

export default EditInquiries;
