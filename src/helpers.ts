// create an array of numbers, from 0 to range
export function range(length: number) {
    return [...Array(length).keys()];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorString(e: any) {
    return (e && e.stack) || '' + e;
}

export function timeout<T>(ms: number, promise: Promise<T>): Promise<T> {
    return Promise.race<T>([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject('Timed out in ' + ms + 'ms.'), ms)),
    ]);
}

export function toNumber(val: number | string) {
    if (typeof val == 'string') {
        return parseInt(val);
    } else return val;
}

function byte(value: number, byteIdx: number) {
    const shift = byteIdx * 8;
    return (value & (0xff << shift)) >> shift;
}
export function getIpFromHex(ipStr: string): string {
    const ipBytes = Number(ipStr);
    return byte(ipBytes, 3) + '.' + byte(ipBytes, 2) + '.' + byte(ipBytes, 1) + '.' + byte(ipBytes, 0);
}