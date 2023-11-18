import { Dataset, createPlaywrightRouter } from "crawlee";
import { CrawlingContext } from "./main";

export const router = createPlaywrightRouter();

// eslint-disable-next-line @typescript-eslint/no-shadow
router.addDefaultHandler(
    async ({ page, enqueueLinks, request, log }: CrawlingContext) => {
        const title = await page.title();
        const {
            enqueueLinks: shouldEnqueue,
            maxPageWaitSeconds,
            minPageWaitSeconds,
            multiply,
            startUrls,
        } = request.userData;

        log.info(`Crawling: ${title}`);
        await page.waitForLoadState("networkidle");
        const timeoutRandom =
            Math.random() * (maxPageWaitSeconds - minPageWaitSeconds) +
            minPageWaitSeconds;
        log.info(`${title} - Waiting for ${timeoutRandom} seconds`);

        if (shouldEnqueue) {
            await enqueueLinks({
                selector: "a",
                transformRequestFunction: (_request) => {
                    const urlWithoutHash =
                        _request.url.substring(
                            0,
                            _request.url.lastIndexOf("#")
                        ) || _request.url;
                    _request.uniqueKey = multiply + urlWithoutHash;
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

                strategy: "same-domain",
                baseUrl: new URL(request.url).origin,
            });
        }

        await new Promise<void>((resolve) => {
            let timeoutSecs = 0;
            const interval = setInterval(async () => {
                if (timeoutSecs > timeoutRandom) {
                    clearInterval(interval);
                    resolve();
                }

                timeoutSecs += 1;
            }, 1000);
        });
        await page.waitForTimeout(timeoutRandom * 1000);

        const dataset = await Dataset.open();
        await dataset.pushData({
            url: request.url,
            title,
            waitSeconds: timeoutRandom,
        });
    }
);
