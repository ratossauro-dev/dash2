CREATE TABLE `api_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`botId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`token` varchar(128) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_tokens_token_unique` UNIQUE(`token`)
);
