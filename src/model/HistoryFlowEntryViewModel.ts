import IHistoryFlowEntry from '../database/model/IHistoryFlowEntry';

interface IScreenshot {
  url: string
}

export default class HistoryFlowViewModel {
  constructor(private entry: IHistoryFlowEntry, private _screenshot: IScreenshot) {
  }

  get title(): string {
    return this.entry.title;
  }

  get screenshot(): string {
    return this._screenshot.url;
  }

  get url(): string {
    return this.entry.url;
  }
}