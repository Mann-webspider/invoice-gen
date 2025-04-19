CREATE TABLE `arn_details` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gst_circular` text NOT NULL,
	`application_ref_no` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `exporter_details` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_name` text NOT NULL,
	`address` text NOT NULL,
	`email` text NOT NULL,
	`tax_id` text NOT NULL,
	`ie_code` text NOT NULL,
	`pan_no` text NOT NULL,
	`gstin_no` text NOT NULL,
	`state_code` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `shipping_details` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`place_of_receipt` text NOT NULL,
	`port_of_loading` text NOT NULL,
	`port_of_discharge` text NOT NULL,
	`final_destination` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `supplier_details` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`gstin` text NOT NULL,
	`tax_invoice_no` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `dropdown_options` ADD `related_record_id` integer;--> statement-breakpoint
ALTER TABLE `dropdown_options` ADD `related_table` text;