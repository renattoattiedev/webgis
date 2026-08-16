declare module 'mgrs' {
  export function forward(
    coordinate: [number, number],
    accuracy?: number
  ): string;
  export function toPoint(mgrsString: string): [number, number];
}
