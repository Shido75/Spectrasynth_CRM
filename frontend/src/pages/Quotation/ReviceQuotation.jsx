import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useParams, useNavigate } from "react-router-dom";

const initialItem = {
  pq_id: null,
  product_name: "",
  cas_no: "",
  hsn_no: "",
  qty: "",
  price: "",
  lead_time: "",
  company_name: "",
};

const ReviceQuotation = () => {
  const navigate = useNavigate();
  const { quotation_number } = useParams();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [quotationNo, setQuotationNo] = useState(quotation_number || "");
  const [quotedBy, setQuotedBy] = useState("");
  const [items, setItems] = useState([{ ...initialItem }]);
  const [remarks, setRemarks] = useState("");
  const [managementStatus, setManagementStatus] = useState("pending");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalCompanies, setModalCompanies] = useState([]);
  const [modalIndex, setModalIndex] = useState(null);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/quotations/${quotation_number}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await res.json();
        if (res.ok) {
          const q = data.data;
          setRemarks(q.remark || "");
          setDate(
            q.date?.split("T")[0] || new Date().toISOString().split("T")[0]
          );
          setQuotationNo(q.quotation_number);
          setQuotedBy(q.quotation_by);
          setManagementStatus(q.inquiry?.management_status || "pending");

          const mappedProducts = (q.products || []).map((p) => ({
            id: p.id, // // ✅ backend expects this key
            product_name: p.product_name,
            cas_no: p.cas_number,
            hsn_no: p.hsn_number || "",
            qty: p.quantity,
            price: p.price,
            lead_time: p.lead_time,
          }));

          setItems(
            mappedProducts.length ? mappedProducts : [{ ...initialItem }]
          );
        } else {
          Swal.fire(
            "Error",
            data.message || "Failed to fetch quotation",
            "error"
          );
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to fetch quotation data", "error");
      } finally {
        setLoading(false);
      }
    };

    const decodeUserFromToken = () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload?.name) setQuotedBy(payload.name);
      } catch (err) {
        console.error(err);
      }
    };

    fetchQuotation();
    decodeUserFromToken();
  }, [quotation_number]);

  const handleInputChange = (index, field, value) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index][field] = value;
      return newItems;
    });
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
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const data = await res.json();
      setModalCompanies(data.product?.prices || []);
    } catch (err) {
      console.error(err);
      setModalCompanies([]);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare payload for the revision
    const payload = {
      product_id: null, // null = revise all products; or pass items[index].id for single product
      changes: {
        items: items.map((i) => ({
          id: i.id,
          product_name: i.product_name,
          cas_no: i.cas_no,
          hsn_no: i.hsn_no,
          company_name: i.company_name,
          quantity: i.qty,
          price: i.price,
          lead_time: i.lead_time,
        })),
        remark: remarks,
      },
      changed_by: quotedBy, // the logged-in user
    };

    try {
      const res = await fetch(
        `http://localhost:8000/api/quotations/revision/history/${quotation_number}`,
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
        Swal.fire("Success", "Revision created successfully!", "success");
        navigate("/dashboard/QuotationManagement");
      } else {
        Swal.fire(
          "Error",
          data.message || "Failed to create revision",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Something went wrong creating revision", "error");
    }
  };

  const totalPrice = items.reduce(
    (sum, i) => sum + (parseFloat(i.qty) || 0) * (parseFloat(i.price) || 0),
    0
  );
  const gstAmount = totalPrice * 0.18;

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <h2>Revise Quotation</h2>

        {/* Editable form */}
        <form onSubmit={handleSubmit}>
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

          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Product Name</th>
                <th>CAS No</th>
                <th>HSN No</th>
                <th>Quantity</th>
                <th>Company</th>
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
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      value={item.qty}
                      onChange={(e) =>
                        handleInputChange(idx, "qty", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => openCompanyModal(idx)}
                    >
                      {item.company_name || "Other Companies prices"}
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
            <strong>Grand Total: ₹{(totalPrice + gstAmount).toFixed(2)}</strong>
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
            Finalise Quotation
          </button>
        </form>

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

export default ReviceQuotation;
