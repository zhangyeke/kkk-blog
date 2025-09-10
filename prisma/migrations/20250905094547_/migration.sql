/*
  Warnings:

  - You are about to drop the column `passwrod` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "passwrod",
ADD COLUMN     "password" TEXT;
