const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");

const Inquiry = sequelize.define(
  "Inquiry",
  {
    inquiry_number: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },

    customer_name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Unknown",
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Track the current stage of inquiry processing
    current_stage: {
      type: DataTypes.ENUM(
        "inquiry_received",
        "technical_review",
        "management_review",
        "purchase_order"
      ),
      defaultValue: "inquiry_received",
      comment: "Indicates the current level/stage of inquiry processing",
    },

    // Status fields for each stage
    inquiry_status: {
      type: DataTypes.ENUM("pending", "forwarded"),
      defaultValue: "pending",
    },
    technical_status: {
      type: DataTypes.ENUM("pending", "forwarded"),
      defaultValue: "pending",
    },
    management_status: {
      type: DataTypes.ENUM("pending", "forwarded"),
      defaultValue: "pending",
    },
    purchase_order_status: {
      type: DataTypes.ENUM("pending", "forwarded"),
      defaultValue: "pending",
    },

    // Track the last update date for each stage
    inquiry_update_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    technical_update_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    management_update_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    po_update_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Track which user handled each stage by name
    inquiry_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    technical_quotation_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    marketing_quotation_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    po_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "inquiries",
    timestamps: true,
  }
);

module.exports = Inquiry;
