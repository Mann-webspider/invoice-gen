CREATE TABLE `dropdown_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dropdown_categories_name_unique` ON `dropdown_categories` (`name`);--> statement-breakpoint
CREATE TABLE `dropdown_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`value` text NOT NULL,
	`label` text NOT NULL,
	`is_active` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`category`) REFERENCES `dropdown_categories`(`name`) ON UPDATE no action ON DELETE no action
);
