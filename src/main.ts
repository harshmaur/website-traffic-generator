/**
 * 1. Go to the list of URLS given
 * 2. Enqueue links from it if enabled.
 * 3. Stay on the page for min-max time specified by the user
 * 4. Perform any actions specified by the user on the page
 */

// For more information, see https://docs.apify.com/sdk/js
import { Actor, log } from 'apify';
// For more information, see https://crawlee.dev
import { PlaywrightCrawler, PlaywrightCrawlingContext, ProxyConfigurationOptions } from 'crawlee';
import { router } from './routes.js';

import 'dotenv/config';

type InputType = {

    startUrls: string[];
    maxPageWaitSeconds: number;
    minPageWaitSeconds: number;
    enqueueLinks: boolean;
    multiply: number;
    parallelize: boolean;
    proxy: ProxyConfigurationOptions
}

export type CrawlingContext = PlaywrightCrawlingContext<InputType>;

await Actor.main(async () => {
    const input = await Actor.getInput<InputType>();

    log.info(JSON.stringify(input, null, 2));

    if (!input) {
        await Actor.fail('Please provide input options and then run the actor');
        return;
    }

    const {
        startUrls,
        maxPageWaitSeconds,
        minPageWaitSeconds,
        multiply,
        enqueueLinks,
        parallelize,
        proxy,
    } = input;

    const proxyConfiguration = await Actor.createProxyConfiguration(proxy);

    const crawler = new PlaywrightCrawler({
        log,
        proxyConfiguration,
        requestHandler: router,
        maxConcurrency: parallelize ? undefined : 1,
    });

    const uniqueMultiplies = Array.from({ length: multiply }, (_, i) => i + 1);

    for (let i = 0; i < uniqueMultiplies.length; i++) {
        log.setOptions({
            prefix: `Loop: ${i + 1}`,
        });
        await crawler.addRequests(
            startUrls.map((url) => {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const a = new URL(url);
                } catch (error) {
                    log.error(`Invalid URL: ${url}`);
                    throw error;
                }

                return ({
                    url,
                    uniqueKey: `${i + 1}${url}`,
                    userData: {
                        minPageWaitSeconds,
                        maxPageWaitSeconds,
                        enqueueLinks,
                        multiply: i + 1,
                        startUrls,
                    },
                });
            }),
        );

        await crawler.run();
    }
});
