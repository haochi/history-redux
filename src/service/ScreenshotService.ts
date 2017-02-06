import TabService from './TabService';
import StorageService from './StorageService';
import LoggingService from './LoggingService';

export default class ScreenshotService {
    private desiredScreenshotHeight = 250;
    private screenshotPrefix = 'screenshot:';

    constructor(private tabService: TabService, private storageService: StorageService, private loggingService: LoggingService) {
    }

    takeScreenshot(pageId: string, windowId: number): Promise<void> {
        this.loggingService.logCall('takeScreenshot', arguments);
        return new Promise<void>(async (resolve) => {
            try {
                const dataUrl = await this.tabService.captureVisibleTab(windowId, { format: "jpeg" });
                const image = document.createElement('img');
                image.onload = async () => {
                    const dataUrl = await this.saveScreenshot(pageId, this.resize(image));
                    resolve(dataUrl);
                };
                image.src = dataUrl;
            } catch (e) {
                this.loggingService.log(`Can't capture screenshot for ${pageId} for windowId: ${windowId}`);
            }
        });
    }

    async hasScreenshot(id: string) {
        const key = this.key(id);
        const value = await this.storageService.get(key)
        return value.hasOwnProperty(key);
    }

    saveScreenshot(id: string, dataUrl: string) {
        const key = this.key(id);
        return this.storageService.set({ [key]: dataUrl });
    }

    getScreenshots(keys: string[]) {
        return this.storageService.get(keys.map(key => this.key(key)));
    }

    key(id: string): string {
        return this.screenshotPrefix + id;
    }

    private resize(image: HTMLImageElement): string {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const ratio = this.desiredScreenshotHeight / image.height;
        const desiredScreenshotWidth = image.width * ratio;

        canvas.width = desiredScreenshotWidth;
        canvas.height = this.desiredScreenshotHeight;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        return canvas.toDataURL('image/jpeg');
    }
}