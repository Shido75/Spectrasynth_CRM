const { Op } = require("sequelize");
const Inquiry = require("../models/Inquiry");
const Quotation = require("../models/Quotation");
const QuotationProduct = require("../models/QuotationProduct");

exports.getProcessedInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.findAll({
      where: {
        current_stage: {
          [Op.ne]: "inquiry_received",
        },
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(inquiries); // just return array for frontend
  } catch (err) {
    console.error("Error fetching processed inquiries:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
};



module.exports.createQuotation = async (req, res) => {
  const { inquiry_number } = req.params;
  console.log("Inquiry Number:", inquiry_number);

  const {
    quotation_number,
    quotation_by,
    date,
    total_price,
    gst,
    products,
    remark,
  } = req.body;

  try {
    // Validate required fields
    if (
      !quotation_number ||
      !inquiry_number ||
      !quotation_by ||
      !date ||
      !products ||
      !products.length ||
      !total_price ||
      !gst
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Fetch full inquiry object
    const inquiry = await Inquiry.findOne({ where: { inquiry_number } });
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    // Begin transaction
    const result = await Quotation.sequelize.transaction(async (t) => {
      // Create quotation record
      const quotation = await Quotation.create(
        {
          quotation_number,
          inquiry_number,
          quotation_by,
          date,
          total_price,
          gst,
          quotation_pdf: null, // no PDF
          remark,
        },
        { transaction: t }
      );

      // Store quotation products
      const storedProducts = [];
      for (const productData of products) {
        const { product_name, cas_no, product_code, quantity, price, lead_time } =
          productData;

        const qp = await QuotationProduct.create(
          {
            quotation_number: quotation.quotation_number,
            product_name,
            cas_number: cas_no,
            hsn_number: product_code,
            quantity,
            price,
            lead_time,
          },
          { transaction: t }
        );

        storedProducts.push({ ...productData, qp_id: qp.id });
      }

      return { quotation, storedProducts };
    });

    // ✅ Update inquiry status and tracking
    inquiry.technical_status = "forwarded";
    inquiry.current_stage = "management_review";
    inquiry.technical_update_date = new Date();
    if (req.user && req.user.name) {
      inquiry.technical_quotation_by = req.user.name;
    }

    await inquiry.save();

    // ✅ Send success response
    res.status(201).json({
      message: "Quotation created successfully",
      quotation: result.quotation,
      products: result.storedProducts,
    });
  } catch (error) {
    console.error("Error creating quotation:", error);
    res
      .status(500)
      .json({ message: "Error creating quotation", error: error.message });
  }
};



// Update technical status (only if pending) and set technical_update_date
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { inquiry_number } = req.params;
    console.log(inquiry_number)
    
    const inquiry = await Inquiry.findOne({ where: { inquiry_number:inquiry_number } });
    if (!inquiry) {
      return res.status(404).json({ error: "Inquiry not found." });
    }

    // Only allow update if status is pending
    if (inquiry.technical_status === "forwarded") {
      return res.status(400).json({
        error: "Technical status is already forwarded and cannot be updated.",
      });
    }

    inquiry.technical_status = "forwarded";
    inquiry.current_stage="management_review"
    inquiry.technical_update_date = new Date();
    
    if (req.user && req.user.name) {
        inquiry.technical_quotation_by = req.user.name;
      }
    await inquiry.save();

    res.json({ message: "Technical status updated successfully.", inquiry });
  } catch (error) {
    console.error("Error updating technical status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
