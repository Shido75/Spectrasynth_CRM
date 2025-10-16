import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function AddProduct() {
  const [products, setProducts] = useState([]); // fetched products
  const [productName, setProductName] = useState(""); // selected product
  const [selectedProduct, setSelectedProduct] = useState(null); // selected product object
  const [companies, setCompanies] = useState([
    {
      company: "",
      priceEntries: [{ price: "", quantity: "", unit: "mg" }]
    }
  ]);
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

  const handleCompanyNameChange = (companyIndex, value) => {
    const newCompanies = [...companies];
    newCompanies[companyIndex].company = value;
    setCompanies(newCompanies);
  };

  const handlePriceEntryChange = (companyIndex, priceIndex, field, value) => {
    const newCompanies = [...companies];
    newCompanies[companyIndex].priceEntries[priceIndex][field] = value;
    setCompanies(newCompanies);
  };

  const addCompany = () => {
    setCompanies([...companies, {
      company: "",
      priceEntries: [{ price: "", quantity: "", unit: "mg" }]
    }]);
  };

  const removeCompany = (companyIndex) => {
    setCompanies(companies.filter((_, i) => i !== companyIndex));
  };

  const addPriceEntry = (companyIndex) => {
    const newCompanies = [...companies];
    if (newCompanies[companyIndex].priceEntries.length < 2) {
      newCompanies[companyIndex].priceEntries.push({ price: "", quantity: "", unit: "mg" });
      setCompanies(newCompanies);
    }
  };

  const removePriceEntry = (companyIndex, priceIndex) => {
    const newCompanies = [...companies];
    newCompanies[companyIndex].priceEntries = newCompanies[companyIndex].priceEntries.filter((_, i) => i !== priceIndex);
    setCompanies(newCompanies);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert nested structure back to flat structure for backend compatibility
    const prices = [];
    companies.forEach(company => {
      company.priceEntries.forEach(entry => {
        prices.push({
          company: company.company,
          price: entry.price,
          quantity: entry.quantity,
          unit: entry.unit
        });
      });
    });
    
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

          {companies.map((companyData, companyIndex) => (
            <div key={companyIndex} className="mb-4 p-3 border rounded">
              {/* Company Name - Full Width */}
              <div className="mb-3">
                <label className="form-label fw-bold">Company Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={companyData.company}
                  onChange={(e) => handleCompanyNameChange(companyIndex, e.target.value)}
                  placeholder="Enter company name"
                  required
                />
              </div>

              {/* Price Entries */}
              {companyData.priceEntries.map((priceEntry, priceIndex) => (
                <div key={priceIndex} className="mb-3 p-2 bg-light rounded">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label mb-0">Price Entry {priceIndex + 1}</label>
                    {companyData.priceEntries.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removePriceEntry(companyIndex, priceIndex)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                  
                  <div className="row g-2">
                    {/* Price Input - First */}
                    <div className="col-12 col-sm-4">
                      <label className="form-label small text-muted">Price (₹)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={priceEntry.price}
                        onChange={(e) => handlePriceEntryChange(companyIndex, priceIndex, 'price', e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>

                    {/* Quantity Input - Second */}
                    <div className="col-12 col-sm-4">
                      <label className="form-label small text-muted">Quantity</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={priceEntry.quantity}
                        onChange={(e) => handlePriceEntryChange(companyIndex, priceIndex, 'quantity', e.target.value)}
                        min="0"
                        max="999"
                        placeholder="0-999"
                        required
                      />
                    </div>

                    {/* Unit Selector - Third */}
                    <div className="col-12 col-sm-4">
                      <label className="form-label small text-muted">Unit</label>
                      <select
                        className="form-select form-select-sm"
                        value={priceEntry.unit}
                        onChange={(e) => handlePriceEntryChange(companyIndex, priceIndex, 'unit', e.target.value)}
                        required
                      >
                        <option value="mg">mg</option>
                        <option value="gm">gm</option>
                        <option value="ml">ml</option>
                        <option value="kg">kg</option>
                        <option value="ltr">ltr</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Price Entry Button */}
              {companyData.priceEntries.length < 2 && (
                <div className="mb-3">
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm"
                    onClick={() => addPriceEntry(companyIndex)}
                  >
                    <i className="fas fa-plus me-1"></i>
                    Add Price Entry
                  </button>
                </div>
              )}

              {/* Remove Company Button */}
              {companies.length > 1 && (
                <div className="d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => removeCompany(companyIndex)}
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
              onClick={addCompany}
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
