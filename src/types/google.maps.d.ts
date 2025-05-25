// google.maps.d.ts
declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions);
      getCenter(): LatLng;
      setCenter(latLng: LatLng | LatLngLiteral): void;
      getZoom(): number;
      setZoom(zoom: number): void;
      addListener(eventName: string, handler: (...args: unknown[]) => void): MapsEventListener;
      panTo(latLng: LatLng | LatLngLiteral): void;
      // Add other Map methods and properties as needed
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      zoomControl?: boolean;
      scrollwheel?: boolean;
      // Add other MapOptions properties as needed
    }

    class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
      // Add other LatLng methods and properties as needed
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface MapsEventListener {
      remove(): void;
    }

    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      // Add other Marker methods and properties as needed
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      icon?: string | Icon | Symbol;
      title?: string;
      // Add other MarkerOptions properties as needed
    }

    interface Icon {
      url: string;
      size?: Size;
      scaledSize?: Size;
      origin?: Point;
      anchor?: Point;
      // Add other Icon properties as needed
    }

    class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
      // Add other Point methods and properties as needed
    }

    class Size {
      constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
      width: number;
      height: number;
      // Add other Size methods and properties as needed
    }

    // Add other google.maps types and interfaces as needed (e.g., InfoWindow, Polygon, etc.)
  }
}
