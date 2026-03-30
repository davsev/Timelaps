import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3000';
const STAGE_TIMEOUT = 20 * 60 * 1000; // 20 min per stage (Kling can be slow)

test.describe('Timelapse full pipeline', () => {
  test('create project, generate all stages, render final video', async ({ page }) => {
    // ── 1. Go to dashboard ────────────────────────────────────────────────────
    await page.goto(BASE);
    await expect(page.getByText('TimeLaps')).toBeVisible();

    // ── 2. Open idea selector ─────────────────────────────────────────────────
    await page.getByRole('button', { name: /Create New Timelapse/i }).click();
    await expect(page.getByText(/Choose a project idea/i)).toBeVisible({ timeout: 10_000 });

    // ── 3. Pick the first idea ────────────────────────────────────────────────
    const firstIdea = page.locator('[data-testid="idea-card"]').first();
    await firstIdea.waitFor({ timeout: 10_000 });
    await firstIdea.click();

    // ── 4. Wait for project page to load ──────────────────────────────────────
    await page.waitForURL(/\/projects\/.+/, { timeout: 15_000 });
    await expect(page.getByText(/Stage 1/i)).toBeVisible({ timeout: 10_000 });
    console.log('Project created:', page.url());

    // ── 5. Generate all stages sequentially ───────────────────────────────────
    const totalStages = await getTotalStages(page);
    console.log(`Total stages: ${totalStages}`);

    for (let stage = 1; stage <= totalStages; stage++) {
      console.log(`\nGenerating stage ${stage}/${totalStages}...`);
      await generateAndWaitForStage(page, stage, STAGE_TIMEOUT);
    }

    // ── 6. Render the final timelapse ─────────────────────────────────────────
    console.log('\nRendering final timelapse...');
    await page.getByRole('button', { name: /Render Full Timelapse/i }).click();

    // Wait for the download button or video player to appear
    await expect(page.getByRole('link', { name: /Download Final Video/i })).toBeVisible({
      timeout: 60_000,
    });
    console.log('Final video rendered successfully!');

    // ── 7. Verify the video player is shown ──────────────────────────────────
    await expect(page.locator('video').last()).toBeVisible();
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getTotalStages(page: Page): Promise<number> {
  // The progress text shows "X / N stages"
  const progressText = await page.locator('text=/\\d+ \\/ \\d+ stages/').first().textContent();
  const match = progressText?.match(/\d+ \/ (\d+) stages/);
  return match ? parseInt(match[1], 10) : 6;
}

async function generateAndWaitForStage(page: Page, stage: number, timeout: number) {
  // Click "Generate Stage N" button
  const generateBtn = page.getByRole('button', { name: new RegExp(`Generate Stage ${stage}`, 'i') });
  await expect(generateBtn).toBeEnabled({ timeout: 10_000 });
  await generateBtn.click();

  // Wait for that stage's clip card to show "Complete"
  const stageCard = page.locator(`[data-stage-index="${stage - 1}"]`);

  // Poll for completion (done or error)
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    await page.waitForTimeout(5_000);

    const isDone = await stageCard.locator('text=Complete').isVisible().catch(() => false);
    if (isDone) {
      console.log(`  Stage ${stage} complete`);
      return;
    }

    const isError = await stageCard.locator('text=Failed').isVisible().catch(() => false);
    if (isError) {
      const errorMsg = await stageCard.locator('.font-mono').textContent().catch(() => 'unknown');
      throw new Error(`Stage ${stage} failed: ${errorMsg}`);
    }
  }

  throw new Error(`Stage ${stage} timed out after ${timeout / 60000} minutes`);
}
