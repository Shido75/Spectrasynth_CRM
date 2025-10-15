const express = require("express");

const path = require("path");

const router = express.Router();
const Quotation = require("../models/Quotation");
const QuotationProduct = require("../models/QuotationProduct");
const Product = require("../models/Product");
const Inquiry = require("../models/Inquiry");
const QuotationRevision=require("../models/QuotationRevision")
const { generateQuotationPDF } = require("../Services/pdfgenerate");
const nodemailer = require("nodemailer");
const fs = require("fs");
const QuotationReviced = require("../models/QuotationReviced");
const { Op } = require("sequelize");
// const {generateRevicedQuotationPDF} =require("../services/reviceePdfgeneration")


module.exports.createQuotation = async (req, res) => {
  const { inquiry_number } = req.params;
  console.log("Email Unique ID:", inquiry_number);
  const {
    quotation_number,
    quotation_by,
    date,
    total_price,
    gst,
    products,
    remark
  } = req.body;

  try {
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

    const inquiry_id = await Inquiry.findOne({
      where: { inquiry_number },
      attributes: ["id"],
    }).then((inq) => (inq ? inq.id : null));

    const result = await Quotation.sequelize.transaction(async (t) => {
      // Create quotation
      const quotation = await Quotation.create(
        {
          quotation_number,
          inquiry_number:inquiry_id,
          quotation_by,
          date,
          total_price,
          gst,
          quotation_pdf: null,
          remark
        },
        { transaction: t }
      );

      let storedProducts = [];

      for (const productData of products) {
        const { product_name, cas_no,product_code, company_name, quantity, price, lead_time } = productData;

        // Optional: check if product exists in Product table
        // const productExists = await Product.findOne({
        //   where: { name: product_name, cas_number },
        //   transaction: t
        // });
        // if (!productExists) {
        //   throw new Error(`Product not found: ${product_name}, CAS=${cas_number}`);
        // }

        const qp = await QuotationProduct.create(
          {
            quotation_number: quotation.quotation_number,
            product_name,
            cas_number: cas_no,
            hsn_number:product_code,
            company_name,
            quantity,
            price,
            lead_time,
          },
          { transaction: t }
        );

        storedProducts.push({ ...productData, qp_id: qp.id });
      }
      const inquiry = await Inquiry.findOne({ where: { id: quotation.inquiry_id } });
      

const pdfPath = await generateQuotationPDF(quotation, products, inquiry);


      // Generate PDF
      
      quotation.quotation_pdf = pdfPath;
      await quotation.save({ transaction: t });

      return { quotation, storedProducts };
    });

    res.status(201).json({
      message: "Quotation created successfully",
      quotation: result.quotation,
      products: result.storedProducts,
    });
  } catch (error) {
    console.error("Error creating quotation:", error);
    res.status(500).json({ message: "Error creating quotation", error: error.message });
  }
};



