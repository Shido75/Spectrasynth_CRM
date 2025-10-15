const express = require("express");
const router = express.Router();
const ProductController = require("../Controllers/ProductPricingController");
const auth = require("../middlewares/auth");
const checkPermission = require("../middlewares/checkPermission");


router.post("/",auth, ProductController.addProductPrices);
router.get("/",auth, ProductController.getAllProductsWithPrices);
// router.get("/:id/prices", ProductController.getProductPriceById);
router.get("/get/:id", ProductController.getProductByPriceId);
router.get("/:name", ProductController.getProductPriceByname);
router.get("/getProductPrices",auth, ProductController.getAllProductPrices);
router.put("/:id",auth, ProductController.updateProductPrice);
router.get("/search", ProductController.searchProduct);
router.delete("/:id",auth, ProductController.deleteProductPrice);


module.exports = router;