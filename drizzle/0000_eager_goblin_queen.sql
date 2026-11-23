CREATE TABLE "analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"depth" integer DEFAULT 15 NOT NULL,
	"white_accuracy" numeric(5, 2),
	"black_accuracy" numeric(5, 2),
	"summary" jsonb NOT NULL,
	"moves_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "analyses_game_id_unique" UNIQUE("game_id")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pgn_hash" varchar(64) NOT NULL,
	"pgn" text NOT NULL,
	"white_player" varchar(100),
	"black_player" varchar(100),
	"user_color" varchar(5),
	"result" varchar(10),
	"played_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "uq_games_user_pgn_hash" UNIQUE("user_id","pgn_hash"),
	CONSTRAINT "chk_user_color" CHECK ("games"."user_color" IN ('white', 'black'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" bigint,
	"email" varchar(255),
	"display_name" varchar(100) NOT NULL,
	"chesscom_username" varchar(100),
	"lichess_username" varchar(100),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "chk_user_identity" CHECK ("users"."telegram_id" IS NOT NULL OR "users"."email" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_analyses_game_id" ON "analyses" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_games_user_id" ON "games" USING btree ("user_id");