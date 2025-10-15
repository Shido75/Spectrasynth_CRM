const express = require("express");
const Product = require("../models/Product");
const ProductPrice = require("../models/ProductPrices");

exports.addProductPrices = async (req, res) => {
  try {
    const { productName, prices } = req.body;

    const product = await Product.findOne({ where: { product_name: productName } });
    if (!product) {
      return res.status(404).json({
        message: `Product '${productName}' does not exist.`,
      });
    }

    const results = [];

 
    for (const entry of prices) {
      const { company, price, quantity } = entry;

   
      let productPrice = await ProductPrice.findOne({
        where: { productId: product.id, company },
      });

      if (productPrice) {
       
        productPrice.price = price;
        productPrice.quantity = quantity || 0;
        await productPrice.save();
        results.push({ company, price, quantity: productPrice.quantity, status: "updated" });
      } else {
        
        const newProductPrice = await ProductPrice.create({
          productId: product.id,
          company,
          price,
          quantity: quantity || 0,
        });
        results.push({ company, price, quantity: newProductPrice.quantity, status: "created" });
      }
    }

    res.status(201).json({
      message: "Product prices processed successfully",
      product: productName,
      results,
    });
  } catch (error) {
    console.error("Error adding product prices:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllProductsWithPrices = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: ProductPrice,
          attributes: ["id", "company", "price", "quantity", "createdAt", "updatedAt"],
        },
      ],
      attributes: ["id", "product_name", "cas_number", "product_code", "status"],
    });

    res.json({
      message: "Products with prices fetched successfully",
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products with prices:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllProductPrices = async (req, res) => {
  try {
    const productPrices = await ProductPrice.findAll({
      include: [
        {
          model: Product,
          attributes: ["name", "cas_number", "product_code"],
        },
      ],
      attributes: ["id", "company", "price", "createdAt", "updatedAt"],
    });

    // Flatten the structure
    const result = productPrices.map((pp) => ({
      productName: pp.Product.name,
      cas_number: pp.Product.cas_number,
      product_code: pp.Product.product_code,
      company: pp.company,
      price: pp.price,
    }));

    res.json({
      message: "All product prices fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching product prices:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.updateProductPrice = async (req, res) => {
  try {
    const { id } = req.params; 
    const { productName, company, price } = req.body;
     
    
    const productPrice = await ProductPrice.findByPk(id);
    if (!productPrice) {
      return res.status(404).json({ message: "Product price not found" });
    }
    if (productName) {
      const product = await Product.findOne({ where: { name: productName } });
      if (!product) {
        return res.status(404).json({
          message: `Product '${productName}' does not exist.`,
        });
      }
      productPrice.productId = product.id;
    }

    if (company) productPrice.company = company;
    if (price !== undefined) productPrice.price = price;

    await productPrice.save();

    res.json({
      message: "Product price updated successfully",
      data: productPrice,
    });
  } catch (error) {
    console.error("Error updating product price:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// controllers/ProductController.js
// controllers/ProductController.js
exports.getProductByPriceId = async (req, res) => {
  try {
    const { id: priceId } = req.params; // ProductPrice ID
    
    const productPrice = await ProductPrice.findByPk(priceId, {
      include: [
        {
          model: Product,
          attributes: ["id", "product_name"], // Only the product name
        },
      ],
      attributes: ["id", "company", "price"], // Only this price info
    });

    if (!productPrice) {
      return res.status(404).json({ message: "ProductPrice not found" });
    }

    // Prepare response with product + this price info
    const response = {
      id: productPrice.id,
      company: productPrice.company,
      price: productPrice.price,
      product: {
        id: productPrice.Product.id,
        product_name: productPrice.Product.product_name,
      },
    };

    res.json({
      message: "ProductPrice fetched successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error fetching product by price ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



exports.deleteProductPrice = async (req, res) => {
  try {
    const { id } = req.params;

    const productPrice = await ProductPrice.findByPk(id);

    if (!productPrice) {
      return res.status(404).json({ message: "Product price not found" });
    }

    await productPrice.destroy();

    res.json({ message: "Product price deleted successfully" });
  } catch (error) {
    console.error("Error deleting product price:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getProductPriceByname = async (req, res) => {
  const name = req.params.name;

  try {
    // Fetch product with all its prices
    const productWithPrices = await Product.findOne({
      where: { product_name: name },
      attributes: ["id", "product_name"], // corrected column
      include: [
        {
          model: ProductPrice,
          attributes: ["id", "company", "price"],
        },
      ],
    });

    if (!productWithPrices) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      product: {
        id: productWithPrices.id,
        name: productWithPrices.product_name, // corrected here
        prices: productWithPrices.ProductPrices, // array of company + price
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.searchProduct = async (req, res) => {
  try {
    const { query } = req.query; // can be product name or company name

    if (!query || query.trim() === "") {
      return res.status(400).json({
        message: "Please provide a search term (product name or company name).",
      });
    }

    // Search by product name or by company name
    const products = await Product.findAll({
      where: {
        product_name: {
          [Op.like]: `%${query}%`,
        },
      },
      include: [
        {
          model: ProductPrice,
          where: {
            [Op.or]: [
              { company: { [Op.like]: `%${query}%` } }, // match company
            ],
          },
          required: false, // still return products even if price not found
          attributes: ["company", "price"],
        },
      ],
      order: [["product_name", "ASC"]],
    });

    if (!products || products.length === 0) {
      return res.status(404).json({
        message: "No matching products or companies found.",
      });
    }

    res.status(200).json({
      message: "Products fetched successfully.",
      data: products,
    });
  } catch (error) {
    console.error("Error searching product:", error);
    res.status(500).json({
      message: "Error searching product.",
      error: error.message,
    });
  }
};

