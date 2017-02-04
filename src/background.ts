import TabService from './service/TabService';
import HistoryFlowService from './service/HistoryFlowService';
import ScreenshotService from './service/ScreenshotService';
import StorageService from './service/StorageService';
import { inject } from './modules';
import ArrayUtil from './util/ArrayUtil';
import Message from './constant/message';

class BackgroundApp {
    private tabsService = inject(TabService);
    private historyFlowService = inject(HistoryFlowService);
    private screenshotService = inject(ScreenshotService);
    private storageService = inject(StorageService);

    static main() {
        const app = new BackgroundApp();
        app.attachActiveTabListeners();
        app.attachBrowserActionListeners();
        app.attachRequestFlowListeners();
    }

    onTabFocusHandler(tabId: number, windowId: number) {
        this.tabsService.getPageId(tabId).then(pageId => {
            this.historyFlowService.setCurrentPageId(pageId);
            if (pageId) {
                this.screenshotService.hasScreenshot(pageId).then(hasScreenshot => {
                    if (!hasScreenshot) {
                        this.screenshotService.takeScreenshot(pageId, windowId);
                    }
                });
            }
        }).catch((e: Error) => {
            console.log(e.message);
        })
    }

    attachRequestFlowListeners() {
        chrome.webRequest.onSendHeaders.addListener((details) => {
            if (details.type === "main_frame") {
                this.historyFlowService.startVisit(details.tabId, this.historyFlowService.getCurrentPageId(), details.url);
            }
        }, { urls: ["<all_urls>"] });

        chrome.runtime.onMessage.addListener((message: {type: Message, id: string}, sender, sendResponse) => {
            if (message.type === Message.REGISTER_PAGE) {
                this.historyFlowService.setPageId(sender.tab.id, message.id);
                if (sender.tab.active) {
                    this.onTabFocusHandler(sender.tab.id, sender.tab.windowId);
                }
            }
        });
    }

    attachActiveTabListeners() {
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.onTabFocusHandler(activeInfo.tabId, activeInfo.windowId);
        });

        chrome.windows.onFocusChanged.addListener((windowId) => {
            if (windowId < 0) {
                return;
            }

            chrome.windows.get(windowId, { populate: true }, (win) => {
                const activeTab = ArrayUtil.first(win.tabs.filter((tab) => tab.active));
                this.onTabFocusHandler(activeTab.id, activeTab.windowId);
            });
        });
    }

    attachBrowserActionListeners() {
        chrome.browserAction.onClicked.addListener((tab) => {
            this.tabsService.openUrlOrSwitchTab(chrome.extension.getURL('index.html'));
        });
    }
}

BackgroundApp.main();