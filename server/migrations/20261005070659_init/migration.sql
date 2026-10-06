CREATE TYPE "attendance_status" AS ENUM('present', 'absent', 'excused');--> statement-breakpoint
CREATE TYPE "gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "media_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "medical_status" AS ENUM('fit', 'unfit', 'pending');--> statement-breakpoint
CREATE TYPE "mission_assignment_grading_status" AS ENUM('pending', 'scored', 'exempt');--> statement-breakpoint
CREATE TYPE "mission_result" AS ENUM('passed', 'failed');--> statement-breakpoint
CREATE TYPE "mission_status" AS ENUM('draft', 'published', 'completed', 'cancelled', 'in_progress');--> statement-breakpoint
CREATE TYPE "personnel_type" AS ENUM('pilot', 'trainee', 'instructor');--> statement-breakpoint
CREATE TABLE "aircraft" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "aircraft_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"tail_number" varchar NOT NULL UNIQUE,
	"serial_number" varchar,
	"aircraft_type" varchar,
	"induction_date" date,
	"remarks" varchar,
	"status" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "area" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "area_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"code" varchar NOT NULL UNIQUE,
	"address" varchar,
	"description" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grading_attribute" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "grading_attribute_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL UNIQUE,
	"notes" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grading_scale_option" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "grading_scale_option_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"grading_scale_id" integer NOT NULL,
	"label" varchar NOT NULL,
	"point" numeric(5,2) NOT NULL,
	"lower_bound" numeric(5,2) NOT NULL,
	"upper_bound" numeric(5,2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grading_scale" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "grading_scale_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"notes" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grading_template_attribute" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "grading_template_attribute_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"grading_template_id" integer NOT NULL,
	"attribute_id" integer NOT NULL,
	"weight" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grading_template" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "grading_template_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"notes" varchar,
	"grading_scale_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "location_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"code" varchar NOT NULL UNIQUE,
	"address" varchar,
	"phone" varchar,
	"description" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "media_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"path" varchar NOT NULL,
	"original_file_name" varchar NOT NULL,
	"status" "media_status" DEFAULT 'draft'::"media_status" NOT NULL,
	"mime_type" varchar NOT NULL,
	"size" integer NOT NULL,
	"status_updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_schedule_participant_grading" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mission_schedule_participant_grading_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"mission_schedule_participant_id" integer NOT NULL,
	"grading_template_attribute_id" integer NOT NULL,
	"grading_scale_option_id" integer,
	"weight_at_grading" integer,
	"obtained_score_value" numeric(5,2),
	"status" "mission_assignment_grading_status" DEFAULT 'pending'::"mission_assignment_grading_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_schedule_participant" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mission_schedule_participant_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"mission_schedule_id" integer NOT NULL,
	"personnel_id" integer NOT NULL,
	"attendance_status" "attendance_status",
	"aircraft_id" integer,
	"briefing_time" timestamp,
	"aircraft_time" timestamp,
	"takeoff_time" timestamp,
	"landing_time" timestamp,
	"remarks" varchar,
	"obtained_grade_id" integer,
	"obtained_score_value" numeric(10,2),
	"obtained_score_percentage" numeric(5,2),
	"scored_status" "mission_assignment_grading_status" DEFAULT 'pending'::"mission_assignment_grading_status" NOT NULL,
	"result" "mission_result",
	"order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_schedule" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mission_schedule_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"mission_id" integer NOT NULL,
	"schedule_number" varchar NOT NULL UNIQUE,
	"name" varchar NOT NULL,
	"description" varchar DEFAULT '' NOT NULL,
	"start_date_time" timestamp,
	"end_date_time" timestamp,
	"area_id" integer,
	"status" "mission_status" DEFAULT 'draft'::"mission_status" NOT NULL,
	"remarks" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mission_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"description" varchar DEFAULT '',
	"aircraft_id" integer,
	"grading_template_id" integer,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"mission_type" varchar DEFAULT 'flight' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personnel" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "personnel_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"personnel_type" "personnel_type" NOT NULL,
	"batch_no" varchar,
	"code" varchar,
	"first_name" varchar NOT NULL,
	"last_name" varchar,
	"gender" "gender" NOT NULL,
	"date_of_birth" date,
	"date_of_join" date,
	"rank" varchar,
	"qualification" varchar,
	"phone" varchar,
	"email" varchar,
	"address" varchar,
	"image_id" integer,
	"medical_status" "medical_status" DEFAULT 'pending'::"medical_status" NOT NULL,
	"medical_exam_date" date,
	"medical_valid_until" date,
	"user_id" integer UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "role_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL UNIQUE,
	"permissions" varchar[] DEFAULT '{}'::varchar[] NOT NULL,
	"description" varchar,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" varchar PRIMARY KEY,
	"sess" jsonb NOT NULL,
	"expire_at" timestamp NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(60) NOT NULL UNIQUE,
	"email" varchar(255) UNIQUE,
	"name" varchar(255),
	"role_id" integer,
	"password" varchar,
	"last_login_at" timestamp,
	"password_changed_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "unique_grading_scale_id_label_idx" ON "grading_scale_option" ("grading_scale_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_template_id_attribute_id_idx" ON "grading_template_attribute" ("grading_template_id","attribute_id");--> statement-breakpoint
CREATE INDEX "media_status_created_idx" ON "media" ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_participant_id_grading_template_attribute_id_idx" ON "mission_schedule_participant_grading" ("mission_schedule_participant_id","grading_template_attribute_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_mission_schedule_id_personnel_id_idx" ON "mission_schedule_participant" ("mission_schedule_id","personnel_id");--> statement-breakpoint
ALTER TABLE "grading_scale_option" ADD CONSTRAINT "grading_scale_option_grading_scale_id_grading_scale_id_fkey" FOREIGN KEY ("grading_scale_id") REFERENCES "grading_scale"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "grading_template_attribute" ADD CONSTRAINT "grading_template_attribute_L3ECrgtWIsa4_fkey" FOREIGN KEY ("grading_template_id") REFERENCES "grading_template"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "grading_template_attribute" ADD CONSTRAINT "grading_template_attribute_ilzpD2hwnJQV_fkey" FOREIGN KEY ("attribute_id") REFERENCES "grading_attribute"("id");--> statement-breakpoint
ALTER TABLE "grading_template" ADD CONSTRAINT "grading_template_grading_scale_id_grading_scale_id_fkey" FOREIGN KEY ("grading_scale_id") REFERENCES "grading_scale"("id");--> statement-breakpoint
ALTER TABLE "mission_schedule_participant_grading" ADD CONSTRAINT "mission_schedule_participant_grading_ZO8d1i2Hgqll_fkey" FOREIGN KEY ("mission_schedule_participant_id") REFERENCES "mission_schedule_participant"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "mission_schedule_participant_grading" ADD CONSTRAINT "mission_schedule_participant_grading_H1YYr46q8p2v_fkey" FOREIGN KEY ("grading_template_attribute_id") REFERENCES "grading_template_attribute"("id");--> statement-breakpoint
ALTER TABLE "mission_schedule_participant_grading" ADD CONSTRAINT "mission_schedule_participant_grading_RZy9ohg6DdLj_fkey" FOREIGN KEY ("grading_scale_option_id") REFERENCES "grading_scale_option"("id");--> statement-breakpoint
ALTER TABLE "mission_schedule_participant" ADD CONSTRAINT "mission_schedule_participant_eundV0tqkcyU_fkey" FOREIGN KEY ("mission_schedule_id") REFERENCES "mission_schedule"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "mission_schedule_participant" ADD CONSTRAINT "mission_schedule_participant_personnel_id_personnel_id_fkey" FOREIGN KEY ("personnel_id") REFERENCES "personnel"("id");--> statement-breakpoint
ALTER TABLE "mission_schedule_participant" ADD CONSTRAINT "mission_schedule_participant_aircraft_id_aircraft_id_fkey" FOREIGN KEY ("aircraft_id") REFERENCES "aircraft"("id");--> statement-breakpoint
ALTER TABLE "mission_schedule_participant" ADD CONSTRAINT "mission_schedule_participant_8QMkCI2LrHrF_fkey" FOREIGN KEY ("obtained_grade_id") REFERENCES "grading_scale_option"("id");--> statement-breakpoint
ALTER TABLE "mission_schedule" ADD CONSTRAINT "mission_schedule_mission_id_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "mission"("id");--> statement-breakpoint
ALTER TABLE "mission_schedule" ADD CONSTRAINT "mission_schedule_area_id_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "area"("id");--> statement-breakpoint
ALTER TABLE "mission" ADD CONSTRAINT "mission_aircraft_id_aircraft_id_fkey" FOREIGN KEY ("aircraft_id") REFERENCES "aircraft"("id");--> statement-breakpoint
ALTER TABLE "mission" ADD CONSTRAINT "mission_grading_template_id_grading_template_id_fkey" FOREIGN KEY ("grading_template_id") REFERENCES "grading_template"("id");--> statement-breakpoint
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_image_id_media_id_fkey" FOREIGN KEY ("image_id") REFERENCES "media"("id");--> statement-breakpoint
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id");