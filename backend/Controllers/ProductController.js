
const Product = require("../models/Product");


exports.createProduct = async (req, res) => {
  try {
    const { product_name, cas_number, hsn_code, status } = req.body;
  
    if (! product_name) {
      return res.status(400).json({ message: "Product name is required" });
    }


    const existingProduct = await Product.findOne({ where: {  product_name} });
    if (existingProduct) {
      return res.status(400).json({ message: "Product already exists" });
    }
    const product = await Product.create({
       product_name,
      cas_number: cas_number || "N/A",
      product_code: hsn_code || "N/A",
      status: status || "active",
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cas_number, product_code, status } = req.body;

    
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

   
    product.name = name || product.name;
    product.cas_number = cas_number || product.cas_number;
    product.product_code = product_code || product.product_code;
    product.status = status || product.status;

    await product.save();

    res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    await product.destroy();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [["createdAt", "DESC"]], 
    });

    res.status(200).json({
      message: "Products fetched successfully",
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getProductsByName = async (req, res) => {
  try {
    const { name } = req.params;

    // Find product(s) matching the name (case-insensitive)
    const product = await Product.findOne({
      where: { name },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

