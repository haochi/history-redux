export default class TimerService {
    run<T>(name: string, fn: () => T): T {
        console.time(name);
        const result = fn();
        console.timeEnd(name);
        return result;
    }
}