-- CreateIndex
CREATE UNIQUE INDEX "unique_name_per_parent" ON "categories"("name", "parentId");

