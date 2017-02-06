import CryptoUtil from './util/CryptoUtil';
import Message from './constant/Message';

class ContentApp {
    private pageId: string;
    private screenshotOverride: boolean = false;

    static main() {
        const app = new ContentApp();
        app.setPageId();
        app.sendPageId();
        app.attachListeners();
    }

    private sendPageId() {
        chrome.runtime.sendMessage({ type: Message.SEND_PAGE_ID, id: this.pageId });
    }

    private sendTitle() {
        chrome.runtime.sendMessage({ type: Message.SEND_PAGE_READY, id: this.pageId, title: document.title });
    }

    private attachListeners() {
        chrome.runtime.onMessage.addListener((request: { type: Message }, sender, sendResponse) => {
            if (request.type == Message.GET_PAGE_ID) {
                sendResponse({ id: this.pageId });
            } else if (request.type === Message.HISTORY_GET_PAGE_ID) {
                this.setPageId();
                sendResponse({ id: this.pageId });
                this.sendTitle();
            } else if (request.type === Message.SEND_PAGE_LOAD_COMPLETED) {
                this.screenshotOverride = true;
            } else if (request.type === Message.GET_PAGE_SCREENSHOT_OVERRIDE) {
                sendResponse({ id: this.pageId, override: this.screenshotOverride });
            } else if (request.type === Message.SEND_PAGE_SCREENSHOT_OVERRIDE_ACK) {
                this.screenshotOverride = false;
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            this.sendTitle();
        });
    }

    private setPageId() {
        this.pageId = CryptoUtil.uuid4();
    }
}

ContentApp.main();