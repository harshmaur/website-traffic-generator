import { Dataset, createPlaywrightRouter } from 'crawlee';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ request, enqueueLinks, log }) => {
    log.info(`enqueueing new URLs`);
    const url = request.loadedUrl;
    if (!url) return;
    const { host } = new URL(url);
    await enqueueLinks({
        globs: [`${host}/*`],
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
