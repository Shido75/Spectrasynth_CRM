import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // 🔍 search state

  // Fetch all product prices
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/product_prices",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const result = await response.json();
        if (response.ok) {
          setProducts(result.data);
        } else {
          setError(result.message || "Failed to fetch products");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Server error while fetching products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Delete specific product price
  const handleDeletePrice = async (productId, priceId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this price?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(
          `http://localhost:8000/api/product_prices/${priceId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (res.ok) {
          Swal.fire("Deleted!", "Price deleted successfully.", "success");

          // Remove deleted price from state
          setProducts((prevProducts) =>
            prevProducts.map((p) =>
              p.id === productId
                ? {
                    ...p,
                    ProductPrices: p.ProductPrices.filter(
                      (pr) => pr.id !== priceId
                    ),
                  }
                : p
            )
          );
        } else {
          Swal.fire("Failed!", "Failed to delete price.", "error");
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error!", "Server error.", "error");
      }
    }
  };

  // 🔍 Filter logic (search by product name or company)
  // 🔍 Filter logic (search by product name or company)
  const filteredProducts = products
    .map((product) => {
      const nameMatch = product.product_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Filter only the prices whose company matches the search
      const matchedPrices = product.ProductPrices?.filter((price) =>
        price.company?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // If searching by product name → show full product with all its prices
      // If searching by company name → show only matching company price rows
      if (searchQuery === "") {
        return product; // show all when no search
      } else if (nameMatch) {
        return product; // keep all prices if name matches
      } else if (matchedPrices && matchedPrices.length > 0) {
        return { ...product, ProductPrices: matchedPrices };
      } else {
        return null;
      }
    })
    .filter(Boolean); // remove nulls

  if (loading) return <div>Loading products...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5>Product Management</h5>
            <Link to="AddProduct" className="btn btn-primary">
              Add Product
            </Link>
          </div>

          {/* 🔍 Search bar */}
          <div className="p-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search by product name or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="card-body">
            <div className="table-responsive mt-3">
              <table className="table table-striped table-bordered">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>CAS No</th>
                    <th>Company</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No matching products found.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.flatMap((product) => {
                      if (
                        !product.ProductPrices ||
                        product.ProductPrices.length === 0
                      ) {
                        return (
                          <tr key={product.id}>
                            <td>{product.product_name}</td>
                            <td>{product.cas_number || "N/A"}</td>
                            <td>N/A</td>
                            <td>N/A</td>
                            <td>N/A</td>
                            <td>-</td>
                          </tr>
                        );
                      }

                      return product.ProductPrices.map((price) => (
                        <tr key={`${product.id}-${price.id}`}>
                          <td>{product.product_name}</td>
                          <td>{product.cas_number || "N/A"}</td>
                          <td>{price.company}</td>
                          <td>₹{price.price}</td>
                          <td>{price.quantity || 0}</td>
                          <td>
                            <Link
                              className="btn btn-warning btn-sm me-1"
                              to={`EditProductPrice/${price.id}`}
                            >
                              Edit Price
                            </Link>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                handleDeletePrice(product.id, price.id)
                              }
                            >
                              Delete Price
                            </button>
                          </td>
                        </tr>
                      ));
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductList;
