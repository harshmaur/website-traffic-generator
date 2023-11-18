import { PlaywrightBlocker } from "@cliqz/adblocker-playwright";
import { PlaywrightCrawlingContext } from "crawlee";

export const blockScripts = async ({
    ctx,
    easyList,
    resources,
    blockImages,
    blockAds,
    blockPatterns,
}: {
    ctx: PlaywrightCrawlingContext;
    easyList: string;
    resources: string;
    blockImages: boolean;
    blockAds: boolean;
    blockPatterns: string[];
}) => {
    const { blockRequests } = ctx;

    if (blockAds) {
        const blocker = PlaywrightBlocker.parse(easyList);
        blocker.updateResources(resources, `${resources.length}`);
        blocker.enableBlockingInPage(ctx.page);
    }

    const blocks: string[] = [];

    if (blockImages) {
        blocks.push(
            ...[
                ".jpg",
                ".jpeg",
                ".png",
                ".svg",
                ".gif",
                ".woff",
                ".pdf",
                ".zip",
            ]
        );
    }
    if (blockPatterns) {
        blocks.push(...blockPatterns);
    }

    if (blocks.length > 0) {
        await blockRequests({
            urlPatterns: blockPatterns,
        });
    }
};
