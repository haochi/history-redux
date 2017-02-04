export default class HistoryFlowEntry {
  private visitItemId: string;
  private pageId: string;
  constructor(private tabId: number, private url: string, private referrerUrl: string) {
  }

  getPageId(): string {
    return this.pageId;
  }

  getUrl(): string {
    return this.url;
  }

  getReferrerUrl(): string {
    return this.referrerUrl;
  }

  getVisitItemId(): string {
    return this.visitItemId;
  }

  getTabId(): number {
    return this.tabId;
  }

  setVisitItemId(visitItemId: string) {
    this.visitItemId = visitItemId;
  }

  setPageId(pageId: string) {
    this.pageId = pageId;
  }
}