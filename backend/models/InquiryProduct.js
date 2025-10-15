const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const Inquiry = require("./Inquiry.js");

const InquiryProduct = sequelize.define(
  "InquiryProduct",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    inquiry_number: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "inquiries",
        key: "inquiry_number",
      },
      onDelete: "CASCADE",
    },

    product_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Unknown",
    },

    cas_number: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "N/A",
    },

    product_code: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "N/A",
    },

    quantity_required: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },

    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "inquiry_products",
    timestamps: true,
  }
);

Inquiry.hasMany(InquiryProduct, {
  foreignKey: "inquiry_number",
  as: "products",
  onDelete: "CASCADE",
});

InquiryProduct.belongsTo(Inquiry, {
  foreignKey: "inquiry_number",
  as: "inquiry",
});

module.exports = InquiryProduct;
