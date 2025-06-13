import { Cluster } from "puppeteer-cluster"
import puppeteer from "puppeteer"

const TIMEOUT = 1000 * 60 * 5
const PUPPETEER_OPTIONS = {
  ignoreHTTPSErrors: true,
  protocolTimeout: 0, 
  headless: false,
  args: [
    '--no-sandbox',
    '--no-zygote',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--disable-extensions',
    '--disable-file-system',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--hide-scrollbars',
    '--metrics-recording-only',
    '--mute-audio',
    '--safebrowsing-disable-auto-update',
    '--ignore-certificate-errors',
    '--ignore-ssl-errors',
    '--ignore-certificate-errors-spki-list',
    '--font-render-hinting=medium',
  ],
};

async function bootstrap() {
  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);

  // const cluster = await Cluster.launch({
  //   concurrency: Cluster.CONCURRENCY_BROWSER,
  //   maxConcurrency: 1,
  //   retryLimit: 0,
  //   puppeteerOptions: PUPPETEER_OPTIONS,
  // });
  browser.on('taskerror', () => {
  
  });
const page = await browser.newPage();
await page.setDefaultTimeout(0);               // ✅ 所有 waitFor / selectors 禁用 timeout
await page.setDefaultNavigationTimeout(0);     // ✅ 禁用页面跳转 timeout
    await page.goto(
      'https://appstg.mspbots.ai/publicReportPdf?pageid=1933455987235225601&settingToken=fe9164ae9eb743ba8f024c2236d0e672&comGridMaxNum=350&tenantCode=1285403951449878530&currentPage=0',
      { waitUntil: 'load', timeout: 0 }
    );

    await page.waitForSelector('[id^=dashboard-page-tag-]', { timeout: 0 });

    await page.pdf({path:'1.pdf'});
}

bootstrap()