import CryptoUtil from './util/CryptoUtil';
import message from './constant/message';

const PAGE_ID = Symbol();

class ContentApp {
    private pageId: string;

    static main() {
        const app = new ContentApp();
        app.setPageId();
        app.sendPageId();
        app.attachListeners();
    }

    sendPageId() {
        chrome.runtime.sendMessage({ type: message.SEND_PAGE_ID, id: this.pageId });
    }

    sendTitle() {
        chrome.runtime.sendMessage({ type: message.SEND_PAGE_TITLE, id: this.pageId, title: document.title });
    }

    attachListeners() {
        chrome.runtime.onMessage.addListener((request: { type: message }, sender, sendResponse) => {
            if (request.type == message.GET_PAGE_ID) {
                sendResponse({ id: this.pageId });
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            this.sendTitle();
        });
    }

    setPageId() {
        this.pageId = CryptoUtil.uuid4();
    }
}

ContentApp.main();