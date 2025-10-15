import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function AddProduct() {
  const [products, setProducts] = useState([]); // fetched products
  const [productName, setProductName] = useState(""); // selected product
  const [selectedProduct, setSelectedProduct] = useState(null); // selected product object
  const [prices, setPrices] = useState([{ company: "", price: "", quantity: "", unit: "mg" }]);
  const navigate = useNavigate();

  // Fetch all products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/products", // your getAllProducts route
          {
            headers: {
              // if your auth requires token
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setProducts(response.data.data);
      } catch (error) {
        console.error(
          "Error fetching products:",
          error.response?.data || error
        );
      }
    };

    fetchProducts();
  }, []);

  const handlePriceChange = (index, e) => {
    const newPrices = [...prices];
    newPrices[index][e.target.name] = e.target.value;
    setPrices(newPrices);
  };

  const addPriceField = () =>
    setPrices([...prices, { company: "", price: "", quantity: "", unit: "mg" }]);
  const removePriceField = (index) =>
    setPrices(prices.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8000/api/product_prices",
        {
          productName,
          prices,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log(response.data);
      navigate("/dashboard/ProductList");
    } catch (error) {
      console.error(
        "Error adding product prices:",
        error.response?.data || error
      );
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <h2>Add Product Prices</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Product Name</label>
            <select
              className="form-control"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                const selected = products.find(p => p.product_name === e.target.value);
                setSelectedProduct(selected || null);
              }}
              required
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.product_name}>
                  {product.product_name}
                </option>
              ))}
            </select>
          </div>

          {/* CAS No Display Field */}
          <div className="mb-3">
            <label>CAS No</label>
            <input
              type="text"
              className="form-control"
              value={selectedProduct?.cas_number || "N/A"}
              readOnly
              style={{ backgroundColor: "#f8f9fa" }}
            />
          </div>

          {prices.map((entry, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              {/* Company Name - Full Width */}
              <div className="mb-3">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  name="company"
                  className="form-control"
                  value={entry.company}
                  onChange={(e) => handlePriceChange(index, e)}
                  required
                />
              </div>

              {/* Pricing Info - Horizontal Layout */}
              <div className="mb-3">
                <label className="form-label">Pricing Information</label>
                <div className="row g-2">
                  {/* Price Input */}
                  <div className="col-12 col-sm-4">
                    <label className="form-label small text-muted">Price (₹)</label>
                    <input
                      type="number"
                      name="price"
                      className="form-control form-control-sm"
                      value={entry.price}
                      onChange={(e) => handlePriceChange(index, e)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  {/* Unit Selector */}
                  <div className="col-12 col-sm-3">
                    <label className="form-label small text-muted">Unit</label>
                    <select
                      name="unit"
                      className="form-select form-select-sm"
                      value={entry.unit}
                      onChange={(e) => handlePriceChange(index, e)}
                      required
                    >
                      <option value="mg">mg</option>
                      <option value="gm">gm</option>
                      <option value="ml">ml</option>
                      <option value="kg">kg</option>
                      <option value="ltr">ltr</option>
                    </select>
                  </div>

                  {/* Quantity Input */}
                  <div className="col-12 col-sm-5">
                    <label className="form-label small text-muted">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      className="form-control form-control-sm"
                      value={entry.quantity}
                      onChange={(e) => handlePriceChange(index, e)}
                      min="0"
                      max="999"
                      placeholder="0-999"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              {prices.length > 1 && (
                <div className="d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => removePriceField(index)}
                  >
                    <i className="fas fa-trash-alt me-1"></i>
                    Remove Company
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="d-grid gap-2 mb-4">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={addPriceField}
            >
              <i className="fas fa-plus me-2"></i>
              Add Another Company
            </button>
          </div>
          <br />
          <button type="submit" className="btn btn-primary">
            Add Product Prices
          </button>
          <Link to="/dashboard/ProductList" className="btn btn-secondary ms-2">
            Back
          </Link>
        </form>
      </div>
    </div>
  );
}

export default AddProduct;
