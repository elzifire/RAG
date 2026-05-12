-- CreateEnum
CREATE TYPE "QueueJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "chat_queue_jobs" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_message_id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "QueueJobStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "error_text" TEXT,

    CONSTRAINT "chat_queue_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_queue_jobs_user_message_id_key" ON "chat_queue_jobs"("user_message_id");

-- CreateIndex
CREATE INDEX "chat_queue_jobs_session_id_status_created_at_idx" ON "chat_queue_jobs"("session_id", "status", "created_at");

-- AddForeignKey
ALTER TABLE "chat_queue_jobs" ADD CONSTRAINT "chat_queue_jobs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
