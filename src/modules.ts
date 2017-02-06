import Injector, { Constructable } from './service/InjectorService';
import TabService from './service/TabService';
import HistoryFlowService from './service/HistoryFlowService';
import ScreenshotService from './service/ScreenshotService';
import StorageService from './service/StorageService';
import LoggingService from './service/LoggingService';
import DatabaseService from './service/DatabaseService';

const injector = new Injector();
function inject<T>(klass: Constructable<T>): T {
    return injector.inject(klass);
}

injector.bind(LoggingService);
injector.bind(StorageService);
injector.bind(DatabaseService);
injector.bindTo(TabService, new TabService(inject(LoggingService)));
injector.bindTo(ScreenshotService, new ScreenshotService(inject(TabService), inject(StorageService), inject(LoggingService)));
injector.bindTo(HistoryFlowService, new HistoryFlowService(inject(LoggingService), inject(DatabaseService), inject(ScreenshotService)));

export default injector;
export { inject };
