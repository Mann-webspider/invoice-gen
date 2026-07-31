CREATE TABLE `annexure` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_date` text DEFAULT '' NOT NULL,
	`invoice_number` text DEFAULT '' NOT NULL,
	`commissionerate` text DEFAULT '' NOT NULL,
	`division` text DEFAULT '' NOT NULL,
	`range` text DEFAULT '' NOT NULL,
	`containerized` text DEFAULT '' NOT NULL,
	`non_containerized` text DEFAULT '' NOT NULL,
	`exam_date` text DEFAULT '' NOT NULL,
	`gross_weight` text DEFAULT '' NOT NULL,
	`net_weight` text DEFAULT '' NOT NULL,
	`bin_no` text DEFAULT '' NOT NULL,
	`branch_no` text DEFAULT '' NOT NULL,
	`lut_date` text DEFAULT '' NOT NULL,
	`officer_designation1` text DEFAULT '' NOT NULL,
	`officer_designation2` text DEFAULT '' NOT NULL,
	`question9a` text DEFAULT '' NOT NULL,
	`question9b` text DEFAULT '' NOT NULL,
	`question9c` text DEFAULT '' NOT NULL,
	`total_packages` text DEFAULT '' NOT NULL,
	`location_code` text DEFAULT '' NOT NULL,
	`manufacturer_name` text DEFAULT '' NOT NULL,
	`manufacturer_address` text DEFAULT '' NOT NULL,
	`manufacturer_gstin_no` text DEFAULT '' NOT NULL,
	`manufacturer_permission` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `arn_master` (
	`id` text PRIMARY KEY NOT NULL,
	`arn` text NOT NULL,
	`gst_circular` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `buyer_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text DEFAULT '' NOT NULL,
	`order_date` text DEFAULT '' NOT NULL,
	`po_number` text DEFAULT '' NOT NULL,
	`consignee` text DEFAULT '' NOT NULL,
	`notify_party` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `container_line` (
	`id` text PRIMARY KEY NOT NULL,
	`container_number` text DEFAULT '' NOT NULL,
	`line_seal_number` text DEFAULT '' NOT NULL,
	`rfid_number` text DEFAULT '' NOT NULL,
	`design_no` text DEFAULT '' NOT NULL,
	`quantity_box` text DEFAULT '' NOT NULL,
	`net_weight` text DEFAULT '' NOT NULL,
	`gross_weight` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `country_option` (
	`id` text PRIMARY KEY NOT NULL,
	`final_destination` text NOT NULL,
	`port_of_discharge` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `draft` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_number` text DEFAULT '' NOT NULL,
	`data` text NOT NULL,
	`last_page` text DEFAULT '' NOT NULL,
	`is_submitted` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_draft_updated` ON `draft` (`updated_at`);--> statement-breakpoint
CREATE TABLE `dropdown_option` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`value` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_dropdown_option_category` ON `dropdown_option` (`category`);--> statement-breakpoint
CREATE TABLE `exporter_master` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`company_address` text NOT NULL,
	`contact_number` text NOT NULL,
	`email` text NOT NULL,
	`tax_id` text NOT NULL,
	`ie_code` text NOT NULL,
	`pan_number` text NOT NULL,
	`gstin_number` text NOT NULL,
	`state_code` text NOT NULL,
	`authorized_name` text NOT NULL,
	`authorized_designation` text NOT NULL,
	`company_prefix` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exporter_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`company_name` text DEFAULT '' NOT NULL,
	`company_address` text DEFAULT '' NOT NULL,
	`contact_number` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`tax_id` text DEFAULT '' NOT NULL,
	`ie_code` text DEFAULT '' NOT NULL,
	`pan_number` text DEFAULT '' NOT NULL,
	`gstin_number` text DEFAULT '' NOT NULL,
	`state_code` text DEFAULT '' NOT NULL,
	`authorized_name` text DEFAULT '' NOT NULL,
	`authorized_designation` text DEFAULT '' NOT NULL,
	`master_id` text,
	FOREIGN KEY (`master_id`) REFERENCES `exporter_master`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `invoice` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_number` text NOT NULL,
	`invoice_date` text DEFAULT '' NOT NULL,
	`integrated_tax` text DEFAULT '' NOT NULL,
	`payment_term` text DEFAULT '' NOT NULL,
	`product_type` text DEFAULT '' NOT NULL,
	`currency_type` text DEFAULT '' NOT NULL,
	`currency_rate` text DEFAULT '' NOT NULL,
	`marks` text DEFAULT '' NOT NULL,
	`nos` text DEFAULT '' NOT NULL,
	`freight` text DEFAULT '' NOT NULL,
	`insurance` text DEFAULT '' NOT NULL,
	`total_price` text DEFAULT '' NOT NULL,
	`total_pallet_count` text DEFAULT '' NOT NULL,
	`exporter_id` text NOT NULL,
	`buyer_id` text NOT NULL,
	`shipping_id` text NOT NULL,
	`package_id` text NOT NULL,
	`annexure_id` text NOT NULL,
	`vgm_id` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`exporter_id`) REFERENCES `exporter_snapshot`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`buyer_id`) REFERENCES `buyer_snapshot`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shipping_id`) REFERENCES `shipping_snapshot`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`package_id`) REFERENCES `package_snapshot`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`annexure_id`) REFERENCES `annexure`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vgm_id`) REFERENCES `vgm`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_invoice_number_unique` ON `invoice` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `idx_invoice_created` ON `invoice` (`created_at`);--> statement-breakpoint
CREATE TABLE `invoice_container` (
	`invoice_id` text NOT NULL,
	`container_line_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`invoice_id`, `container_line_id`),
	FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`container_line_id`) REFERENCES `container_line`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoice_product` (
	`invoice_id` text NOT NULL,
	`product_line_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`invoice_id`, `product_line_id`),
	FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_line_id`) REFERENCES `product_line`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoice_sequence` (
	`exporter_id` text NOT NULL,
	`fiscal_year` text NOT NULL,
	`last` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`exporter_id`, `fiscal_year`),
	FOREIGN KEY (`exporter_id`) REFERENCES `exporter_master`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_invoice_sequence` ON `invoice_sequence` (`exporter_id`,`fiscal_year`);--> statement-breakpoint
CREATE TABLE `invoice_supplier` (
	`invoice_id` text NOT NULL,
	`supplier_snapshot_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`invoice_id`, `supplier_snapshot_id`),
	FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`supplier_snapshot_id`) REFERENCES `supplier_snapshot`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `package_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`number_of_package` text DEFAULT '' NOT NULL,
	`total_gross_weight` text DEFAULT '' NOT NULL,
	`total_net_weight` text DEFAULT '' NOT NULL,
	`gst_circular` text DEFAULT '' NOT NULL,
	`app_ref_number` text DEFAULT '' NOT NULL,
	`lut_date` text DEFAULT '' NOT NULL,
	`total_amount` text DEFAULT '' NOT NULL,
	`total_sqm` text DEFAULT '' NOT NULL,
	`taxable_value` text DEFAULT '' NOT NULL,
	`gst_amount` text DEFAULT '' NOT NULL,
	`amount_in_words` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_category` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text NOT NULL,
	`hsn_code` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_line` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text,
	`product_name` text DEFAULT '' NOT NULL,
	`size` text DEFAULT '' NOT NULL,
	`unit` text DEFAULT '' NOT NULL,
	`quantity` text DEFAULT '' NOT NULL,
	`sqm` text DEFAULT '' NOT NULL,
	`total_sqm` text DEFAULT '' NOT NULL,
	`price` text DEFAULT '' NOT NULL,
	`total_price` text DEFAULT '' NOT NULL,
	`net_weight` text DEFAULT '' NOT NULL,
	`gross_weight` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `product_category`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_product_line_category` ON `product_line` (`category_id`);--> statement-breakpoint
