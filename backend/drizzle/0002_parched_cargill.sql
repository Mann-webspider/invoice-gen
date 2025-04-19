PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_dropdown_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`value` text NOT NULL,
	`label` text NOT NULL,
	`related_record_id` integer,
	`related_table` text,
	`is_active` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO `__new_dropdown_options`("id", "category", "value", "label", "related_record_id", "related_table", "is_active", "sort_order", "created_at", "updated_at") SELECT "id", "category", "value", "label", "related_record_id", "related_table", "is_active", "sort_order", "created_at", "updated_at" FROM `dropdown_options`;--> statement-breakpoint
DROP TABLE `dropdown_options`;--> statement-breakpoint
ALTER TABLE `__new_dropdown_options` RENAME TO `dropdown_options`;--> statement-breakpoint
PRAGMA foreign_keys=ON;