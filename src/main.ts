/**
 * 1. Go to the list of URLS given
 * 2. Enqueue links from it if enabled.
 * 3. Stay on the page for min-max time specified by the user
 * 4. Perform any actions specified by the user on the page
 */

// For more information, see https://docs.apify.com/sdk/js
import { Actor } from 'apify';
// For more information, see https://crawlee.dev
import { PlaywrightCrawler } from 'crawlee';
import { router } from './routes.js';

// Initialize the Apify SDK
await Actor.init();

const input = await Actor.getInput<{
    startUrls: string[]
    shouldEnqueue?: boolean
}>();

if (input === null) {
    await Actor.fail('Please provide input options and then run the actor');
}

const { startUrls } = input!;

const proxyConfiguration = await Actor.createProxyConfiguration();

const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    requestHandler: router,
});

await crawler.run(startUrls);

// Exit successfully
await Actor.exit();
