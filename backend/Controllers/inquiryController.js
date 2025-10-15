const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const Inquiry = require("../models/Inquiry");
const InquiryProduct = require("../models/InquiryProduct");
const Quotation = require("../models/Quotation");
const User = require("../models/User");
const Permission = require("../models/Permission");
// Controllers/inquiryController.js
const generateInquiryNumber = require("../Services/generateInquiryNumber"); // ✅ Default import

// Fetch all inquiries
exports.getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.findAll({
      include: [
        {
          model: InquiryProduct,
          as: "products",
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ message: "Inquiries fetched successfully", data: inquiries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add new inquiry (customer + multiple products)
// Add new inquiry (customer + multiple products)
exports.addInquiry = async (req, res) => {
  try {
    let { customer_name, email, products } = req.body;

    if (!customer_name || !email || !products) {
      return res.status(400).json({ error: "Customer info and products are required." });
    }

    if (typeof products === "string") {
      try {
        products = JSON.parse(products);
      } catch (err) {
        return res.status(400).json({ error: "Products must be a valid JSON array." });
      }
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Products must be a non-empty array." });
    }

    // Generate inquiry number automatically
    const inquiry_number = await generateInquiryNumber();
    const inquiry_by = req.user.name;

    const today = new Date(); // current date/time

    // Create main inquiry record
    const newInquiry = await Inquiry.create({
      inquiry_number,
      customer_name,
      email,
      inquiry_status: "forwarded",
      current_stage: "technical_review",
      inquiry_by,
      inquiry_update_date: today, // set update date to today
    });

    // Map and insert products
    const productData = products.map((p) => ({
      inquiry_number,
      product_name: p.ProductName,
      cas_number: p.cas_number || "N/A",
      product_code: p.product_code || "N/A",
      quantity_required: p.quantity_required || 0,
      image_url: p.image_url || null,
    }));

    const createdProducts = await InquiryProduct.bulkCreate(productData);

    res.status(201).json({
      message: "Inquiries added successfully!",
      inquiries: [{ inquiry: newInquiry, products: createdProducts }],
    });
  } catch (err) {
    console.error("Error adding inquiry:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
};


// Grouped inquiries
exports.getGroupedInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.findAll({
      include: [
        {
          model: InquiryProduct,
          as: "products",
          attributes: ["product_name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const grouped = inquiries.map((inq) => ({
      inquiry_number: inq.inquiry_number,
      customer_name: inq.customer_name,
      email: inq.email,
      inquiry_status:inq.inquiry_status,
      current_stage:inq.current_stage,
      inquiry_update_date:inq.inquiry_update_date,
      createdAt:inq.createdAt,
      impurities: inq.products.map((p) => p.product_name),
    }));

    res.json(grouped);
  } catch (err) {
    console.error("Error fetching inquiries:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get inquiries by inquiry_number (same as inquiry_number)
exports.getInquiriesByEmailId = async (req, res) => {
  try {
    const { inquiry_number } = req.params; // inquiry_number

    if (!inquiry_number) {
      return res.status(400).json({ error: "inquiry_number is required" });
    }

    const inquiry = await Inquiry.findOne({
      where: { inquiry_number: inquiry_number },
      include: [
        {
          model: InquiryProduct,
          as: "products",
          attributes: [
            "product_name",
            "cas_number",
            "quantity_required",
            "image_url",
            "product_code",
            "createdAt",
          ],
        },
      ],
    });

    if (!inquiry) {
      return res.status(404).json({ error: "No inquiries found for this email ID" });
    }

    const response = {
      inquiry_number,
      customer_name: inquiry.customer_name,
      technical_status:inquiry.technical_status,
      marketing_status:inquiry.marketing_status,
      po_status:inquiry.po_status,
      inquiries: inquiry.products.map((p) => ({
        ProductName: p.product_name,
        cas_number: p.cas_number,
        quantity_required: p.quantity_required,
        product_code: p.product_code,
        image_url: p.image_url,
        email: inquiry.email,
        createdAt: p.createdAt,
      })),
    };

    res.json(response);
  } catch (err) {
    console.error("Error fetching inquiries:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update inquiry status
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { inquiry_status, current_stage } = req.body; // also receive stage

    const inquiry = await Inquiry.findOne({ where: { inquiry_number: id } });
    if (!inquiry) {
      return res.status(404).json({ error: "Inquiry not found." });
    }

    // Update fields if provided
    if (inquiry_status) {
      inquiry.inquiry_status = inquiry_status;
      inquiry.inquiry_update_date = new Date(); // update inquiry date

      // store the name of the user updating the inquiry
      if (req.user && req.user.name) {
        inquiry.inquiry_by = req.user.name;
      }
    }

    if (current_stage) inquiry.current_stage = current_stage;

    await inquiry.save();

    res.status(200).json({
      message: "Inquiry status and stage updated successfully!",
      inquiry,
    });
  } catch (err) {
    console.error("Error updating inquiry status and stage:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
};



// Update inquiries (product updates)
exports.updateInquiry = async (req, res) => {
  try {
    const { inquiry_number } = req.params; // inquiry_number
    const { inquiries } = req.body;

    if (!inquiries || inquiries.length === 0) {
      return res.status(400).json({ message: "No inquiries to update" });
    }

    for (let inq of inquiries) {
      const product = await InquiryProduct.findOne({
        where: { inquiry_number: inquiry_number, product_name: inq.ProductName },
      });
      if (product) {
        await product.update({
          product_name: inq.ProductName,
          cas_number: inq.cas_number,
          product_code: inq.product_code,
          quantity_required: inq.quantity_required,
        });
      }
    }

    res.json({ message: "All inquiries updated successfully" });
  } catch (error) {
    console.error("Error updating inquiries:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete inquiry + its products
exports.deleteInquiry = async (req, res) => {
  try {
    const { inquiry_number } = req.params; // inquiry_number

    const inquiry = await Inquiry.findOne({
      where: { inquiry_number: inquiry_number },
      include: [{ model: InquiryProduct, as: "products" }],
    });

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    const quotations = await Quotation.findAll({
      where: { inquiry_id: inquiry.id },
    });

    if (quotations && quotations.length > 0) {
      return res.status(400).json({
        message: "Cannot delete this inquiry because a quotation has already been created for it.",
      });
    }

    await inquiry.destroy();

    res.json({ message: "Inquiry deleted successfully" });
  } catch (error) {
    console.error("Delete Inquiry Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get inquiry permissions
exports.getInquiryPermissions = async (req, res) => {
  try {
    const user_id = req.user.id;

    const user = await User.findByPk(user_id, {
      attributes: ["id", "name", "email"],
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const permission = await Permission.findOne({
      where: { user_id, module_name: "inquiry" },
      attributes: ["id", "module_name", "can_create", "can_read", "can_update", "can_delete"],
    });

    if (!permission) {
      return res.status(404).json({ message: "No permissions found for inquiry module" });
    }

    res.json({ user, permission });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
