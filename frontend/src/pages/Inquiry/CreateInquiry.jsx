import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const CreateInquiry = () => {
  const navigate = useNavigate(); // useNavigate hook
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [products, setProducts] = useState([
    { product_name: "", cas_no: "", hsn_no: "", qty: "" },
  ]);

  const addRow = () => {
    setProducts([
      ...products,
      { product_name: "", cas_no: "", hsn_no: "", qty: "" },
    ]);
  };

  const removeRow = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/api/inquiries/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          customer_name: customerName,
          email: customerEmail,
          products: products.map((p) => ({
            ProductName: p.product_name,
            cas_number: p.cas_no,
            quantity_required: p.qty,
            product_code: p.hsn_no, // HSN number is used as product code
          })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Inquiry added successfully!",
        }).then(() => {
          // Redirect to Inquiry list page
          navigate("/dashboard/Inquiry"); // replace with your Inquiry page route
        });

        // Reset form (optional, since we're redirecting)
        setCustomerName("");
        setCustomerEmail("");
        setProducts([{ product_name: "", cas_no: "", hsn_no: "", qty: "" }]);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error || "Something went wrong!",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to submit inquiry",
      });
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container mt-4">
        <h2>Add New Inquiry</h2>
        <form onSubmit={handleSubmit}>
          {/* Customer Name & Email */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="customer_name">Customer Name</label>
              <input
                type="text"
                id="customer_name"
                className="form-control"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="customer_email">Customer Email</label>
              <input
                type="email"
                id="customer_email"
                className="form-control"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Products Table */}
          <table className="table table-bordered" id="productTable">
            <thead>
              <tr>
                <th>Sr No.</th>
                <th>Product Name</th>
                <th>CAS No</th>
                <th>HSN / Product Code</th>
                <th>Qty</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={product.product_name}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "product_name",
                          e.target.value
                        )
                      }
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={product.cas_no}
                      onChange={(e) =>
                        handleProductChange(index, "cas_no", e.target.value)
                      }
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={product.hsn_no}
                      onChange={(e) =>
                        handleProductChange(index, "hsn_no", e.target.value)
                      }
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      value={product.qty}
                      onChange={(e) =>
                        handleProductChange(index, "qty", e.target.value)
                      }
                      required
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeRow(index)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="button"
            className="btn btn-warning me-2"
            onClick={addRow}
          >
            Add More Product
          </button>
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateInquiry;
