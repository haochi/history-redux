import StringUtil from './StringUtil';

export default class CryptoUtil {
    static uuid4(): string {
        const words = 4;
        const bitsPerWord = 8;
        const hex = 0x10;
        const ints = new Uint32Array(words);
        crypto.getRandomValues(ints);

        const temp = ints.reduce((memo: string[], me) => {
            memo.push(StringUtil.zeroPad(me.toString(hex), bitsPerWord));
            return memo;
        }, []).join('');

        return temp.split('').map((c, i) => {
            if (i === 12) return '4';
            if (i === 16) return (this.getRandomNumber(2) + 8).toString(hex);
            return c;
        }).join('');
    }

    static getRandomNumber(bits: number): number {
        var ints = new Uint8Array(1);
        crypto.getRandomValues(ints);
        return ints[0] >> (8 - bits);
    }

}