import TabService from './service/TabService';
import HistoryFlowService from './service/HistoryFlowService';
import ScreenshotService from './service/ScreenshotService';
import StorageService from './service/StorageService';
import LoggingService from './service/LoggingService';
import { inject } from './modules';
import ArrayUtil from './util/ArrayUtil';
import Message from './constant/Message';

class BackgroundApp {
    private tabsService = inject(TabService);
    private historyFlowService = inject(HistoryFlowService);
    private screenshotService = inject(ScreenshotService);
    private storageService = inject(StorageService);
    private loggingService = inject(LoggingService);
    private isChromeFocused = true;
    private tabTimeSpentEpoch = this.timestamp();

    static main() {
        const app = new BackgroundApp();
        app.attachActiveTabListeners();
        app.attachBrowserActionListeners();
        app.attachRequestFlowListeners();
        app.attachTabPinger();
    }

    private onTabFocusHandler(tabId: number, windowId: number) {
        this.tabsService.getPageId(tabId).then(pageId => {
            this.historyFlowService.setCurrentPageId(pageId);
            this.screenshotService.hasScreenshot(pageId).then(hasScreenshot => {
                if (!hasScreenshot) {
                    this.screenshotService.takeScreenshot(pageId, windowId);
                }
            });
        }).catch((e: Error) => {
            this.historyFlowService.setCurrentPageId(null);
            this.loggingService.log(`onTabFocusHandler(): ${e.message}`);
        });
    }

    private attachTabPinger() {
        setInterval(() => {
            const pageId = this.historyFlowService.getCurrentPageId();
            if (pageId) {
                const now = this.timestamp();
                const diff = now - this.tabTimeSpentEpoch;
                this.tabTimeSpentEpoch = now;
                this.historyFlowService.tickTimeSpentForPageId(pageId, diff);
            }
        }, 1000);
    }

    private attachRequestFlowListeners() {
        // a page "load" will either go through the webRequest.onSendHeaders or the webNavigation.onHistoryStateUpdated handler
        chrome.webRequest.onSendHeaders.addListener((details) => {
            if (details.type === "main_frame") {
                this.historyFlowService.startVisit(details.tabId, this.historyFlowService.getCurrentPageId(), details.url);
            }
        }, { urls: ["<all_urls>"] });

        chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
            if (details.frameId === 0) {
                this.historyFlowService.startVisit(details.tabId, this.historyFlowService.getCurrentPageId(), details.url);

                chrome.tabs.sendMessage(details.tabId, { type: Message.HISTORY_GET_PAGE_ID }, async(response: {id: string}) => {
                    this.historyFlowService.setPageIdForTab(details.tabId, response.id);
                    const tab = await this.tabsService.get(details.tabId);
                    this.onTabFocusHandler(details.tabId, tab.windowId);
                });
            }
        });

        chrome.runtime.onMessage.addListener((message: { type: Message, id: string }, sender, sendResponse) => {
            if (message.type === Message.SEND_PAGE_ID) {
                this.historyFlowService.setPageIdForTab(sender.tab.id, message.id);
                if (sender.tab.active) {
                    this.onTabFocusHandler(sender.tab.id, sender.tab.windowId);
                }
            }
        });

        chrome.runtime.onMessage.addListener((message: { type: Message, id: string, title: string }, sender, sendResponse) => {
            if (message.type === Message.SEND_PAGE_TITLE) {
                this.historyFlowService.setPageTitleForPageId(message.title, message.id);
            }
        });
    }

    private attachActiveTabListeners() {
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.updateLastTabSwitch();
            this.onTabFocusHandler(activeInfo.tabId, activeInfo.windowId);
        });

        chrome.windows.onFocusChanged.addListener((windowId) => {
            this.updateLastTabSwitch();

            if (windowId === chrome.windows.WINDOW_ID_NONE) {
                this.isChromeFocused = false;
            } else {
                chrome.windows.get(windowId, { populate: true }, (win) => {
                    const activeTab = ArrayUtil.first(win.tabs.filter((tab) => tab.active));
                    this.onTabFocusHandler(activeTab.id, activeTab.windowId);
                });
            }
        });
    }

    private attachBrowserActionListeners() {
        chrome.browserAction.onClicked.addListener((tab) => {
            this.historyFlowService.inspect(this.historyFlowService.getCurrentPageId());
            // this.tabsService.openUrlOrSwitchTab(chrome.extension.getURL('index.html'));
        });
    }

    private updateLastTabSwitch() {
        this.tabTimeSpentEpoch = this.timestamp();
    }

    private timestamp(): number {
        return (new Date).getTime();
    }
}

BackgroundApp.main();