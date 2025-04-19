import express from "express";
import {
  getAllDropdowns,
  getDropdownOptions,
  getDropdownCategories,
  getOptionsByCategory,
  createDropdownOption,
  updateDropdownOption,
  deleteDropdownOption,
  toggleOptionStatus,
  reorderOptions,
  getRelatedDetails,
  createSupplierDetails,
  createExporterDetails
} from "../controllers/dropdownController.js";

const router = express.Router();

// Dropdown Management Routes
router.get("/all-dropdowns", getAllDropdowns);
router.get("/dropdown-options", getDropdownOptions);
router.get("/dropdown-categories", getDropdownCategories);
router.get("/dropdown-options/:category", getOptionsByCategory);
router.post("/dropdown-options", createDropdownOption);
router.put("/dropdown-options/:id", updateDropdownOption);
router.delete("/dropdown-options/:id", deleteDropdownOption);
router.put("/dropdown-options/:id/toggle", toggleOptionStatus);
router.put("/dropdown-options/:category/reorder", reorderOptions);

// New routes for related details
router.get("/related-details/:category/:value", getRelatedDetails);
router.post("/supplier-details", createSupplierDetails);
router.post("/exporter-details", createExporterDetails);

export const dropdownRoutes = router; 