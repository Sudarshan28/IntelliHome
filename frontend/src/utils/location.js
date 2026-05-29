export const getBrowserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (err) => {
        reject(err);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
};

export const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'IntelliHome-App'
      }
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      
      // Attempt to find a descriptive part of the location (like sector name or neighbourhood)
      // and combine it with the main city/town.
      const suburb = addr.suburb || addr.neighbourhood || addr.city_district || addr.subdivision || '';
      const city = addr.city || addr.town || addr.village || addr.county || '';
      
      let displayCity = city;
      if (suburb && city) {
        if (!suburb.toLowerCase().includes(city.toLowerCase()) && !city.toLowerCase().includes(suburb.toLowerCase())) {
          displayCity = `${city} ${suburb}`;
        } else {
          displayCity = suburb;
        }
      } else if (suburb) {
        displayCity = suburb;
      }
      
      return {
        city: displayCity || 'Unknown City',
        country: addr.country || 'India',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
  } catch (err) {
    console.error('Reverse geocoding failed:', err);
  }
  return null;
};
