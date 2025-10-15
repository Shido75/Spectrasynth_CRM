import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useParams } from "react-router-dom";

const QuotationRevisions = () => {
  const { quotation_number } = useParams();
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalChanges, setModalChanges] = useState([]);
  const [modalRevisionNo, setModalRevisionNo] = useState(null);

  useEffect(() => {
    const fetchRevisions = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/quotations/revisiced/history/${quotation_number}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await res.json();
        if (res.ok) {
          setRevisions(data.revisions);
        } else {
          Swal.fire(
            "Error",
            data.message || "Failed to fetch revisions",
            "error"
          );
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Something went wrong fetching revisions", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchRevisions();
  }, [quotation_number]);

  const openModal = (revision) => {
    setModalChanges(revision.changed_items || []);
    setModalRevisionNo(revision.revision_number);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalChanges([]);
    setModalRevisionNo(null);
  };

  if (loading) return <p>Loading revisions...</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <h2>Quotation Revisions: {quotation_number}</h2>
        {revisions.length === 0 ? (
          <p>No revisions found for this quotation.</p>
        ) : (
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Revision No</th>
                <th>PDF</th>
                <th>Changed By</th>
                <th>Date</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {revisions.map((rev) => (
                <tr key={rev.revision_number}>
                  <td>{rev.revision_number}</td>

                  <td>
                    {rev.pdf_path ? (
                      <a
                        href={`http://localhost:8000/${rev.pdf_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary"
                      >
                        View PDF
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{rev.changed_by}</td>
                  <td>{new Date(rev.changed_at).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => openModal(rev)}
                      disabled={
                        !rev.changed_items || rev.changed_items.length === 0
                      }
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Revision {modalRevisionNo} Details
                  </h5>
                  <button className="btn-close" onClick={closeModal}></button>
                </div>
                <div className="modal-body">
                  {modalChanges.length > 0 ? (
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Field</th>
                          <th>Old Value</th>
                          <th>New Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalChanges.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.product_name}</td>
                            <td>{item.field_name}</td>
                            <td>{item.old_value}</td>
                            <td>{item.new_value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No changes found.</p>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeModal}>
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

export default QuotationRevisions;
