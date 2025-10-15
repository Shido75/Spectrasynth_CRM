const express = require("express");
const router = express.Router();
const ProductController = require("../Controllers/ProductController");
const auth = require("../middlewares/auth");
const checkPermission = require("../middlewares/checkPermission");

router.post("/",auth, ProductController.createProduct);
router.put("/:id",auth, ProductController.updateProduct);
router.delete("/:id",auth, ProductController.deleteProduct);
router.get("/",auth, ProductController.getAllProducts);
router.get("/:name",auth, ProductController.getProductsByName);
module.exports = router;