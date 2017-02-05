import Dexie from 'dexie';

export interface IHistoryFlowEntry {
    id?: number,
    tabId: number,
    pageId?: string
    parentPageId?: string,
    title?: string,
    url: string,
    startedAt: number,
    timeSpent: number
}

export default class HistoryFlowDatabase extends Dexie {
    entries: Dexie.Table<IHistoryFlowEntry, number>;

    constructor() {
        super("HistoryFlowDatabase");
        this.version(1).stores({
            entries: "++id,tabId,&pageId,parentPageId,title,url,startedAt,timeSpent"
        });
    }
}