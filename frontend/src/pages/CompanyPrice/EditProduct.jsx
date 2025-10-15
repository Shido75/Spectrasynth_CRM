import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
function EditProductPrice() {
  const { id } = useParams(); // this is the ProductPrice id
  const navigate = useNavigate();

  const [company, setCompany] = useState("");
  const [price, setPrice] = useState("");
  const [productName, setProductName] = useState(""); // just display
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProductPrice = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/product_prices/get/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await res.json();

        if (res.ok) {
          setCompany(data.data.company);
          setPrice(data.data.price);
          setProductName(data.data.product.product_name); // read-only display
        } else {
          setError(data.message || "Failed to fetch product price");
        }
      } catch (err) {
        console.error(err);
        setError("Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchProductPrice();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `http://localhost:8000/api/product_prices/${id}`, // PUT only this ProductPrice
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            company,
            price,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        // SweetAlert popup
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Product price updated successfully",
          confirmButtonText: "OK",
        }).then(() => {
          navigate("/dashboard/ProductList"); // redirect after popup
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: data.message || "Failed to update product price",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong",
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <h3>Edit Product Price</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Product Name</label>
            <input
              type="text"
              className="form-control"
              value={productName}
              readOnly
            />
          </div>

          <div className="mb-3">
            <label>Company</label>
            <input
              type="text"
              className="form-control"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label>Price</label>
            <input
              type="number"
              className="form-control"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Update Price
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProductPrice;
