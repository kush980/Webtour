/* eslint-disable */
// const locations = JSON.parse(document.getElementById('map').dataset.locations);
// //JSON.parse turns string back to JSON
// console.log(locations); moved to index.js

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiY2tvcm5oaXNlciIsImEiOiJja2k4MjRlbGIwMWpwMnNzNTZzNXhiN2UzIn0.wbQ2Zx6uBKNsVksB6cGzQQ';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ckornhiser/cki82lac500dq18mwznxhxv1k',
    scrollZoom: false,
    //   center: [-118.243683, 34.052235], //long then lat
    //   zoom: 10,
    //   interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();
  //The area that will be show on the map

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker'; //there is marker already done in css
    // Add marker
    new mapboxgl.Marker({
      elemenet: el,
      anchor: 'bottom', //makes the bottom of the pin point to the location
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    // Add popup
    new mapboxgl.Popup({
      offset: 50,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p> Day ${loc.day}:${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);

    map.fitBounds(bounds, {
      padding: {
        top: 200,
        bottom: 150,
        left: 100,
        right: 100,
      },
    });
  });
};
