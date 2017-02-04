import CryptoUtil from './util/CryptoUtil';
import message from './constant/message';
import symbol from './constant/symbol';

class ContentApp {
    static main() {
        const app = new ContentApp();
        app.registerPage();
        app.attachListeners();
    }

    registerPage() {
        const id = CryptoUtil.uuid4();
        document[symbol.PAGE_ID] = id;
        chrome.runtime.sendMessage({ type: message.REGISTER_PAGE, id });
    }

    attachListeners() {
        chrome.runtime.onMessage.addListener((request: { type: message }, sender, sendResponse) => {
            if (request.type == message.GET_PAGE_ID) {
                sendResponse({ id: document[symbol.PAGE_ID] });
            }
        });
    }
}

ContentApp.main();