CREATE INDEX "todos_user_id_idx" ON "todos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "todos_user_id_created_at_idx" ON "todos" USING btree ("user_id","created_at");