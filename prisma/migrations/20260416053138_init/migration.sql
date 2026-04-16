-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "beds" DOUBLE PRECISION,
    "baths" DOUBLE PRECISION,
    "sqft" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "propertyType" TEXT DEFAULT 'single_family',
    "estimatedValue" DOUBLE PRECISION,
    "dataSource" TEXT,
    "dataFreshness" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'New Analysis',
    "assumptions" JSONB NOT NULL,
    "projections" JSONB,
    "grades" JSONB,
    "metrics" JSONB,
    "scenarios" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalComp" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "beds" DOUBLE PRECISION NOT NULL,
    "baths" DOUBLE PRECISION NOT NULL,
    "sqft" DOUBLE PRECISION,
    "rent" DOUBLE PRECISION NOT NULL,
    "propertyType" TEXT,
    "distance" DOUBLE PRECISION,
    "source" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "analysisRef" TEXT,

    CONSTRAINT "RentalComp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Property_address_idx" ON "Property"("address");

-- CreateIndex
CREATE INDEX "Analysis_propertyId_idx" ON "Analysis"("propertyId");

-- CreateIndex
CREATE INDEX "RentalComp_zip_idx" ON "RentalComp"("zip");

-- CreateIndex
CREATE INDEX "RentalComp_analysisRef_idx" ON "RentalComp"("analysisRef");

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
