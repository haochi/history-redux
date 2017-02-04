import StringUtil from '../util/StringUtil';

export default class LoggingService {
    logCall(name: string, args: IArguments) {
        const time = this.getTimeFromDate(new Date);
        console.log(`${time}: ${name}(${Array.from(args).join(', ')})`);
    }

    private getTimeFromDate(date: Date) {
        return [date.getHours(), date.getMinutes(), date.getSeconds()].map(tick => StringUtil.zeroPad('' + tick, 2)).join(':');
    }
}