const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: false,
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
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
  },
  {
    tableName: "products",
    timestamps: true, // adds createdAt & updatedAt
  }
);

module.exports = Product;
