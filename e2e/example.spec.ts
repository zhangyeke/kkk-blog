import { expect, test } from "@playwright/test"

test("shows the blog title", async ({ page }) => {
  await page.goto("./")

  await expect(page).toHaveTitle(/kkkの博客/)
})

test("redirects an unauthenticated article editor to login", async ({ page }) => {
  await page.goto("/blog/article/write/42")
  await expect(page).toHaveURL(/\/login\?callbackUrl=/)
  const target = new URL(page.url())
  expect(target.searchParams.get("callbackUrl")).toBe("/blog/article/write/42")
})
