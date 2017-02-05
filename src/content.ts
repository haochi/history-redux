import CryptoUtil from './util/CryptoUtil';
import Message from './constant/Message';

class ContentApp {
    private pageId: string;

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
        chrome.runtime.sendMessage({ type: Message.SEND_PAGE_TITLE, id: this.pageId, title: document.title });
    }

    private attachListeners() {
        chrome.runtime.onMessage.addListener((request: { type: Message }, sender, sendResponse) => {
            if (request.type == Message.GET_PAGE_ID) {
                sendResponse({ id: this.pageId });
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