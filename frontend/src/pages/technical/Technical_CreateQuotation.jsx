import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useParams, useNavigate } from "react-router-dom";

const initialItem = {
  product_name: "",
  cas_no: "",
  hsn_no: "",
  qty: "",
  price: "",
  lead_time: "",
  company_name: "",
};

const Technical_CreateQuotation = () => {
  const navigate = useNavigate();
  const { inquiry_number } = useParams();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [quotationNo, setQuotationNo] = useState("");
  const [quotedBy, setQuotedBy] = useState("");

  const [items, setItems] = useState([]);
  const [remarks, setRemarks] = useState(
    `Payment Term: 30 Days from date of Delivery Material will be supplied with its complete structure elucidation and Interpretation i.e IR, 1H-NMR, MASS, HPLC Purity, TGA, COA and Chromatographic purity (Please Inquire for any extra test)`
  );
  const [technicalStatus, setTechnicalStatus] = useState("pending");

  // For showing existing quotation when forwarded
  const [existingQuotation, setExistingQuotation] = useState(null);

  // Modal state for companies
  const [showModal, setShowModal] = useState(false);
  const [modalCompanies, setModalCompanies] = useState([]);
  const [modalIndex, setModalIndex] = useState(null);

  useEffect(() => {
    const fetchInquiryProducts = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/inquiries/${inquiry_number}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await res.json();
        setTechnicalStatus(data.technical_status || "pending");

        // If forwarded → load quotation directly
        if (data.technical_status === "forwarded") {
          fetchExistingQuotation();
          return;
        }

        if (res.ok && data.inquiries) {
          const productsFromInquiry = data.inquiries.map((p) => ({
            product_name: p.ProductName,
            cas_no: p.cas_number,
            hsn_no: p.product_code || "",
            qty: p.quantity_required,
            price: "",
            lead_time: "",
            company_name: "",
          }));
          setItems(productsFromInquiry);
        }
      } catch (err) {
        console.error("Error fetching inquiry products:", err);
      }
    };

    const fetchQuotationNumber = async () => {
      try {
        const res = await fetch(
          "http://localhost:8000/api/quotations/lastQuotationNumber",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const now = new Date();
        const yearYY = now.getFullYear().toString().slice(-2);
        const monthMM = String(now.getMonth() + 1).padStart(2, "0");
        const currentDatePart = `${yearYY}${monthMM}`;
        let nextSequentialNumber = 1;

        if (res.ok) {
          const data = await res.json();
          if (data.lastQuotationNumber) {
            const parts = data.lastQuotationNumber.split("-");
            const lastDatePart = parts[2];
            const lastSequentialPart = parseInt(parts[3], 10);

            if (lastDatePart === currentDatePart) {
              nextSequentialNumber = lastSequentialPart + 1;
            } else {
              nextSequentialNumber = 1;
            }
          }
        }

        const newSequentialPart = String(nextSequentialNumber).padStart(3, "0");
        setQuotationNo(`SS-Q-${currentDatePart}-${newSequentialPart}`);
      } catch (err) {
        console.error(err);
        const now = new Date();
        const yearYY = now.getFullYear().toString().slice(-2);
        const monthMM = String(now.getMonth() + 1).padStart(2, "0");
        const currentDatePart = `${yearYY}${monthMM}`;
        setQuotationNo(`SS-Q-${currentDatePart}-001`);
      }
    };

    // Fetch data
    fetchInquiryProducts();
    fetchQuotationNumber();
    decodeUserFromToken();
  }, [inquiry_number]);

  // 🟦 Fetch existing quotation when forwarded
  const fetchExistingQuotation = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/quotations/byInquiryNumber/${inquiry_number}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setExistingQuotation(data.data);
      } else {
        Swal.fire("Error", data.message || "No quotation found", "error");
      }
    } catch (err) {
      console.error("Error fetching quotation:", err);
      Swal.fire("Error", "Failed to fetch existing quotation", "error");
    }
  };
  const decodeUserFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      if (payload && payload.name) {
        setQuotedBy(payload.name);
      }
    } catch (err) {
      console.error("Error decoding token:", err);
    }
  };

  const openCompanyModal = async (index) => {
    const productName = items[index].product_name;
    if (!productName) return;

    setModalIndex(index);
    setShowModal(true);
    setModalCompanies([]);

    try {
      const res = await fetch(
        `http://localhost:8000/api/product_prices/${productName}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await res.json();
      setModalCompanies(data.product?.prices || []);
    } catch (err) {
      console.error(err);
      setModalCompanies([]);
    }
  };

  const handleInputChange = (index, field, value) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index][field] = value;
      return newItems;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (technicalStatus === "forwarded") {
      Swal.fire(
        "Access Denied",
        "Cannot create quotation. Technical status already forwarded.",
        "error"
      );
      return;
    }

    const productsToSend = items
      .filter((i) => i.product_name && i.price)
      .map((i) => ({
        product_name: i.product_name,
        cas_no: i.cas_no,
        hsn_no: i.hsn_no,
        quantity: i.qty,
        price: i.price,
        lead_time: i.lead_time,
      }));

    if (!productsToSend.length) {
      Swal.fire(
        "Warning",
        "Please enter price for at least one product",
        "warning"
      );
      return;
    }

    const totalPrice = productsToSend.reduce(
      (sum, i) =>
        sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.price) || 0),
      0
    );
    const gstAmount = totalPrice * 0.18;

    const payload = {
      quotation_number: quotationNo,
      quotation_by: quotedBy,
      date,
      total_price: totalPrice,
      gst: gstAmount,
      products: productsToSend,
      remark: remarks,
    };

    try {
      const res = await fetch(
        `http://localhost:8000/api/technical/createQuotation/${inquiry_number}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (res.ok) {
        Swal.fire("Success", "Quotation created successfully!", "success");
        setItems(items.map((i) => ({ ...i, price: "" })));
        navigate("/dashboard/technical");
      } else {
        Swal.fire(
          "Error",
          data.message || "Failed to create quotation",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Something went wrong creating quotation", "error");
    }
  };

  // Price Calculations
  const totalPrice = items.reduce(
    (sum, i) => sum + (parseFloat(i.qty) || 0) * (parseFloat(i.price) || 0),
    0
  );
  const gstAmount = totalPrice * 0.18;

  const handleRemoveItem = (index) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This product will be removed from the quotation.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
    }).then((result) => {
      if (result.isConfirmed) {
        setItems((prev) => prev.filter((_, i) => i !== index));
        Swal.fire("Removed!", "The product has been removed.", "success");
      }
    });
  };

  // 🟨 Render Section
  return (
    <div className="page-wrapper">
      <div className="content">
        <h2>Create / View Quotation</h2>

        {/* ---------------------- */}
        {/* CASE 1: Forwarded → Show existing quotation */}
        {/* ---------------------- */}
        {technicalStatus === "forwarded" && existingQuotation ? (
          <div className="card p-4 shadow-sm mt-3">
            <h4>Quotation Already Generated</h4>
            <p>
              <strong>Quotation No:</strong>{" "}
              {existingQuotation.quotation_number}
              <br />
              <strong>Date:</strong> {existingQuotation.date}
              <br />
              <strong>Quoted By:</strong> {existingQuotation.quotation_by}
            </p>

            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Product Name</th>
                  <th>CAS No</th>
                  <th>HSN No</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Lead Time</th>
                </tr>
              </thead>
              <tbody>
                {existingQuotation.products.map((p, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{p.product_name}</td>
                    <td>{p.cas_number}</td>
                    <td>{p.hsn_number}</td>
                    <td>{p.quantity}</td>
                    <td>₹{p.price}</td>
                    <td>{p.lead_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Section */}
            <div className="mb-3">
              <strong>Total Price:</strong> ₹{existingQuotation.total_price}{" "}
              <br />
              <strong>GST (18%):</strong> ₹{existingQuotation.gst} <br />
              <strong>Grand Total:</strong> ₹
              {(
                parseFloat(existingQuotation.total_price) +
                parseFloat(existingQuotation.gst)
              ).toFixed(2)}
            </div>

            <p>
              <strong>Remarks:</strong> {existingQuotation.remark}
            </p>
          </div>
        ) : technicalStatus === "forwarded" && !existingQuotation ? (
          <p className="text-danger">Quotation forwarded but not found.</p>
        ) : (
          // ----------------------
          // CASE 2: Pending → Create new quotation
          // ----------------------
          <form onSubmit={handleSubmit}>
            {/* Header Section */}
            <div className="row mb-3">
              <div className="col-md-3">
                <label>Date:</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-4">
                <label>Quotation No:</label>
                <input
                  type="text"
                  className="form-control"
                  value={quotationNo}
                  readOnly
                />
              </div>
              <div className="col-md-5">
                <label>Quoted By:</label>
                <input
                  type="text"
                  className="form-control"
                  value={quotedBy}
                  readOnly
                />
              </div>
            </div>

            {/* Product Table */}
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Product Name</th>
                  <th>CAS No</th>
                  <th>HSN No</th>
                  <th>Quantity</th>
                  <th>Other Company price</th>
                  <th>Price</th>
                  <th>Lead Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{item.product_name}</td>
                    <td>{item.cas_no}</td>
                    <td>{item.hsn_no}</td>
                    <td>{item.qty}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => openCompanyModal(idx)}
                      >
                        {item.company_name || "View Companies"}
                      </button>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={item.price}
                        onChange={(e) =>
                          handleInputChange(idx, "price", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={item.lead_time}
                        onChange={(e) =>
                          handleInputChange(idx, "lead_time", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveItem(idx)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mb-3">
              <strong>Total Price: ₹{totalPrice.toFixed(2)}</strong>
              <br />
              <strong>GST (18%): ₹{gstAmount.toFixed(2)}</strong>
              <br />
              <strong>
                Grand Total: ₹{(totalPrice + gstAmount).toFixed(2)}
              </strong>
            </div>

            <div className="mb-3">
              <label>Remarks / Terms & Conditions</label>
              <textarea
                className="form-control"
                rows="4"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Submit Quotation
            </button>
          </form>
        )}

        {/* Company Modal */}
        {showModal && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Companies for {items[modalIndex]?.product_name}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  />
                </div>
                <div className="modal-body">
                  {modalCompanies.length > 0 ? (
                    <ul className="list-group">
                      {modalCompanies.map((c, i) => (
                        <li
                          key={i}
                          className="list-group-item d-flex justify-content-between"
                        >
                          <span>{c.company}</span>
                          <span>₹{c.price}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-danger text-center">
                      No companies available for this product.
                    </p>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Technical_CreateQuotation;
