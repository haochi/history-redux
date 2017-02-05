import LoggingService from '../service/LoggingService';
import DatabaseService from '../service/DatabaseService';
import { IHistoryFlowEntry } from '../database/HistoryFlowDatabase';
import CryptoUtil from '../util/CryptoUtil';

export default class HistoryFlowService {
  private activeTabId = -1;
  private currentPageId: string = null;

  constructor(private loggingService: LoggingService, private databaseService: DatabaseService) {
  }

  startVisit(tabId: number, parentPageId: string, url: string) {
    this.loggingService.logCall('startVisit', arguments);

    this.databaseService.withRWTransaction((table) => {
      const timeSpent = 0;
      const startedAt = (new Date).getTime();
      table.add({ tabId, parentPageId, url, timeSpent, startedAt });
    });
  }

  setPageIdForTab(tabId: number, pageId: string) {
    this.loggingService.logCall('setPageIdForTab', arguments);
    this.databaseService.withRWTransaction(async (table) => {
      const entry = await table.where({ tabId }).reverse().first();

      if (!entry.pageId) {
        table.update(entry.id, { pageId });
      } else {
        this.loggingService.errorCall('setPageIdForTab', arguments, `looked for the wrong entry`);
      }
    });
  }

  setPageTitleForPageId(title: string, pageId: string) {
    this.databaseService.withRWTransaction((table) => {
      table.where({ pageId }).modify({ title });
    });
  }

  setCurrentPageId(currentPageId: string) {
    this.currentPageId = currentPageId;
    this.loggingService.logCall('setCurrentPageId', arguments);
  }

  getCurrentPageId() {
    return this.currentPageId;
  }

  tickTimeSpentForPageId(pageId: string, timeInMs: number) {
    this.databaseService.withRWTransaction(async (table) => {
      try {
        const entry = await table.where({ pageId }).first();
        const timeSpent = entry.timeSpent + timeInMs;
        table.update(entry.id, { timeSpent });
      } catch (e) {
        // 
      }
    });
  }

  inspect(pageId: string) {
    this.databaseService.withRTransaction(async (table) => {
      let entry;
      try {
        entry = await table.where({ pageId }).first();
        console.log(entry.title);
        if (entry.parentPageId) {
          this.inspect(entry.parentPageId);
        }
      } catch (e) {
        this.loggingService.logCall('inspect', arguments);
      }
    });
  }
}
