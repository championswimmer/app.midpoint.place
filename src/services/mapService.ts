export const GOOGLE_MAPS_API_KEY = 'AIzaSyDBVQaCwZ0f-AzA83juyqesLZlj72jWdYE' // TODO: Replace with your actual API key

// TODO: Implement map related functions here, e.g.:
// - initMap
// - getBrowserLocation
// - addMarker
// - getMapCenterLatLng

// Example structure:
/*
export function initMap(mapElement: HTMLElement, options: google.maps.MapOptions): google.maps.Map {
  if (!window.google || !window.google.maps) {
    throw new Error('Google Maps API not loaded.')
  }
  return new window.google.maps.Map(mapElement, options)
}

export async function getBrowserLocation(): Promise<GeolocationCoordinates | null> {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(position.coords)
        },
        () => {
          resolve(null) // Permission denied or error
        }
      )
    } else {
      resolve(null) // Geolocation not supported
    }
  })
}
*/

export const loadGoogleMapsScript = () => {
  if (document.getElementById('google-maps-script')) {
    return // Script already loaded or loading
  }

  const script = document.createElement('script')
  script.id = 'google-maps-script'
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places` // Added 'places' library for potential future use
  script.async = true
  script.defer = true
  document.head.appendChild(script)

  return new Promise<void>((resolve, reject) => {
    script.onload = () => resolve()
    script.onerror = (error) => reject(error)
  })
}

export async function getBrowserLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          console.warn('Error getting browser location:', error.message)
          resolve(null) // Permission denied or error
        }
      )
    } else {
      resolve(null) // Geolocation not supported
    }
  })
}
