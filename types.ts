
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  id: number;
  name: string;
  address: string;
  coordinates: Coordinates;
}

export interface LocationWithDistance extends Location {
  distance: number;
}
