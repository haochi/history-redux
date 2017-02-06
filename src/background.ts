import TabService from './service/TabService';
import HistoryFlowService from './service/HistoryFlowService';
import ScreenshotService from './service/ScreenshotService';
import StorageService from './service/StorageService';
import LoggingService from './service/LoggingService';
import { inject } from './modules';
import ArrayUtil from './util/ArrayUtil';
import Message from './constant/Message';

export interface BackgroundPage extends Window {
    app: BackgroundApp
}

export default class BackgroundApp {
    private tabsService = inject(TabService);
    private historyFlowService = inject(HistoryFlowService);
    private screenshotService = inject(ScreenshotService);
    private storageService = inject(StorageService);
    private loggingService = inject(LoggingService);
    private isChromeFocused = true;
    private tabTimeSpentLastReset = this.timestamp();

    static main() {
        const app = new BackgroundApp();
        app.attachActiveTabListeners();
        app.attachBrowserActionListeners();
        app.attachRequestFlowListeners();
        app.attachTabPinger();
        return app;
    }

    getHistoryFlowService() {
        return this.historyFlowService;
    }

    getTabsService() {
        return this.tabsService;
    }

    private async setCurrentPageIdFromTab(tabId: number): Promise<string> {
        try {
            const pageId = await this.tabsService.getPageId(tabId);
            this.historyFlowService.setCurrentPageId(pageId);
        } catch (e) {
            this.historyFlowService.setCurrentPageId(null);
            this.loggingService.error(`onTabFocusHandler(${tabId})`, e);
        }
        return this.historyFlowService.getCurrentPageId();
    }

    private async takeScreenshot(pageId: string, windowId: number, override: boolean) {
        if (pageId) {
            const hasScreenshot = await this.screenshotService.hasScreenshot(pageId);
            if (!hasScreenshot || override) {
                this.screenshotService.takeScreenshot(pageId, windowId);
            }
        }
    }

    private attachTabPinger() {
        setInterval(() => {
            const pageId = this.historyFlowService.getCurrentPageId();
            if (pageId) {
                const now = this.timestamp();
                const diff = now - this.tabTimeSpentLastReset;
                this.tabTimeSpentLastReset = now;
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

        // if history push state occurred, we need to handle that as a page load
        chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
            if (details.frameId === 0) {
                this.historyFlowService.startVisit(details.tabId, this.historyFlowService.getCurrentPageId(), details.url);

                chrome.tabs.sendMessage(details.tabId, { type: Message.HISTORY_GET_PAGE_ID }, async (response: { id: string }) => {
                    this.historyFlowService.setPageIdForTab(details.tabId, response.id);
                    const tab = await this.tabsService.get(details.tabId);
                    this.setCurrentPageIdFromTab(details.tabId);
                });
            }
        });

        // set page id
        chrome.runtime.onMessage.addListener((message: { type: Message, id: string }, sender, sendResponse) => {
            if (message.type === Message.SEND_PAGE_ID) {
                this.historyFlowService.setPageIdForTab(sender.tab.id, message.id);
                if (sender.tab.active) {
                    this.setCurrentPageIdFromTab(sender.tab.id);
                }
            }
        });

        // set title and take screenshot if the tab is active
        chrome.runtime.onMessage.addListener((message: { type: Message, id: string, title: string }, sender, sendResponse) => {
            if (message.type === Message.SEND_PAGE_READY) {
                this.historyFlowService.setPageTitleForPageId(message.title, message.id);
                if (sender.tab.active) {
                    this.takeScreenshot(message.id, sender.tab.windowId, false);
                }
            }
        });

        // all resources are loaded, tell content script to mark itself ready for new screenshot
        chrome.webNavigation.onCompleted.addListener(async (details) => {
            const tab = await this.tabsService.get(details.tabId);
            if (tab.active) {
                const pageId = await this.tabsService.getPageId(tab.id);
                this.takeScreenshot(pageId, tab.windowId, true);
            } else {
                chrome.tabs.sendMessage(details.tabId, { type: Message.SEND_PAGE_LOAD_COMPLETED });
            }
        });
    }

    private checkIfNewScreenshotIsNeeded(tabId: number): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            chrome.tabs.sendMessage(tabId, { type: Message.GET_PAGE_SCREENSHOT_OVERRIDE }, (response: {override: boolean}) => {
                const override: boolean = response && response.override;
                resolve(override);
            });
        }).then(override => {
            // acknowledge the receipt of the override request
            if (override) {
                chrome.tabs.sendMessage(tabId, { type: Message.SEND_PAGE_SCREENSHOT_OVERRIDE_ACK });
            }
            return override;
        });
    }

    private attachActiveTabListeners() {
        const onNewTab = async (tabId, windowId) => {
            const pageId = await this.setCurrentPageIdFromTab(tabId);
            const needNewScreenshot = await this.checkIfNewScreenshotIsNeeded(tabId);
            this.takeScreenshot(pageId, windowId, needNewScreenshot);
        }

        chrome.tabs.onActivated.addListener(async (activeInfo) => {
            this.updateLastTabSwitch();
            onNewTab(activeInfo.tabId, activeInfo.windowId);
        });

        chrome.windows.onFocusChanged.addListener((windowId) => {
            this.updateLastTabSwitch();

            if (windowId === chrome.windows.WINDOW_ID_NONE) {
                this.isChromeFocused = false;
            } else {
                chrome.windows.get(windowId, { populate: true }, async (win) => {
                    const activeTab = ArrayUtil.first(win.tabs.filter((tab) => tab.active));
                    onNewTab(activeTab.id, activeTab.windowId);
                });
            }
        });
    }

    private attachBrowserActionListeners() {
        chrome.browserAction.onClicked.addListener(async (tab) => {
            // const ancestors = await this.historyFlowService.getAncestorsOfPageId(this.historyFlowService.getCurrentPageId());
            // console.log(ancestors.map(c => c.title));
            // this.tabsService.openUrlOrSwitchTab(chrome.extension.getURL('index.html'));
        });
    }

    private updateLastTabSwitch() {
        this.tabTimeSpentLastReset = this.timestamp();
    }

    private timestamp(): number {
        return (new Date).getTime();
    }
}

// export to window
const win = window as BackgroundPage;
win.app = BackgroundApp.main();