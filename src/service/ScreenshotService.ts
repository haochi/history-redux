import TabService from './TabService';
import StorageService from './StorageService';
import LoggingService from './LoggingService';
import pica = require('pica');

export default class ScreenshotService {
    private desiredScreenshotWidth = 250;
    private screenshotPrefix = 'screenshot:';

    constructor(private tabService: TabService, private storageService: StorageService, private loggingService: LoggingService) {
    }

    takeScreenshot(pageId: string, windowId: number): Promise<void> {
        this.loggingService.logCall('takeScreenshot', arguments);
        return new Promise<void>(async (resolve, reject) => {
            try {
                const dataUrl = await this.tabService.captureVisibleTab(windowId, { format: 'png' });
                const image = document.createElement('img');
                image.onload = async () => {
                    const dataUrl = await this.resize(image);
                    this.saveScreenshot(pageId, dataUrl);
                };
                image.src = dataUrl;
            } catch (e) {
                this.loggingService.log(`Can't capture screenshot for ${pageId} for windowId: ${windowId}`);
                reject(e);
            }
        });
    }

    async hasScreenshot(pageId: string): Promise<boolean> {
        const key = this.key(pageId);
        const value = await this.storageService.get(key);
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

    private resize(image: HTMLImageElement): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const ratio = this.desiredScreenshotWidth / image.width;

            const fromCanvas = document.createElement('canvas');
            const fromContext = fromCanvas.getContext('2d');
            const toCanvas = document.createElement('canvas');

            fromCanvas.width = image.width;
            fromCanvas.height = image.height;
            fromContext.drawImage(image, 0, 0, fromCanvas.width, fromCanvas.height);

            toCanvas.width = this.desiredScreenshotWidth;
            toCanvas.height = image.height * ratio;

            pica.resizeCanvas(fromCanvas, toCanvas, { unsharpAmount: 75 }, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(toCanvas.toDataURL('image/jpeg'));
                }
            });
        });
    }
}