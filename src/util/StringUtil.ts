export default class StringUtil {
    static zeroPad(num: string, digits: number): string {
        let out = num;
        while (out.length < digits) {
            out = "0" + out;
        }
        return out;
    }
}