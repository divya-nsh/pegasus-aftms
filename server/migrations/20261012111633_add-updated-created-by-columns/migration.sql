ALTER TABLE "aircraft" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "aircraft" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "area" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "area" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "grading_attribute" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "grading_attribute" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "grading_scale_option" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "grading_scale_option" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "grading_scale" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "grading_scale" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "grading_template_attribute" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "grading_template_attribute" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "grading_template" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "grading_template" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "location" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "location" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "mission_schedule_participant_grading" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "mission_schedule_participant_grading" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "mission_schedule_participant" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "mission_schedule_participant" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "mission_schedule" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "mission_schedule" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "mission" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "mission" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "personnel" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "personnel" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "role" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "role" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updated_by_id" integer;--> statement-breakpoint
ALTER TABLE "aircraft" ADD CONSTRAINT "aircraft_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "aircraft" ADD CONSTRAINT "aircraft_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "area" ADD CONSTRAINT "area_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "area" ADD CONSTRAINT "area_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "grading_attribute" ADD CONSTRAINT "grading_attribute_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "grading_attribute" ADD CONSTRAINT "grading_attribute_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "grading_scale_option" ADD CONSTRAINT "grading_scale_option_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "grading_scale_option" ADD CONSTRAINT "grading_scale_option_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "grading_scale" ADD CONSTRAINT "grading_scale_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "grading_scale" ADD CONSTRAINT "grading_scale_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "grading_template_attribute" ADD CONSTRAINT "grading_template_attribute_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "grading_template_attribute" ADD CONSTRAINT "grading_template_attribute_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "grading_template" ADD CONSTRAINT "grading_template_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "grading_template" ADD CONSTRAINT "grading_template_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "mission_schedule_participant_grading" ADD CONSTRAINT "mission_schedule_participant_grading_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "mission_schedule_participant_grading" ADD CONSTRAINT "mission_schedule_participant_grading_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "mission_schedule_participant" ADD CONSTRAINT "mission_schedule_participant_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "mission_schedule_participant" ADD CONSTRAINT "mission_schedule_participant_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "mission_schedule" ADD CONSTRAINT "mission_schedule_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "mission_schedule" ADD CONSTRAINT "mission_schedule_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "mission" ADD CONSTRAINT "mission_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "mission" ADD CONSTRAINT "mission_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "role" ADD CONSTRAINT "role_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "role" ADD CONSTRAINT "role_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_created_by_id_user_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_updated_by_id_user_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id");