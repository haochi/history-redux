import HistoryFlowEntry from '../model/HistoryFlowEntry';
import LoggingService from '../service/LoggingService';
import CryptoUtil from '../util/CryptoUtil';

export default class HistoryFlowService {
  private stack: HistoryFlowEntry[] = [];
  private activeTabId = -1;

  constructor(private loggingService: LoggingService) {
  }

  startVisit(tabId: number, url: string, referrerUrl: string) {
    this.loggingService.logCall('startVisit', arguments);
    const entry = new HistoryFlowEntry(tabId, url, referrerUrl);
    this.stack.push(entry);
  }

  registerVisit(url: string, visitItemId: string) {
    for (let entry of this.stack) {
      if (entry.getUrl() === url && !entry.getVisitItemId()) {
        this.loggingService.logCall('registerVisit', arguments);
        entry.setVisitItemId(visitItemId);
        break;
      }
    }
  }

  setPageId(tabId: number, pageId: string) {
    for (let entry of this.stack) {
      if (entry.getTabId() === tabId && !entry.getPageId()) {
        this.loggingService.logCall('setPageId', arguments);
        entry.setPageId(pageId);
        break;
      }
    }
  }

  getEntryByTabId(tabId: number) {
    for (let entry of this.stack) {
      if (entry.getTabId() === tabId) {
        return entry;
      }
    }
  }

  setActiveTabId(activeTabId: number) {
    this.activeTabId = activeTabId;
    this.loggingService.logCall('setActiveTabId', arguments);
  }

  getActiveTabId(): number {
    return this.activeTabId;
  }
}
