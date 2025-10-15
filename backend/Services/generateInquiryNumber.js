const Inquiry = require("../models/Inquiry");

const generateInquiryNumber = async () => {
  // Use a transaction for safety
  const t = await Inquiry.sequelize.transaction();
  try {
    const lastInquiry = await Inquiry.findOne({
      order: [["createdAt", "DESC"]],
      attributes: ["inquiry_number"],
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    const lastNum = lastInquiry
      ? parseInt(lastInquiry.inquiry_number.replace(/^INQ/i, "")) || 0
      : 0;

    const newNumber = `INQ${lastNum + 1}`;
    await t.commit();
    return newNumber;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

module.exports = generateInquiryNumber;
