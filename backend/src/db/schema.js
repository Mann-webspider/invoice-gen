import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";

// Base categories table
export const dropdownCategories = sqliteTable("dropdown_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// Supplier details table
export const supplierDetails = sqliteTable("supplier_details", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  gstin: text("gstin").notNull(),
  taxInvoiceNo: text("tax_invoice_no").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// Exporter details table
export const exporterDetails = sqliteTable("exporter_details", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyName: text("company_name").notNull(),
  address: text("address").notNull(),
  email: text("email").notNull(),
  taxId: text("tax_id").notNull(),
  ieCode: text("ie_code").notNull(),
  panNo: text("pan_no").notNull(),
  gstinNo: text("gstin_no").notNull(),
  stateCode: text("state_code").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// Shipping details table
export const shippingDetails = sqliteTable("shipping_details", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  placeOfReceipt: text("place_of_receipt").notNull(),
  portOfLoading: text("port_of_loading").notNull(),
  portOfDischarge: text("port_of_discharge").notNull(),
  finalDestination: text("final_destination").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ARN details table
export const arnDetails = sqliteTable("arn_details", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gstCircular: text("gst_circular").notNull(),
  applicationRefNo: text("application_ref_no").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// Dropdown options table for individual values
export const dropdownOptions = sqliteTable("dropdown_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull(),
  value: text("value").notNull(),
  label: text("label").notNull(),
  
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
}); 