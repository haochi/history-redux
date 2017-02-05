import Dexie from 'dexie';

interface IHistoryFlowEntry {
    id?: number,
    pageId?: string
    parentPageId?: string,
    title?: string,
    url?: string,
    startedAt?: number,
    timeSpent?: number
}

export default class HistoryFlowDatabase extends Dexie {
    entries: Dexie.Table<IHistoryFlowEntry, number>;

    constructor() {
        super("HistoryFlowDatabase");
        this.version(1).stores({
            entries: "++id,&pageId,parentPageId,title,url,startedAt,timeSpent"
        });
    }
}