-- CreateIndex
CREATE INDEX "books_title_idx" ON "public"."books"("title");

-- CreateIndex
CREATE INDEX "books_author_idx" ON "public"."books"("author");

-- CreateIndex
CREATE INDEX "books_title_author_idx" ON "public"."books"("title", "author");