exports.getLastQuotationNumber = async (req, res) => {
  try {
    const lastQuotation = await Quotation.findOne({
      order: [["createdAt", "DESC"]],
      attributes: ["quotation_number"],
    });

    if (!lastQuotation) {
      return res.json({ lastQuotationNumber: null }); 
    }

    res.json({ lastQuotationNumber: lastQuotation.quotation_number });
  } catch (error) {
    console.error("Error fetching last quotation number:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.getQuotationByNumber = async (req, res) => {
  try {
    const { quotation_number } = req.params;

    // Fetch quotation along with associated products and inquiry
    const quotation = await Quotation.findOne({
      where: { quotation_number },
      include: [
        {
          model: QuotationProduct,
          as: "quotation_products", // must match the alias in your model
        },
        {
          model: Inquiry,
          as: "inquiry", // must match the alias in your model
        },
      ],
    });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    // Convert to JSON and map products for frontend convenience
    const result = quotation.toJSON();
    result.products = result.quotation_products || [];

    res.status(200).json({
      message: "Quotation fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching quotation:", error);
    res.status(500).json({
      message: "Error fetching quotation",
      error: error.message,
    });
  }
};


exports.getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.findAll({
      attributes: [
        "quotation_number",
        "date",
        "quotation_by",
        "total_price",
        "gst",
        "remark",
           "quotation_status",
      ],
      include: [
        {
          model: Inquiry,
          as: "inquiry",
          attributes: [
            "inquiry_number",       // primary key
            "customer_name",        // optional, can be used instead of ProductName
            "current_stage",        // if you want to show stage info
            "management_status",      // existing status field
            "technical_update_date"
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Quotations fetched successfully",
      data: quotations,
    });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    res.status(500).json({ message: "Error fetching quotations", error: error.message });
  }
};


// Delete quotation
exports.deleteQuotation = async (req, res) => {
  try {
    const { quotation_number } = req.params;
  
    const quotation = await Quotation.findByPk(quotation_number);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    await QuotationProduct.destroy({
      where: { quotation_number: quotation.quotation_number },
    });

    await quotation.destroy();

    res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error) {
    console.error("Error deleting quotation:", error);
    res.status(500).json({ message: "Error deleting quotation", error: error.message });
  }
};

exports.sendQuotationEmail = async (req, res) => {
  try {
    const { id: quotation_number } = req.params;

    // Fetch quotation and related inquiry
    const quotation = await Quotation.findOne({
      where: { quotation_number },
      include: [
        {
          model: Inquiry,
          as: "inquiry",
          attributes: ["inquiry_number", "email"],
        },
      ],
    });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const recipientEmail = quotation.inquiry?.email;
    if (!recipientEmail) {
      return res.status(400).json({ message: "No email linked to this quotation" });
    }

    // Define path to quotation file
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "quotations",
      `${quotation.quotation_number}.pdf`
    );

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ message: "Quotation file not found" });
    }

    // Nodemailer configuration
    const transporter = nodemailer.createTransport({
      service: "Gmail", // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `Quotation ${quotation.quotation_number}`,
      text: `Hello,\n\nPlease find attached your quotation ${quotation.quotation_number}.\n\nRegards,\nTeam`,
      attachments: [
        {
          filename: `${quotation.quotation_number}.pdf`,
          path: filePath,
        },
      ],
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Update quotation email fields
    await Quotation.update(
      {
        email_sent_date: new Date(),
        email_sent_by: req.user.name,
        quotation_status:"send_email"
      },
      { where: { quotation_number } }
    );

    const inquiry_number = quotation.inquiry.inquiry_number;
    if (inquiry_number) {
      await Inquiry.update(
        { quotation_status: "forwarded" },
        { where: { inquiry_number: inquiry_number } }
      );
    }

    res.json({
      message: "Quotation sent successfully, email info updated, and related inquiry forwarded",
    });
  } catch (error) {
    console.error("Error sending quotation email:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports.editQuotation = async (req, res) => {
  const { quotation_number } = req.params;
  const {
    quotation_by,
    date,
    total_price,
    gst,
    products,
    remark,
  } = req.body;

  try {
    if (!quotation_number || !products || !products.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const quotation = await Quotation.findOne({
      where: { quotation_number },
      include: [{ model: Inquiry, as: "inquiry" }],
    });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const result = await Quotation.sequelize.transaction(async (t) => {
      // Update quotation details
      quotation.quotation_by = quotation_by || quotation.quotation_by;
      quotation.date = date || quotation.date;
      quotation.total_price = total_price || quotation.total_price;
      quotation.gst = gst || quotation.gst;
      quotation.remark = remark || quotation.remark;
      quotation.quotation_status = "finalise"
      await quotation.save({ transaction: t });

      // Update linked inquiry fields
      const inquiry = quotation.inquiry;
      if (inquiry) {
        inquiry.management_status = 'forwarded';
        inquiry.current_stage = "purchase_order";
        inquiry.management_update_date = new Date(); // set to now
        inquiry.marketing_quotation_by = quotation_by || inquiry.marketing_quotation_by;
        await inquiry.save({ transaction: t });
      }

      // Handle quotation products
      const existingProducts = await QuotationProduct.findAll({
        where: { quotation_number },
        transaction: t,
      });
      const existingProductMap = new Map(
        existingProducts.map((p) => [p.id, p])
      );
      const updatedProductIds = [];

      for (const productData of products) {
        const {
          qp_id,
          product_name,
          cas_no,
          product_code,
          company_name,
          quantity,
          price,
          lead_time,
        } = productData;

        if (qp_id && existingProductMap.has(qp_id)) {
          // Update existing product
          const product = existingProductMap.get(qp_id);
          await product.update(
            {
              product_name,
              cas_number: cas_no,
              hsn_number: product_code,
              company_name,
              quantity,
              price,
              lead_time,
            },
            { transaction: t }
          );
          updatedProductIds.push(qp_id);
        } else {
          // Create new product
          const newProduct = await QuotationProduct.create(
            {
              quotation_number,
              product_name,
              cas_number: cas_no,
              hsn_number: product_code,
              company_name,
              quantity,
              price,
              lead_time,
            },
            { transaction: t }
          );
          updatedProductIds.push(newProduct.id);
        }
      }

      // Delete removed products
      const productsToDelete = existingProducts.filter(
        (p) => !updatedProductIds.includes(p.id)
      );
      if (productsToDelete.length > 0) {
        const deleteIds = productsToDelete.map((p) => p.id);
        await QuotationProduct.destroy({
          where: { id: deleteIds },
          transaction: t,
        });
      }

      // Regenerate PDF
      const updatedProducts = await QuotationProduct.findAll({
        where: { quotation_number },
        transaction: t,
      });

      const pdfPath = await generateQuotationPDF(quotation, updatedProducts, inquiry);
      quotation.quotation_pdf = pdfPath;
      await quotation.save({ transaction: t });

      return { quotation, updatedProducts };
    });

    res.status(200).json({
      message: "Quotation and product details updated successfully",
      quotation: result.quotation,
      products: result.updatedProducts,
    });
  } catch (error) {
    console.error("Error updating quotation:", error);
    res.status(500).json({
      message: "Error updating quotation",
      error: error.message,
    });
  }
};


// Get latest quotation by inquiry_number
exports.getLatestQuotationByInquiry = async (req, res) => {
  try {
    const { inquiry_number } = req.params;

    // Fetch the latest quotation linked to the inquiry_number
    const quotation = await Quotation.findOne({
      where: { inquiry_number },
      include: [
        {
          model: QuotationProduct,
          as: "quotation_products",
        },
        {
          model: require("../models/Inquiry"),
          as: "inquiry",
        },
      ],
      order: [["createdAt", "DESC"]], // Latest quotation first
    });

    if (!quotation) {
      return res.status(404).json({ message: "No quotation found for this inquiry" });
    }

    // Convert to JSON and map products for frontend convenience
    const result = quotation.toJSON();
    result.products = result.quotation_products || [];

    res.status(200).json({ message: "Latest quotation fetched", data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.getAllProcessQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.findAll({
      where: { 
        quotation_status: { [Op.ne]: "Temp. Quatation" } // ❌ not equal
      },
      attributes: [
        "quotation_number",
        "date",
        "quotation_by",
        "total_price",
        "gst",
        "remark",
        "quotation_status",
        "email_sent_date"
      ],
      include: [
        {
          model: Inquiry,
          as: "inquiry",
          attributes: [
            "inquiry_number",
            "customer_name",
            "current_stage",
            "management_status",
            "technical_update_date"
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Quotations fetched successfully",
      data: quotations,
    });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    res.status(500).json({ message: "Error fetching quotations", error: error.message });
  }
};

exports.reviseQuotation = async (req, res) => {
  try {
    const { quotation_number } = req.params;
    const updates = req.body;

    // Use authenticated user for changed_by
    const changed_by = req.user?.name || "System";

    const quotation = await Quotation.findOne({
      where: { quotation_number },
      include: [{ model: QuotationProduct, as: "quotation_products" }],
    });

    if (!quotation)
      return res.status(404).json({ message: "Quotation not found" });

    // Update main quotation fields
    const quotationFields = { ...updates };
    delete quotationFields.products;
    await quotation.update(quotationFields);

    // Handle products
    if (updates.products) {
      const existingProducts = quotation.quotation_products;
      const updatedProducts = updates.products;

      const existingIds = existingProducts.map((p) => p.id);
      const incomingIds = updatedProducts.map((p) => p.id).filter(Boolean);

      // Delete removed products
      const productsToDelete = existingProducts.filter(
        (p) => !incomingIds.includes(p.id)
      );

      for (const prod of productsToDelete) {
        await QuotationRevision.create({
          product_id: prod.id,
          field_name: "DELETED_PRODUCT",
          old_value: JSON.stringify({
            product_name: prod.product_name,
            cas_no: prod.cas_number,
            hsn_no: prod.hsn_number,
            quantity: prod.quantity,
            price: prod.price,
            lead_time: prod.lead_time,
          }),
          new_value: null,
          changed_by,
        });
        await QuotationProduct.destroy({ where: { id: prod.id } });
      }

      // Add or update products
      for (const product of updatedProducts) {
        if (product.id) {
          const existing = existingProducts.find((p) => p.id === product.id);
          const changedFields = [];

          for (const key of ["quantity", "price", "lead_time"]) {
            const oldVal = existing[key] ?? null;
            const newVal = product[key] ?? null;
            if (String(oldVal) !== String(newVal)) {
              changedFields.push({
                product_id: product.id,
                field_name: key,
                old_value: oldVal !== null ? String(oldVal) : null,
                new_value: newVal !== null ? String(newVal) : null,
                changed_by,
              });
            }
          }

          if (changedFields.length > 0) {
            await Promise.all(
              changedFields.map((change) => QuotationRevision.create(change))
            );

            await QuotationProduct.update(
              {
                quantity: product.quantity,
                price: product.price,
                lead_time: product.lead_time,
              },
              { where: { id: product.id } }
            );
          }
        } else {
          const newProduct = await QuotationProduct.create({
            product_name: product.product_name || "",
            cas_number: product.cas_no || "",
            hsn_number: product.hsn_no || "",
            quantity: product.quantity || 0,
            price: product.price || 0,
            lead_time: product.lead_time || "",
            quotation_id: quotation.id,
            quotation_number: quotation.quotation_number,
          });

          await QuotationRevision.create({
            product_id: newProduct.id,
            field_name: "NEW_PRODUCT",
            old_value: null,
            new_value: JSON.stringify({
              product_name: newProduct.product_name,
              cas_no: newProduct.cas_number,
              hsn_no: newProduct.hsn_number,
              quantity: newProduct.quantity,
              price: newProduct.price,
              lead_time: newProduct.lead_time,
            }),
            changed_by,
          });
        }
      }
    }

    res.json({ message: "Quotation updated successfully with revisions logged" });
  } catch (error) {
    console.error("Error updating quotation:", error);
    res.status(500).json({ message: "Error updating quotation", error });
  }
};



exports.getRevisionsByQuotationNumber = async (req, res) => {
  try {
    const { quotation_number } = req.params;
    console.log(quotation_number)

    // Find all products of the quotation
    const products = await QuotationProduct.findAll({
      where: { quotation_number },
      attributes: ["id", "product_name"],
    });

    if (!products.length) {
      return res.status(404).json({ message: "No products found for this quotation" });
    }

    const productIds = products.map((p) => p.id);

    // Get revisions for those product IDs
    const revisions = await QuotationRevision.findAll({
      where: { product_id: productIds },
      include: [
        {
          model: QuotationProduct,
          attributes: ["product_name", "cas_number", "hsn_number"],
        },
      ],
      order: [["changed_at", "DESC"]],
    });

    res.json({ quotation_number, revisions });
  } catch (error) {
    console.error("Error fetching revisions:", error);
    res.status(500).json({ message: "Error fetching revisions", error });
  }
};



exports.postReviseQuotation = async (req, res) => {
  try {
    const { quotation_number } = req.params;
    const { product_id, changes, changed_by } = req.body;

    // 1️⃣ Fetch latest revision number
    const latestRevision = await QuotationReviced.findOne({
      where: { quotation_number },
      order: [["revision_number", "DESC"]],
    });
    const nextRevisionNumber = latestRevision ? latestRevision.revision_number + 1 : 1;

    // 2️⃣ Fetch quotation and products
    const quotation = await Quotation.findOne({
      where: { quotation_number },
      include: [{ model: QuotationProduct, as: "quotation_products" }],
    });
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    // 3️⃣ Prepare revised product data (in memory)
    const revisedProducts = quotation.quotation_products.map((p) => {
      const updatedItem = changes.items.find((i) => i.id === p.id);
      if (updatedItem) {
        return {
          ...p.toJSON(),
          product_name: updatedItem.product_name,
          cas_no: updatedItem.cas_no,
          hsn_no: updatedItem.hsn_no,
          quantity: updatedItem.quantity,
          price: updatedItem.price,
          lead_time: updatedItem.lead_time,
          company_name: updatedItem.company_name,
        };
      }
      return p.toJSON();
    });

    // 4️⃣ Generate PDF using revised data
    const pdfDir = path.join(__dirname, "../uploads/quotations");
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    const pdfFileName = `${quotation_number}-Rev-${nextRevisionNumber}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);

    await generateQuotationPDF(
      quotation.toJSON(),
      revisedProducts, // ✅ pass the revised product data here
      quotation.inquiry,
      nextRevisionNumber
    );

    // 5️⃣ Save revision in main table
    const revision = await QuotationReviced.create({
      quotation_number,
      revision_number: nextRevisionNumber,
      product_id: product_id || null,
      changes,
      changed_by,
      pdf_path: `uploads/quotations/${pdfFileName}`,
    });

    // 6️⃣ Save field-level changes in QuotationRevision table
    const QuotationRevision = require("../models/QuotationRevision");
    for (const item of changes.items) {
      const prevItem = latestRevision
        ? latestRevision.changes.items.find((p) => p.id === item.id) || {}
        : quotation.quotation_products.find((p) => p.id === item.id);

      for (const key of Object.keys(item)) {
        if (key === "id") continue;
        const oldValue = prevItem ? prevItem[key] ?? null : null;
        const newValue = item[key] ?? null;

        if (oldValue != newValue) {
          await QuotationRevision.create({
            product_id: item.id,
            field_name: key,
            old_value: oldValue,
            new_value: newValue,
            changed_by,
          });
        }
      }
    }

    res.status(201).json({
      message: "Revision created successfully with updated PDF",
      data: revision,
    });
  } catch (error) {
    console.error("Error revising quotation:", error);
    res.status(500).json({ message: "Error revising quotation", error: error.message });
  }
};

exports.getRevisionHistory = async (req, res) => {
  try {
    const { quotation_number } = req.params;

    // Fetch all revisions ordered by revision_number
    const revisions = await QuotationReviced.findAll({
      where: { quotation_number },
      order: [["revision_number", "ASC"]],
      include: [{ model: QuotationProduct, attributes: ["id", "product_name"] }],
    });

    if (!revisions || revisions.length === 0) {
      return res.status(200).json({ revisions: [] });
    }

    const revisionHistory = [];

    for (let i = 0; i < revisions.length; i++) {
      const rev = revisions[i];

      // Previous values: first revision -> original products, else previous revision
      const prevChanges = i === 0
        ? await QuotationProduct.findAll({ where: { quotation_number } })
        : revisions[i - 1].changes.items;

      const changedItems = [];

      rev.changes.items.forEach((item) => {
        const prevItem = prevChanges.find((p) => p.id === item.id) || {};
        Object.keys(item).forEach((key) => {
          if (key === "id") return;

          const oldValue = prevItem[key] ?? null;
          const newValue = item[key] ?? null;

          if (oldValue != newValue) {
            changedItems.push({
              product_id: item.id,
              product_name: item.product_name || prevItem.product_name || "",
              field_name: key,
              old_value: oldValue,
              new_value: newValue,
            });
          }
        });
      });

      revisionHistory.push({
        revision_number: rev.revision_number,
        changed_items: changedItems, // detailed list of changes
        pdf_path: rev.pdf_path,
        changed_by: rev.changed_by,
        changed_at: rev.changed_at,
      });
    }

    res.status(200).json({ revisions: revisionHistory });
  } catch (error) {
    console.error("Error fetching revision history:", error);
    res.status(500).json({ message: "Error fetching revision history", error: error.message });
  }
};



  exports.setReminder = async (req, res) => {
  try {
    const { quotation_number } = req.params;
    const { reminder_days } = req.body;

    const quotation = await Quotation.findOne({ where: { quotation_number } });
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (quotation.quotation_status === "generate_po") {
      return res.status(400).json({ message: "Reminder cannot be set for generated PO" });
    }

    const nextReminder = reminder_days
      ? new Date(Date.now() + reminder_days * 24 * 60 * 60 * 1000) // add days
      : null;

    quotation.reminder_days = reminder_days;
    quotation.next_reminder_date = nextReminder;
    quotation.reminder_active = !!reminder_days;

    await quotation.save();

    res.status(200).json({
      message: "Reminder updated successfully",
      quotation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error setting reminder", error: error.message });
  }
};



exports.getReminders = async (req, res) => {
  try {
    const today = new Date();

    const reminders = await Quotation.findAll({
      where: {
        reminder_active: true,
        quotation_status: { [Op.ne]: "generate_po" },
        next_reminder_date: { [Op.gte]: today }, // due today or earlier
      },
      order: [["next_reminder_date", "ASC"]],
    });

    if (!reminders.length) {
      return res.status(200).json({
        message: "No active reminders due today",
        data: [],
      });
    }

    res.status(200).json({
      message: "Due reminders fetched successfully",
      data: reminders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching reminders",
      error: error.message,
    });
  }
};


exports.deactivateReminder = async (req, res) => {
  try {
    const { quotation_number } = req.params;

    const quotation = await Quotation.findOne({ where: { quotation_number } });
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    quotation.reminder_active = false;
    await quotation.save();

    res.status(200).json({
      message: "Reminder deactivated successfully",
      quotation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deactivating reminder",
      error: error.message,
    });
  }
};


