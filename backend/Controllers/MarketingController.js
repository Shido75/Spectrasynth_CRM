const { Op } = require("sequelize");
const Inquiry = require("../models/Inquiry");
const Quotation = require("../models/Quotation");
const QuotationProduct = require("../models/QuotationProduct");

exports.getProcessedInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.findAll({
  where: {
    current_stage: {
      [Op.notIn]: ["inquiry_received", "technical_review"],
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