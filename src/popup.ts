import injector from './modules';
import BackgroundApp, { BackgroundPage } from './background';
import HistoryFlowEntryViewModel from './model/HistoryFlowEntryViewModel';
import Vue = require('vue');

class PopupApp {
    private getBackground() {
        return new Promise<BackgroundPage>((resolve) => {
            chrome.runtime.getBackgroundPage((win) => resolve(win as BackgroundPage));
        });
    }

    private async getBackgroundApp() {
        const background = await this.getBackground();
        return background.app;
    }

    static async main() {
        const app = new PopupApp();
        const background = await app.getBackgroundApp();
        const historyFlowService = await background.getHistoryFlowService();
        const tabsService = await background.getTabsService();
        const entries = await historyFlowService.getAncestorsWithScreenshotOfPageId(historyFlowService.getCurrentPageId());

        const view = new Vue({
            el: '#app',
            data: {
                entries
            },
            methods: {
                open(entry: HistoryFlowEntryViewModel) {
                    tabsService.openUrlOrSwitchTab(entry.url);
                }
            }
        });
    }
}

PopupApp.main();