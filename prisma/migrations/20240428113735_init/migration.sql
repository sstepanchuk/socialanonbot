-- CreateTable
CREATE TABLE "Queue" (
    "providerType" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    PRIMARY KEY ("clientId", "providerType")
);

-- CreateTable
CREATE TABLE "Chat" (
    "providerType1" TEXT NOT NULL,
    "clientId1" TEXT NOT NULL,
    "providerType2" TEXT NOT NULL,
    "clientId2" TEXT NOT NULL,
    "closedAt" DATETIME,

    PRIMARY KEY ("clientId1", "providerType1", "clientId2", "providerType2")
);
