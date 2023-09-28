import { createPlaywrightRouter, log } from 'crawlee';
import { Page } from 'playwright';
import { CrawlingContext } from './main';

export const router = createPlaywrightRouter();

const randomInteractions = (page: Page) => {
    log.info('Performing random mouse and scroll interactions');
    // move mouse to random position
    const x = Math.floor(Math.random() * 1000);
    const y = Math.floor(Math.random() * 1000);
    page.mouse.move(x, y);

    // scroll randomly
    const scroll = Math.floor(Math.random() * 1000);
    page.evaluate((_scroll) => {
        window.scrollBy(0, _scroll);
    }, scroll);
};

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

    // do some random scroll and mouse movements untill the timeout
    await new Promise<void>((resolve) => {
        let timeoutSecs = 0;
        const interval = setInterval(async () => {
            if (timeoutSecs > timeoutRandom) {
                clearInterval(interval);
                resolve();
            }
            timeoutSecs += 1;
            randomInteractions(page);
        }, 1000);
    });
    await page.waitForTimeout(timeoutRandom * 1000);
});
