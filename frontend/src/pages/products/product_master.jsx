import React, { useState, useEffect } from "react";

const ProductMaster = () => {
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_name: "",
    cas_number: "",
    hsn_code: "",
    status: "active",
  });
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ✅ Fetch all products
  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/products", {
        headers,
      });
      const data = await response.json();
      console.log("Fetched products:", data);
      setProducts(data.data || []); // ✅ actual array
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // ✅ Add new product
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/api/products", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok) {
        setMessage("Product added successfully");
        fetchProducts();
        setShowAddModal(false);
        setFormData({
          product_name: "",
          cas_number: "",
          hsn_code: "",
          status: "active",
        });
      } else {
        setMessage(result.message || "Error adding product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  // ✅ Open edit modal
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      cas_number: product.cas_number,
      hsn_code: product.product_code, // ✅ match backend key
      status: product.status,
    });
    setShowEditModal(true);
  };

  // ✅ Update product
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:8000/api/products/${editingProduct.id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(formData),
        }
      );
      const result = await response.json();
      if (response.ok) {
        setMessage("Product updated successfully");
        fetchProducts();
        setShowEditModal(false);
        setEditingProduct(null);
      } else {
        setMessage(result.message || "Error updating product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  // ✅ Delete product
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        const response = await fetch(
          `http://localhost:8000/api/products/${id}`,
          {
            method: "DELETE",
            headers,
          }
        );
        const result = await response.json();
        if (response.ok) {
          setMessage("Product deleted successfully");
          fetchProducts();
        } else {
          setMessage(result.message || "Error deleting product");
        }
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <h4 className="page-title">Product Master</h4>
        {message && <div className="alert alert-success">{message}</div>}

        <div className="d-flex justify-content-between align-items-center mb-3">
          <button className="btn btn-success">Import Impurities</button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            + Add Product
          </button>
        </div>

        {/* ✅ Products Table */}
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Product Name</th>
                <th>CAS Number</th>
                <th>HSN Code</th>
                <th>Status</th>
                <th width="140">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.product_name}</td>
                    <td>{product.cas_number}</td>
                    <td>{product.product_code}</td>
                    <td>
                      {product.status.charAt(0).toUpperCase() +
                        product.status.slice(1)}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning me-1"
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Add Product Modal */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleAdd}>
                <div className="modal-header">
                  <h5 className="modal-title">Add Product</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label>Product Name</label>
                    <input
                      type="text"
                      name="product_name"
                      className="form-control"
                      value={formData.product_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label>CAS Number</label>
                    <input
                      type="text"
                      name="cas_number"
                      className="form-control"
                      value={formData.cas_number}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label>HSN Code</label>
                    <input
                      type="text"
                      name="hsn_code"
                      className="form-control"
                      value={formData.hsn_code}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label>Status</label>
                    <select
                      name="status"
                      className="form-control"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" type="submit">
                    Add
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleUpdate}>
                <div className="modal-header">
                  <h5 className="modal-title">Edit Product</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProduct(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label>Product Name</label>
                    <input
                      type="text"
                      name="product_name"
                      className="form-control"
                      value={formData.product_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label>CAS Number</label>
                    <input
                      type="text"
                      name="cas_number"
                      className="form-control"
                      value={formData.cas_number}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label>HSN Code</label>
                    <input
                      type="text"
                      name="hsn_code"
                      className="form-control"
                      value={formData.hsn_code}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label>Status</label>
                    <select
                      name="status"
                      className="form-control"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" type="submit">
                    Update
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProduct(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMaster;
