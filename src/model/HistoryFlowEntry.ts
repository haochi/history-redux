export default class HistoryFlowEntry {
  private pageId: string;
  private startedAt: number;
  private title: string;
  private timeSpent: number = 0;

  constructor(private tabId: number, private parentPageId: string, private url: string) {
  }

  setPageId(pageId: string) {
    this.pageId = pageId;
  }

  getPageId(): string {
    return this.pageId;
  }

  getTitle(): string {
    return this.title;
  }

  setTitle(title: string) {
    this.title = title;
  }

  getParentPageId() {
    return this.parentPageId;
  }

  getUrl(): string {
    return this.url;
  }

  getTabId(): number {
    return this.tabId;
  }

  addTimeSpent(timeInMs: number) {
    this.timeSpent += timeInMs;
  }
}