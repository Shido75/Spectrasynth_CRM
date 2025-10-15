const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const Product = require("./Product.js");

const ProductPrice = sequelize.define(
  "ProductPrice",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      references: {
        model: Product,
        key: "id",
      },
      allowNull: false,
    },
    company: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    tableName: "product_prices",
    timestamps: true,
  }
);

// Relations
Product.hasMany(ProductPrice, { foreignKey: "productId" });
ProductPrice.belongsTo(Product, { foreignKey: "productId" });

module.exports = ProductPrice;
