interface IHistoryFlowEntry {
    id?: number,
    tabId: number,
    pageId?: string
    parentPageId?: string,
    title?: string,
    url: string,
    startedAt: number,
    timeSpent: number
}

export default IHistoryFlowEntry;