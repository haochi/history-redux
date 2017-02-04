export default class HistoryFlowEntry {
  private visitItemId: string;
  private pageId: string;

  constructor(private tabId: number, private parentPageId: string, private url: string) {
  }

  setPageId(pageId: string) {
    this.pageId = pageId;
  }

  getPageId(): string {
    return this.pageId;
  }

  getParentPageId() {
    return this.parentPageId;
  }

  getUrl(): string {
    return this.url;
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
}