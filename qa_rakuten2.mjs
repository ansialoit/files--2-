export default async function run(page, ui) {
  await page.evaluate(() => localStorage.setItem('rakutenAppId', 'fake123'));
  const direct = await page.evaluate(async () => {
    const r = await fetch('/api/rakuten?applicationId=fake123&title=' + encodeURIComponent('動物農場'));
    return { status: r.status, body: (await r.text()).slice(0, 200) };
  });
  await page.click('#nav-search');
  await page.waitForTimeout(200);
  await page.evaluate(() => document.getElementById('tab-api').click());
  await page.evaluate(() => document.getElementById('chip-rakuten').click());
  const chipActive = await page.evaluate(() => document.getElementById('chip-rakuten').classList.contains('active'));
  await page.fill('#api-search-input', '動物農場');
  await page.evaluate(() => document.querySelector('.search-go-btn').click());
  await page.waitForTimeout(7000);
  const body = await page.evaluate(() => document.getElementById('api-results-body')?.innerHTML.slice(0, 500));
  return { direct, chipActive, body };
}
