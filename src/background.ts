import TabService from './service/TabService';
import HistoryFlowService from './service/HistoryFlowService';
import HistoryService from './service/HistoryService';
import ScreenshotService from './service/ScreenshotService';
import StorageService from './service/StorageService';
import { inject } from './modules';
import ArrayUtil from './util/ArrayUtil';
import Message from './constant/message';

class BackgroundApp {
    private tabsService = inject(TabService);
    private historyFlowService = inject(HistoryFlowService);
    private historyService = inject(HistoryService);
    private screenshotService = inject(ScreenshotService);
    private storageService = inject(StorageService);

    static main() {
        const app = new BackgroundApp();
        app.attachActiveTabListeners();
        app.attachBrowserActionListeners();
        app.attachRequestFlowListeners();
    }

    setActiveTabId(tabId: number, windowId: number) {
        this.historyFlowService.setActiveTabId(tabId);
        this.tabsService.getPageId(tabId).then(pageId => {
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
                const referrerUrlPromise = new Promise<string>((resolve) => {
                    let referrerUrls = details.requestHeaders
                        .filter(header => header.name === "Referer")
                        .map(header => header.value);

                    if (referrerUrls.length) {
                        resolve(ArrayUtil.first(referrerUrls));
                    } else {
                        this.tabsService.get(this.historyFlowService.getActiveTabId()).then((tab) => {
                            resolve(tab.url);
                        });
                    }
                });

                referrerUrlPromise.then(referrerUrl => {
                    this.historyFlowService.startVisit(details.tabId, details.url, referrerUrl);
                });
            }
        }, { urls: ["<all_urls>"] }, ["requestHeaders"]);

        chrome.history.onVisited.addListener((historyItem) => {
            this.historyService.getVisits({ url: historyItem.url }).then((visitItems) => {
                const visitItem = ArrayUtil.last(visitItems);
                this.historyFlowService.registerVisit(historyItem.url, visitItem.visitId);
            });
        });

        chrome.runtime.onMessage.addListener((message: {type: Message, id: string}, sender, sendResponse) => {
            if (message.type === Message.REGISTER_PAGE) {
                this.historyFlowService.setPageId(sender.tab.id, message.id);
                if (sender.tab.active) {
                    this.setActiveTabId(sender.tab.id, sender.tab.windowId);
                }
            }
        });
    }

    attachActiveTabListeners() {
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.setActiveTabId(activeInfo.tabId, activeInfo.windowId);
        });

        chrome.windows.onFocusChanged.addListener((windowId) => {
            if (windowId < 0) {
                return;
            }

            chrome.windows.get(windowId, { populate: true }, (win) => {
                const activeTab = ArrayUtil.first(win.tabs.filter((tab) => tab.active));
                this.setActiveTabId(activeTab.id, activeTab.windowId);
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