import LoggingService from '../service/LoggingService';
import DatabaseService from '../service/DatabaseService';
import ScreenshotService from '../service/ScreenshotService';
import HistoryFlowEntryViewModel from '../model/HistoryFlowEntryViewModel';
import IHistoryFlowEntry from '../database/model/IHistoryFlowEntry';
import CryptoUtil from '../util/CryptoUtil';

export default class HistoryFlowService {
  private activeTabId = -1;
  private currentPageId: string = null;

  constructor(private loggingService: LoggingService, private databaseService: DatabaseService, private screenshotService: ScreenshotService) {
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
      try {
        const entry = await table.where({ tabId }).reverse().first();

        if (!entry.pageId) {
          table.update(entry.id, { pageId });
        } else {
          this.loggingService.log(`setPageIdForTab(${tabId}, ${pageId}): looked for the wrong entry`);
        }
      } catch (e) {
        this.loggingService.errorCall(`setPageIdForTab(${tabId}, ${pageId})`, e);
      }
    });
  }

  setPageTitleForPageId(title: string, pageId: string) {
    this.loggingService.logCall('setPageTitleForPageId', arguments);
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
        this.loggingService.log(`Can't update timeSpent for ${pageId}`);
      }
    });
  }

  async getAncestorsWithScreenshotOfPageId(pageId: string) {
    const ancestors = await this.getAncestorsOfPageId(pageId);
    const screenshots = await this.screenshotService.getScreenshots(ancestors.map(a => a.pageId));

    return ancestors.map(ancestor => {
      return new HistoryFlowEntryViewModel(ancestor, {
        url: screenshots[this.screenshotService.key(ancestor.pageId)]
      });
    });
  }

  private async getAncestorsOfPageId(pageId: string): Promise<IHistoryFlowEntry[]> {
    const entries = await this.recursiveParentLookup(pageId, []);
    entries.shift(); // we don't need the current entry
    return entries;
  }

  private async recursiveParentLookup(pageId: string, ancestors: IHistoryFlowEntry[]): Promise<IHistoryFlowEntry[]> {
    if (!pageId) {
      return ancestors;
    }

    const entry = await this.databaseService.withRTransaction((table) => {
      return table.where({ pageId }).first();
    });

    if (entry) {
      return this.recursiveParentLookup(entry.parentPageId, ancestors.concat(entry));
    } else {
      return ancestors;
    }
  }
}
