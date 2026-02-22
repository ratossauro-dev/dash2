CREATE TABLE `bot_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`botId` int NOT NULL,
	`level` enum('info','warn','error','debug') NOT NULL DEFAULT 'info',
	`message` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bot_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bot_prompts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`botName` varchar(128) NOT NULL,
	`botType` varchar(64) NOT NULL,
	`description` text NOT NULL,
	`promptText` text NOT NULL,
	`dependencies` text,
	`envVars` text,
	`hosting` enum('discloud','vps','local') NOT NULL DEFAULT 'vps',
	`version` varchar(16) NOT NULL DEFAULT '1.0.0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bot_prompts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('payment','media_capture','distributor','cloner','account_creator','social_poster','monitor','vip_filler') NOT NULL,
	`status` enum('online','offline','error','idle') NOT NULL DEFAULT 'offline',
	`description` text,
	`config` text,
	`lastHeartbeat` timestamp,
	`lastActivity` text,
	`errorCount` int NOT NULL DEFAULT 0,
	`totalOperations` bigint NOT NULL DEFAULT 0,
	`hosting` enum('discloud','vps','local') NOT NULL DEFAULT 'vps',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceUrl` text NOT NULL,
	`thumbnailUrl` text,
	`mediaType` enum('video','image','gif') NOT NULL DEFAULT 'video',
	`category` varchar(64),
	`source` enum('erome','telegram_clone','manual') NOT NULL DEFAULT 'erome',
	`sourceBotId` int,
	`status` enum('pending','posted','failed','skipped') NOT NULL DEFAULT 'pending',
	`targetChannel` varchar(128),
	`postedAt` timestamp,
	`retryCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('bot_down','payment_received','error_critical','new_subscriber','media_posted','account_created') NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriberId` int,
	`telegramId` varchar(64),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'BRL',
	`status` enum('pending','paid','expired','refunded') NOT NULL DEFAULT 'pending',
	`gateway` varchar(64) NOT NULL DEFAULT 'syncpay',
	`txId` varchar(256),
	`qrCode` text,
	`qrCodeBase64` text,
	`pixKey` text,
	`plan` enum('basic','premium','vip') NOT NULL DEFAULT 'basic',
	`expiresAt` timestamp,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('twitter','instagram') NOT NULL,
	`username` varchar(128) NOT NULL,
	`email` varchar(320),
	`passwordEnc` text,
	`phone` varchar(32),
	`proxyUsed` varchar(128),
	`status` enum('active','banned','suspended','unverified','error') NOT NULL DEFAULT 'unverified',
	`followersCount` int NOT NULL DEFAULT 0,
	`postsCount` int NOT NULL DEFAULT 0,
	`lastPostAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`telegramId` varchar(64) NOT NULL,
	`telegramUsername` varchar(128),
	`name` varchar(256),
	`plan` enum('basic','premium','vip') NOT NULL DEFAULT 'basic',
	`status` enum('active','expired','banned','pending') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscribers_telegramId_unique` UNIQUE(`telegramId`)
);
