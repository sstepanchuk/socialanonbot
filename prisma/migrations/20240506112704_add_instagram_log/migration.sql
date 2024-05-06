-- CreateTable
CREATE TABLE "InstagramLog" (
    "threadId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("threadId", "itemId")
);

CREATE TRIGGER delete_excess_logs
AFTER INSERT ON InstagramLog
BEGIN
    DELETE FROM InstagramLog
    WHERE threadId = NEW.threadId
    AND (threadId, itemId) NOT IN (
        SELECT threadId, itemId FROM InstagramLog
        WHERE threadId = NEW.threadId
        ORDER BY createdAt DESC
        LIMIT 10
    );
END;