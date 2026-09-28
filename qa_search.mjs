export default async function run(page, ui) {
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  const failedReqs = [];
  page.on('requestfailed', r => failedReqs.push(r.url()));
  await page.click('#nav-search');
  await page.waitForTimeout(300);
  await page.fill('#myshelf-input', 'a');
  await page.waitForTimeout(500);
  const myshelfLabel = await page.evaluate(() => document.getElementById('myshelf-label')?.textContent);
  const myshelfResults = await page.evaluate(() => document.getElementById('myshelf-results')?.innerHTML.slice(0, 300));
  await page.evaluate(() => document.getElementById('tab-api').click());
  await page.fill('#api-search-input', '動物農場');
  await page.evaluate(() => document.querySelector('.search-go-btn').click());
  await page.waitForTimeout(25000);
  const apiBody = await page.evaluate(() => document.getElementById('api-results-body')?.innerHTML.slice(0, 800));
  return { errs, myshelfLabel, myshelfResults, apiBody, failedReqs };
}
