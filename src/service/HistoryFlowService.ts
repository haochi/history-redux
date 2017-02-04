import HistoryFlowEntry from '../model/HistoryFlowEntry';
import LoggingService from '../service/LoggingService';
import CryptoUtil from '../util/CryptoUtil';

export default class HistoryFlowService {
  private stack: HistoryFlowEntry[] = [];
  private activeTabId = -1;
  private currentPageId: string = null;

  constructor(private loggingService: LoggingService) {
  }

  startVisit(tabId: number, parentPageId: string, url: string) {
    this.loggingService.logCall('startVisit', arguments);
    const entry = new HistoryFlowEntry(tabId, parentPageId, url);
    this.stack.push(entry);
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

  setCurrentPageId(currentPageId: string) {
    this.currentPageId = currentPageId;
    this.loggingService.logCall('setCurrentPageId', arguments);
  }

  getCurrentPageId() {
    return this.currentPageId;
  }
}
