import HistoryFlowEntry from '../model/HistoryFlowEntry';
import LoggingService from '../service/LoggingService';
import DatabaseService from '../service/DatabaseService';
import CryptoUtil from '../util/CryptoUtil';

export default class HistoryFlowService {
  private stack: HistoryFlowEntry[] = [];
  private lookup: Map<string, HistoryFlowEntry> = new Map<string, HistoryFlowEntry>();
  private activeTabId = -1;
  private currentPageId: string = null;

  constructor(private loggingService: LoggingService, private databaseService: DatabaseService) {
  }

  startVisit(tabId: number, parentPageId: string, url: string) {
    this.loggingService.logCall('startVisit', arguments);
    const entry = new HistoryFlowEntry(tabId, parentPageId, url);
    this.stack.push(entry);
  }

  setPageIdForTab(tabId: number, pageId: string) {
    for (let entry of this.stack) {
      if (entry.getTabId() === tabId && !entry.getPageId()) {
        this.loggingService.logCall('setPageId', arguments);
        entry.setPageId(pageId);
        this.lookup.set(pageId, entry);
        break;
      }
    }
  }

  setPageTitleForPageId(title: string, pageId: string) {
    const entry = this.lookup.get(pageId);
    entry.setTitle(title);
  }

  setCurrentPageId(currentPageId: string) {
    this.currentPageId = currentPageId;
    this.loggingService.logCall('setCurrentPageId', arguments);
  }

  getCurrentPageId() {
    return this.currentPageId;
  }

  tickTimeSpentForPageId(pageId: string, timeInMs: number) {
    const entry = this.lookup.get(pageId);
    if (entry) {
      entry.addTimeSpent(timeInMs);
    }
  }

  inspect(pageId: string) {
    let entry = this.lookup.get(pageId);
    if (entry) {
      console.group(entry.getTitle());
      this.inspect(entry.getParentPageId());
      console.groupEnd();
    }
  }
}
