export interface Constructable<T> {
    new (...args): T;
    prototype: T
}

export default class Injector {
    private bindMap = new Map<any, any>();

    bind<T>(klass: Constructable<T>) {
        this.bindMap.set(klass, new klass);
    }

    bindTo<T>(klass: Constructable<T>, instance: T) {
        this.bindMap.set(klass, instance);
    }

    inject<T>(klass: Constructable<T>): T {
        return this.bindMap.get(klass);
    }
}