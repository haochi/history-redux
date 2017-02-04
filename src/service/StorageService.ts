export default class StorageService {
    set(items: Object): Promise<void> {
        return new Promise<void>((resolve) => {
            chrome.storage.local.set(items, resolve);
        });
    }

    get(keys: string | string[] | Object): Promise<Object> {
        return new Promise<Object>((resolve) => {
            chrome.storage.local.get(keys, resolve);
        });
    }
}