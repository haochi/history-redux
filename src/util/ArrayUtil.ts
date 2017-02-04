export default class ArrayUtil {
  static last<T>(array: T[]): T {
    return array[array.length - 1];
  }

  static first<T>([head]: T[]): T {
    return head;
  }

  static flatten<T>(array: T[][]): T[] {
    const initializer: T[] = [];
    return array.reduce((memo, me) => memo.concat(me), initializer);
  }
}