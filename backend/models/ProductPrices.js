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
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 999
      }
    },
    unit: {
      type: DataTypes.ENUM('mg', 'gm', 'ml', 'kg', 'ltr'),
      allowNull: false,
      defaultValue: 'mg'
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