CREATE TABLE `product_size` (
	`id` text PRIMARY KEY NOT NULL,
	`size` text NOT NULL,
	`sqm` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shipping_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`pre_carriage` text DEFAULT '' NOT NULL,
	`place_of_receipt` text DEFAULT '' NOT NULL,
	`shipping_number` text DEFAULT '' NOT NULL,
	`port_of_loading` text DEFAULT '' NOT NULL,
	`port_of_discharge` text DEFAULT '' NOT NULL,
	`final_destination` text DEFAULT '' NOT NULL,
	`country_of_origin` text DEFAULT '' NOT NULL,
	`origin_details` text DEFAULT '' NOT NULL,
	`country_of_final_destination` text DEFAULT '' NOT NULL,
	`terms_of_delivery` text DEFAULT '' NOT NULL,
	`payment` text DEFAULT '' NOT NULL,
	`vessel_flight_no` text DEFAULT '' NOT NULL,
	`shipping_method` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `supplier_master` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`permission` text NOT NULL,
	`gstin_number` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `supplier_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`supplier_name` text DEFAULT '' NOT NULL,
	`supplier_address` text DEFAULT '' NOT NULL,
	`gstin_number` text DEFAULT '' NOT NULL,
	`tax_invoice_no` text DEFAULT '' NOT NULL,
	`date` text DEFAULT '' NOT NULL,
	`master_id` text,
	FOREIGN KEY (`master_id`) REFERENCES `supplier_master`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `vgm` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_number` text DEFAULT '' NOT NULL,
	`shipper_name` text DEFAULT '' NOT NULL,
	`ie_code` text DEFAULT '' NOT NULL,
	`authorized_name` text DEFAULT '' NOT NULL,
	`authorized_contact` text DEFAULT '' NOT NULL,
	`container_number` text DEFAULT '' NOT NULL,
	`container_size` text DEFAULT '' NOT NULL,
	`permissible_weight` text DEFAULT '' NOT NULL,
	`weighbridge_registration` text DEFAULT '' NOT NULL,
	`verified_gross_mass` text DEFAULT '' NOT NULL,
	`unit_of_measurement` text DEFAULT '' NOT NULL,
	`dt_weighing` text DEFAULT '' NOT NULL,
	`weighing_slip_no` text DEFAULT '' NOT NULL,
	`type` text DEFAULT '' NOT NULL,
	`imdg_class` text DEFAULT '' NOT NULL,
	`forwarder_email` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vgm_container` (
	`id` text PRIMARY KEY NOT NULL,
	`vgm_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`booking_no` text DEFAULT '' NOT NULL,
	`container_no` text DEFAULT '' NOT NULL,
	`tare_weight` text DEFAULT '' NOT NULL,
	`gross_weight` text DEFAULT '' NOT NULL,
	`total_vgm` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`vgm_id`) REFERENCES `vgm`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_vgm_container_vgm` ON `vgm_container` (`vgm_id`);