import { db } from "../db/index.js";
import { 
  dropdownCategories, 
  dropdownOptions, 
  supplierDetails,
  exporterDetails,
  shippingDetails,
  arnDetails 
} from "../db/schema.js";
import { eq, and } from "drizzle-orm";

// Get all dropdowns with their options
export const getAllDropdowns = async (req, res) => {
  try {
    const categories = await db.select().from(dropdownCategories);
    const options = await db.select().from(dropdownOptions);
    
    const result = categories.map(category => ({
      ...category,
      options: options.filter(option => option.category === category.name)
    }));

    res.json({
      status: "success",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch dropdowns",
      errors: [error.message]
    });
  }
};

// Get all dropdown options
export const getDropdownOptions = async (req, res) => {
  try {
    const options = await db.select().from(dropdownOptions);
    res.json({
      status: "success",
      data: options
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch dropdown options",
      errors: [error.message]
    });
  }
};

// Get all dropdown categories
export const getDropdownCategories = async (req, res) => {
  try {
    const categories = await db.select().from(dropdownCategories);
    res.json({
      status: "success",
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch categories",
      errors: [error.message]
    });
  }
};

// Get options for specific category
export const getOptionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const options = await db
      .select()
      .from(dropdownOptions)
      .where(eq(dropdownOptions.category, category))
      .orderBy(dropdownOptions.sortOrder);

    res.json({
      status: "success",
      data: options
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch options",
      errors: [error.message]
    });
  }
};

// Create new dropdown option
export const createDropdownOption = async (req, res) => {
  try {
    const { category, value, label, sortOrder } = req.body;
    
    const [newOption] = await db
      .insert(dropdownOptions)
      .values({
        category,
        value,
        label,
        sortOrder: sortOrder || 0,
        isActive: true
      })
      .returning();

    res.status(201).json({
      status: "success",
      data: newOption
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create option",
      errors: [error.message]
    });
  }
};

// Update dropdown option
export const updateDropdownOption = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const [updatedOption] = await db
      .update(dropdownOptions)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(dropdownOptions.id, parseInt(id)))
      .returning();

    if (!updatedOption) {
      return res.status(404).json({
        status: "error",
        message: "Option not found"
      });
    }

    res.json({
      status: "success",
      data: updatedOption
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to update option",
      errors: [error.message]
    });
  }
};

// Delete dropdown option
export const deleteDropdownOption = async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedOption] = await db
      .delete(dropdownOptions)
      .where(eq(dropdownOptions.id, parseInt(id)))
      .returning();

    if (!deletedOption) {
      return res.status(404).json({
        status: "error",
        message: "Option not found"
      });
    }

    res.json({
      status: "success",
      data: deletedOption
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete option",
      errors: [error.message]
    });
  }
};

// Toggle option active status
export const toggleOptionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const [option] = await db
      .select()
      .from(dropdownOptions)
      .where(eq(dropdownOptions.id, parseInt(id)));

    if (!option) {
      return res.status(404).json({
        status: "error",
        message: "Option not found"
      });
    }

    const [updatedOption] = await db
      .update(dropdownOptions)
      .set({
        isActive: !option.isActive,
        updatedAt: new Date()
      })
      .where(eq(dropdownOptions.id, parseInt(id)))
      .returning();

    res.json({
      status: "success",
      data: updatedOption
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to toggle option status",
      errors: [error.message]
    });
  }
};

// Reorder options in category
export const reorderOptions = async (req, res) => {
  try {
    const { category } = req.params;
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({
        status: "error",
        message: "Order must be an array of option IDs"
      });
    }

    const updates = order.map((optionId, index) => 
      db
        .update(dropdownOptions)
        .set({
          sortOrder: index,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(dropdownOptions.id, parseInt(optionId)),
            eq(dropdownOptions.category, category)
          )
        )
    );

    await Promise.all(updates);

    const updatedOptions = await db
      .select()
      .from(dropdownOptions)
      .where(eq(dropdownOptions.category, category))
      .orderBy(dropdownOptions.sortOrder);

    res.json({
      status: "success",
      data: updatedOptions
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to reorder options",
      errors: [error.message]
    });
  }
};

// Get related details for a dropdown option
export const getRelatedDetails = async (req, res) => {
  try {
    const { category, value } = req.params;

    // First find the dropdown option
    const [option] = await db
      .select()
      .from(dropdownOptions)
      .where(
        and(
          eq(dropdownOptions.category, category),
          eq(dropdownOptions.value, value)
        )
      );

    if (!option) {
      return res.status(404).json({
        status: "error",
        message: "Option not found"
      });
    }

    // Get the related record based on the table name
    let relatedDetails;
    switch (option.relatedTable) {
      case "supplier_details":
        [relatedDetails] = await db
          .select()
          .from(supplierDetails)
          .where(eq(supplierDetails.id, option.relatedRecordId));
        break;
      case "exporter_details":
        [relatedDetails] = await db
          .select()
          .from(exporterDetails)
          .where(eq(exporterDetails.id, option.relatedRecordId));
        break;
      case "shipping_details":
        [relatedDetails] = await db
          .select()
          .from(shippingDetails)
          .where(eq(shippingDetails.id, option.relatedRecordId));
        break;
      case "arn_details":
        [relatedDetails] = await db
          .select()
          .from(arnDetails)
          .where(eq(arnDetails.id, option.relatedRecordId));
        break;
      default:
        return res.status(400).json({
          status: "error",
          message: "Invalid related table"
        });
    }

    if (!relatedDetails) {
      return res.status(404).json({
        status: "error",
        message: "Related details not found"
      });
    }

    res.json({
      status: "success",
      data: relatedDetails
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch related details",
      errors: [error.message]
    });
  }
};

// Create supplier details with dropdown option
export const createSupplierDetails = async (req, res) => {
  try {
    const { name, gstin, taxInvoiceNo } = req.body;
    
    // Create supplier details
    const [supplier] = await db
    .insert(supplierDetails)
    .values({
        name,
        gstin,
        taxInvoiceNo
      })
      .returning();
      
      console.log("heelo");
    // Create dropdown option for the supplier
    const [option] = await db
      .insert(dropdownOptions)
      .values({
        category: "supplier",
        value: name,
        label: name,
        relatedRecordId: supplier.id,
        relatedTable: "supplier_details",
        isActive: true
      })
      .returning();

    res.status(201).json({
      status: "success",
      data: {
        supplier,
        option
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create supplier details",
      errors: [error.message]
    });
  }
};

// Similar methods for other categories (exporter, shipping, ARN)
export const createExporterDetails = async (req, res) => {
  try {
    const { 
      companyName, 
      address, 
      email, 
      taxId, 
      ieCode, 
      panNo, 
      gstinNo, 
      stateCode 
    } = req.body;

    // Create exporter details
    const [exporter] = await db
      .insert(exporterDetails)
      .values({
        companyName,
        address,
        email,
        taxId,
        ieCode,
        panNo,
        gstinNo,
        stateCode
      })
      .returning();

    // Create dropdown option for the exporter
    const [option] = await db
      .insert(dropdownOptions)
      .values({
        category: "exporter",
        value: companyName,
        label: companyName,
        relatedRecordId: exporter.id,
        relatedTable: "exporter_details",
        isActive: true
      })
      .returning();

    res.status(201).json({
      status: "success",
      data: {
        exporter,
        option
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create exporter details",
      errors: [error.message]
    });
  }
}; 