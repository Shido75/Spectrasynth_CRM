const express = require("express");
const router = express.Router();
const  inquiryController= require("../Controllers/inquiryController");
const checkPermission = require("../middlewares/checkPermission");
const auth = require("../middlewares/auth");


router.get("/Allinquiries",auth, inquiryController.getAllInquiries);
router.get("/fetchInquiries",auth,inquiryController.getGroupedInquiries);
router.get("/:inquiry_number",auth, inquiryController.getInquiriesByEmailId);
router.post("/add",auth, inquiryController.addInquiry);
router.patch("/:id/status",auth,inquiryController.updateInquiryStatus);
router.put("/updateAll/:inquiry_number",auth, inquiryController.updateInquiry);
router.get("/fetchInquiries/:id",auth, inquiryController.getInquiriesByEmailId);

router.delete("/:inquiry_number",auth, inquiryController.deleteInquiry);
router.get("/fetch/permissions",auth, inquiryController.getInquiryPermissions);



module.exports = router;