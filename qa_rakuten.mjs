export default async function run(page, ui) {
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.click('#nav-search');
  await page.waitForTimeout(300);
  await page.evaluate(() => document.getElementById('tab-api').click());
  await page.fill('#api-search-input', '動物農場');
  await page.fill('#api-search-input', '荒野');
  await page.evaluate(() => document.querySelector('.search-go-btn').click());
  await page.waitForTimeout(5000);
  const noIdBody = await page.evaluate(() => document.getElementById('api-results-body')?.innerHTML.slice(0, 200));
  // set fake app id, enable rakuten chip
  await page.evaluate(() => localStorage.setItem('rakutenAppId', 'fake123'));
  await page.evaluate(() => document.getElementById('chip-rakuten').click());
  await page.waitForTimeout(200);
  await page.fill('#api-search-input', '動物農場');
  await page.evaluate(() => document.querySelector('.search-go-btn').click());
  await page.waitForTimeout(6000);
  const body = await page.evaluate(() => document.getElementById('api-results-body')?.innerHTML.slice(0, 400));
  return { errs, noIdBody, body };
}
