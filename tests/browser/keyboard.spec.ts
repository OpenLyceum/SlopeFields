/**
 * Keyboard / PDOM regressions for the three Slope Fields screens.
 */
import { expect, test } from "@playwright/test";

test("Slope Field: ArrowUp on the initial-point handle raises y₀ in the details", async ({ page }) => {
  await page.goto("/?ea&screens=1");
  const handle = page.getByText("Initial point", { exact: true });
  await handle.focus();
  await handle.press("ArrowUp");
  // Default (x₀, y₀) = (0, 0.5); one up-step of 0.1 → y₀ = 0.6.
  await expect(page.getByText(/\(x₀, y₀\) = \(0,\s*0\.6\)/)).toBeAttached();
});

test("Euler: Step three times updates the details step count", async ({ page }) => {
  await page.goto("/?ea&screens=2");
  const step = page.getByRole("button", { name: "Step", exact: true });
  await step.press("Enter");
  await step.press("Enter");
  await step.press("Enter");
  await expect(page.getByText(/steps 3 of/)).toBeAttached();
});

test("Euler: keyboard equation change is reflected in the details", async ({ page }) => {
  await page.goto("/?ea&screens=2");
  // Default equation is y′ = y; pick y′ = x from the list.
  const equation = page.getByRole("button", { name: /^Equation/ });
  await equation.press("Enter");
  await page.getByRole("option", { name: "y′ = x", exact: true }).press("Enter");
  // Details template starts with the equation latex followed by ". h =".
  await expect(page.getByText(/y′ = x\. h =/)).toBeAttached();
});

test("Growth Models: raising H past rK/4 announces no equilibria in the details", async ({ page }) => {
  await page.goto("/?ea&screens=3");
  const model = page.getByRole("button", { name: /^Model/ });
  await model.press("Enter");
  await page.getByRole("option", { name: "Logistic with harvesting", exact: true }).press("Enter");

  // Defaults: r = 0.8, K = 10 → rK/4 = 2; H starts at 1 with step 0.1.
  const harvest = page.getByRole("slider", { name: "Harvest rate H", exact: true });
  await harvest.focus();
  for (let i = 0; i < 15; i++) {
    await harvest.press("ArrowRight");
  }
  await expect(page.getByText(/Logistic with harvesting:.*No equilibria:/)).toBeAttached();
});
