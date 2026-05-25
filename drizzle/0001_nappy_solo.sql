CREATE TABLE `api_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`method` enum('GET','POST','PUT','DELETE','PATCH','HEAD','OPTIONS') NOT NULL,
	`url` varchar(1024) NOT NULL,
	`headers` json,
	`body` longtext,
	`body_type` enum('json','form','xml','text') DEFAULT 'json',
	`query_params` json,
	`path_params` json,
	`authentication` json,
	`timeout` int DEFAULT 30000,
	`retries` int DEFAULT 0,
	`tags` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `api_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`api_config_id` int NOT NULL,
	`status` enum('success','failed','timeout') NOT NULL,
	`status_code` int,
	`response_time` int,
	`request_body` longtext,
	`response_body` longtext,
	`response_headers` json,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bug_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`error_log` longtext NOT NULL,
	`root_cause` text,
	`affected_components` json,
	`severity` enum('low','medium','high','critical') DEFAULT 'medium',
	`reproduction_steps` json,
	`suggested_fix` text,
	`test_cases` json,
	`status` enum('open','assigned','fixed','closed') DEFAULT 'open',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bug_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`performance_test_id` int NOT NULL,
	`total_requests` int NOT NULL,
	`successful_requests` int NOT NULL,
	`failed_requests` int NOT NULL,
	`avg_response_time` decimal(10,2),
	`min_response_time` decimal(10,2),
	`max_response_time` decimal(10,2),
	`p95_response_time` decimal(10,2),
	`p99_response_time` decimal(10,2),
	`throughput` decimal(10,2),
	`error_rate` decimal(5,2),
	`data_points` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`api_config_id` int NOT NULL,
	`concurrent_users` int NOT NULL,
	`ramp_up_time` int NOT NULL,
	`hold_time` int NOT NULL,
	`cool_down_time` int NOT NULL,
	`status` enum('draft','running','completed','failed') DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performance_tests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('active','archived') DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `script_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`api_config_id` int NOT NULL,
	`script_type` enum('postman','jmeter','python') NOT NULL,
	`script_content` longtext NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_size` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `script_exports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sql_generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` varchar(64) NOT NULL,
	`requirement` text NOT NULL,
	`generated_sql` longtext NOT NULL,
	`sql_type` enum('select','insert','update','delete','join','aggregate') NOT NULL,
	`explanation` text,
	`optimization_suggestions` json,
	`execution_plan` json,
	`status` enum('draft','validated','executed') DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sql_generations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `test_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`precondition` text,
	`steps` json NOT NULL,
	`expected_result` text,
	`category` enum('positive','negative','boundary','edge') NOT NULL,
	`priority` enum('low','medium','high','critical') DEFAULT 'medium',
	`tags` json,
	`status` enum('draft','active','archived') DEFAULT 'draft',
	`source_document` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `test_cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `test_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`total_test_cases` int NOT NULL,
	`passed_test_cases` int NOT NULL,
	`failed_test_cases` int NOT NULL,
	`skipped_test_cases` int NOT NULL,
	`pass_rate` decimal(5,2),
	`total_bugs` int NOT NULL,
	`critical_bugs` int NOT NULL,
	`high_bugs` int NOT NULL,
	`medium_bugs` int NOT NULL,
	`low_bugs` int NOT NULL,
	`execution_time` int,
	`coverage` decimal(5,2),
	`environment` varchar(64),
	`test_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `test_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_api_user_id` ON `api_configs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_api_project_id` ON `api_configs` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_exec_user_id` ON `api_executions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_api_config_id` ON `api_executions` (`api_config_id`);--> statement-breakpoint
CREATE INDEX `idx_bug_user_id` ON `bug_analysis` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_bug_project_id` ON `bug_analysis` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_perf_test_id` ON `performance_results` (`performance_test_id`);--> statement-breakpoint
CREATE INDEX `idx_perf_user_id` ON `performance_tests` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_perf_project_id` ON `performance_tests` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_project_user_id` ON `projects` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_script_user_id` ON `script_exports` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_script_api_id` ON `script_exports` (`api_config_id`);--> statement-breakpoint
CREATE INDEX `idx_sql_user_id` ON `sql_generations` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sql_project_id` ON `sql_generations` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_user_id` ON `test_cases` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_project_id` ON `test_cases` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_report_user_id` ON `test_reports` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_report_project_id` ON `test_reports` (`project_id`);