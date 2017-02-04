import Injector, { Constructable } from './service/InjectorService';
import TabService from './service/TabService';
import HistoryFlowService from './service/HistoryFlowService';
import ScreenshotService from './service/ScreenshotService';
import StorageService from './service/StorageService';
import LoggingService from './service/LoggingService';

const injector = new Injector();
function inject<T>(klass: Constructable<T>): T {
    return injector.inject(klass);
}

injector.bind(LoggingService);
injector.bind(StorageService);
injector.bindTo(TabService, new TabService(inject(LoggingService)));
injector.bindTo(HistoryFlowService, new HistoryFlowService(inject(LoggingService)));
injector.bindTo(ScreenshotService, new ScreenshotService(inject(TabService), inject(StorageService), inject(LoggingService)));

export default injector;
export { inject };
