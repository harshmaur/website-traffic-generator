import { Dataset, createPlaywrightRouter } from 'crawlee';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ page, enqueueLinks, log }) => {
    log.info(`enqueueing new URLs`);
    const url = page.url();
    log.info(`URL: ${url}`);
    if (!url) return;
    const { origin } = new URL(url);
    log.info(`origin: ${origin}`);
    await enqueueLinks({
        globs: [`${origin}/*`],
        label: 'detail',
    });
});

router.addHandler('detail', async ({ request, page, log }) => {
    const title = await page.title();
    log.info(`${title}`, { url: request.loadedUrl });

    await Dataset.pushData({
        url: request.loadedUrl,
        title,
    });
});
