CREATE TABLE `scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text NOT NULL,
	`nickname` text NOT NULL,
	`level_id` text NOT NULL,
	`level_name` text NOT NULL,
	`score` integer NOT NULL,
	`grade` text NOT NULL,
	`elapsed_ms` integer NOT NULL,
	`turns` integer NOT NULL,
	`loss_tenths` integer NOT NULL,
	`retreats` integer NOT NULL,
	`victory_type` text NOT NULL,
	`rule_version` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scores_player_level_unique` ON `scores` (`player_id`,`level_id`);