import Dexie from 'dexie';
import IHistoryFlowEntry from './model/IHistoryFlowEntry';

export default class HistoryFlowDatabase extends Dexie {
    entries: Dexie.Table<IHistoryFlowEntry, number>;

    constructor() {
        super("HistoryFlowDatabase");
        this.version(1).stores({
            entries: "++id,tabId,&pageId,parentPageId,title,url,startedAt,timeSpent"
        });
    }
}