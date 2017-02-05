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
        return new Promise<void>((resolve) => {
            this.tabService.captureVisibleTab(windowId, { format: "jpeg" }).then(dataUrl => {
                const image = document.createElement('img');
                image.onload = () => {
                    this.saveScreenshot(pageId, this.resize(image)).then(resolve);
                };
                image.src = dataUrl;
            }).catch(e => {
                this.loggingService.errorCall(`Can't capture screenshot for $${window}`, arguments, e);
            });
        });
    }

    hasScreenshot(id: string): Promise<boolean> {
        const key = this.key(id);
        return this.storageService.get(key).then((value) => value.hasOwnProperty(key));
    }

    saveScreenshot(id: string, dataUrl: string) {
        const key = this.key(id);
        return this.storageService.set({
            [key]: dataUrl
        });
    }

    private key(id: string) {
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