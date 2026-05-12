-- CreateTable
CREATE TABLE "guest_sessions" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "unlimited_access" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "label" TEXT,
    "granted_by" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expired_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "message_limit" INTEGER NOT NULL,
    "message_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "unlimited_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_sessions_fingerprint_key" ON "guest_sessions"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "unlimited_access_token_key" ON "unlimited_access"("token");

-- AddForeignKey
ALTER TABLE "unlimited_access" ADD CONSTRAINT "unlimited_access_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
