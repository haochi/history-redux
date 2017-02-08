import IHistoryFlowEntry from '../database/model/IHistoryFlowEntry';
import HistoryFlowDatabase from '../database/HistoryFlowDatabase';
import Dexie from 'dexie';

type HistoryFlowEntryTable = Dexie.Table<IHistoryFlowEntry, number>;

export default class DatabaseService {
    private db: HistoryFlowDatabase = new HistoryFlowDatabase();
    private table: Dexie.Table<IHistoryFlowEntry, number> = this.db.entries;

    withRWTransaction<T>(fn: (table: HistoryFlowEntryTable) => T): Promise<T> {
        return this.withTransaction('rw!', fn);
    }

    withRTransaction<T>(fn: (table: HistoryFlowEntryTable) => T): Promise<T> {
        return this.withTransaction('r!', fn);
    }

    private withTransaction<T>(mode: 'rw!' | 'r!', fn: (table: HistoryFlowEntryTable) => T): Promise<T> {
        return this.db.transaction(mode, this.table, () => {
            return fn(this.table);
        });
    }
}