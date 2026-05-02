export type CourierLocationPoint = {
  lat: number;
  lng: number;
  updatedAt: number;
};

const cache = new Map<string, CourierLocationPoint>();

export function setCourierLocationMemory(
  courierId: string,
  point: CourierLocationPoint
): void {
  cache.set(courierId, point);
}

export function getCourierLocationMemory(
  courierId: string
): CourierLocationPoint | undefined {
  return cache.get(courierId);
}
