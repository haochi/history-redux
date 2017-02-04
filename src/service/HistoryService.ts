export default class HistoryService {
    all(text: string = ''): Promise<chrome.history.HistoryItem[]> {
        const max = Math.pow(2, 31) - 1;
        return this.search({ startTime: 0, endTime: (new Date).getTime(), text: text, maxResults: max });
    }

    search(query: chrome.history.HistoryQuery = { text: '' }): Promise<chrome.history.HistoryItem[]> {
        return new Promise<chrome.history.HistoryItem[]>((resolve) => {
            chrome.history.search(query, resolve);
        });
    }

    getVisits(details: chrome.history.Url): Promise<chrome.history.VisitItem[]> {
        return new Promise<chrome.history.VisitItem[]>((resolve) => {
            chrome.history.getVisits(details, resolve);
        });
    }
}