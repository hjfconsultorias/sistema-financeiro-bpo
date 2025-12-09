CREATE TABLE `daily_revenues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`costCenterId` int NOT NULL,
	`revenueCategoryId` int NOT NULL,
	`cashAmount` int NOT NULL DEFAULT 0,
	`debitCardAmount` int NOT NULL DEFAULT 0,
	`creditCardAmount` int NOT NULL DEFAULT 0,
	`pixAmount` int NOT NULL DEFAULT 0,
	`totalAmount` int NOT NULL,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_revenues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `revenue_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `revenue_categories_id` PRIMARY KEY(`id`)
);
