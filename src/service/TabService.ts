import Message from '../constant/Message';
import LoggingService from './LoggingService';

export default class TabService {
    constructor(private loggingService: LoggingService) {

    }

    async openUrlOrSwitchTab(url: string): Promise<chrome.tabs.Tab> {
        const tabs = await this.query({ currentWindow: true });
        const firstTabWithSameUrl = tabs.filter(tab => tab.url === url)[0];

        if (firstTabWithSameUrl) {
            return this.update(firstTabWithSameUrl.id, { selected: true });
        } else {
            return this.create({ url: url });
        }
    }

    getPageId(tabId: number): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, { type: Message.GET_PAGE_ID }, (response) => {
                if (response) {
                    resolve(response.id);
                } else {
                    reject(new Error(`Tab(${tabId}) doesn't have pageId`));
                }
            });
        });
    }

    getPageTitle(tabId: number): Promise<string> {
        return new Promise<string>((resolve) => {
            chrome.tabs.sendMessage(tabId, { type: Message.GET_PAGE_TITLE }, (response) => {
                resolve(response.title);
            });
        });
    }

    get(tabId: number): Promise<chrome.tabs.Tab> {
        return new Promise<chrome.tabs.Tab>((resolve, reject) => {
            chrome.tabs.get(tabId, (tab) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(tab);
                }
            });
        });
    }

    create(createProperties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> {
        return new Promise<chrome.tabs.Tab>((resolve) => {
            chrome.tabs.create(createProperties, resolve);
        });
    }

    query(query: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
        return new Promise<chrome.tabs.Tab[]>((resolve) => {
            chrome.tabs.query(query, resolve);
        });
    }

    update(tabId: number, updateProperties: chrome.tabs.UpdateProperties): Promise<chrome.tabs.Tab> {
        return new Promise<chrome.tabs.Tab>((resolve) => {
            chrome.tabs.update(tabId, updateProperties, resolve);
        });
    }

    executeScript(tabId: number, injectDetail: chrome.tabs.InjectDetails): Promise<any> {
        return new Promise<any[]>((resolve) => {
            chrome.tabs.executeScript(tabId, injectDetail, resolve);
        });
    }

    captureVisibleTab(tabId: number, options: chrome.tabs.CaptureVisibleTabOptions): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            chrome.tabs.captureVisibleTab(tabId, options, (dataUrl) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(dataUrl);
                }
            });
        });
    }
}