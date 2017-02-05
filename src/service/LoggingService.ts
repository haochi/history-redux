import StringUtil from '../util/StringUtil';

export default class LoggingService {
    logCall(name: string, args: IArguments) {
        this.log(`${name}(${this.joinArgs(args)})`);
    }

    errorCall(name: string, message: any) {
        this.error(`${name}`, message);
    }

    log(message: string) {
        console.log(this.messageWithTime(message));
    }

    error(message: string, e: any) {
        console.error(this.messageWithTime(message), e);
    }

    joinArgs(args: IArguments) {
        return Array.from(args).join(', ');
    }

    private messageWithTime(message: string) {
        const time = this.getTimeFromDate(new Date);
        return `${time}: ${message}`;
    }

    private getTimeFromDate(date: Date) {
        return [date.getHours(), date.getMinutes(), date.getSeconds()].map(tick => StringUtil.zeroPad('' + tick, 2)).join(':');
    }
}