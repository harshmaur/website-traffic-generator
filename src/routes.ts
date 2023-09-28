import { createPlaywrightRouter } from 'crawlee';
import { CrawlingContext } from './main';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ page, enqueueLinks, request, log }: CrawlingContext) => {
    const { enqueueLinks: shouldEnqueue, maxPageWaitSeconds, minPageWaitSeconds, multiply, startUrls } = request.userData;

    log.info(`Crawling URL: ${request.url}`);
    await page.waitForLoadState('networkidle');
    const timeoutRandom = Math.random() * (maxPageWaitSeconds - minPageWaitSeconds) + minPageWaitSeconds;
    log.info(`${request.url} - Waiting for ${timeoutRandom} seconds`);

    if (shouldEnqueue) {
        await enqueueLinks({
            selector: 'a',
            transformRequestFunction: (_request) => {
                _request.uniqueKey = multiply + _request.url.substring(0, _request.url.lastIndexOf('#'));
                _request.keepUrlFragment = false;
                _request.userData = {
                    minPageWaitSeconds,
                    maxPageWaitSeconds,
                    multiply,
                    enqueueLinks: shouldEnqueue,
                    startUrls,
                };
                return _request;
            },

            strategy: 'same-domain',
            baseUrl: new URL(request.url).origin,
        });
    }

    await page.waitForTimeout(timeoutRandom * 1000);
});
