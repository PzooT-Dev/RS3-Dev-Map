'use strict';

import { Position } from './model/Position.js';

// Import controls
import { CollectionControl } from './controls/collection_control.js';
import { CoordinatesControl } from './controls/coordinates_control.js';
import { LocalCoordinatesControl } from './controls/local_coordinates_control.js';
import { RegionBaseCoordinatesControl } from './controls/region_base_coordinates_control.js';
import { GridControl } from './controls/grid_control.js';
import { LocationLookupControl } from './controls/location_lookup_control.js';
import { MapLabelControl } from './controls/map_label_control.js';
import { PlaneControl } from './controls/plane_control.js';
import { RegionLabelsControl } from './controls/region_labels_control.js';
import { RegionLookupControl } from './controls/region_lookup_control.js';
import { TitleLabel } from './controls/title_label.js';
import { Region } from './model/Region.js';
import {REGION_WIDTH, REGION_HEIGHT,
        MIN_X, MAX_X,
        MIN_Y, MAX_Y} from './model/Region.js';
		
$(document).ready(function () {

    const currentUrl = new URL(window.location.href);

    const urlCentreX = currentUrl.searchParams.get("centreX");
    const urlCentreY = currentUrl.searchParams.get("centreY");
    const urlCentreZ = currentUrl.searchParams.get("centreZ");
    const urlZoom = currentUrl.searchParams.get("zoom");

    const urlRegionID = currentUrl.searchParams.get("regionID");

    var map = L.map('map', {
        //maxBounds: L.latLngBounds(L.latLng(-40, -180), L.latLng(85, 153))
        zoomControl: false,
        renderer: L.canvas()
    });

    map.plane = 0;

    map.updateMapPath = function () {
        if (map.tile_layer !== undefined) {
            map.removeLayer(map.tile_layer);
        }
        map.tile_layer = L.tileLayer('https://raw.githubusercontent.com/mejrs/layers_rs3/cb4b7dd75787c52cd635178b15ee5e44f17e42f9/mapsquares/-1/' + map.plane + '/{z}_{x}_{y}.png', {
	    minZoom: -4,
	    maxNativeZoom: 3,
            maxZoom: 5,
            attribution: 'Map data',
            noWrap: true,
            tms: true
        });
        map.tile_layer.addTo(map);
        map.invalidateSize();
    }

    map.updateMapPath();
    map.getContainer().focus();

    map.addControl(new TitleLabel());
    map.addControl(new CoordinatesControl());
    map.addControl(new RegionBaseCoordinatesControl());
    map.addControl(new LocalCoordinatesControl());
    map.addControl(L.control.zoom());
    map.addControl(new PlaneControl());
    map.addControl(new LocationLookupControl());
    map.addControl(new MapLabelControl());
    map.addControl(new CollectionControl({ position: 'topright' }));
    map.addControl(new RegionLookupControl());
    map.addControl(new GridControl());
    map.addControl(new RegionLabelsControl());

    var prevMouseRect, prevMousePos;
    map.on('mousemove', function (e) {
        var mousePos = Position.fromLatLng(map, e.latlng, map.plane);

        if (prevMousePos !== mousePos) {

            prevMousePos = mousePos;

            if (prevMouseRect !== undefined) {
                map.removeLayer(prevMouseRect);
            }

            prevMouseRect = mousePos.toLeaflet(map);
            prevMouseRect.addTo(map);
        }
    });

    const setUrlParams = () => {
        const mapCentre = map.getBounds().getCenter()
        const centrePos = Position.fromLatLng(map, mapCentre, map.plane);

        const zoom = map.getZoom();

        window.history.replaceState(null, null, `?centreX=${centrePos.x}&centreY=${centrePos.y}&centreZ=${centrePos.z}&zoom=${zoom}`);
    };

    map.on('move', setUrlParams);
    map.on('zoom', setUrlParams);

    let zoom = 0;
	const center = new Position(Number(3200), Number(3200), Number(0));
    let centreLatLng = center.toLatLng(map)

    if (urlZoom) {
        zoom = urlZoom;
    }

    if (urlCentreX && urlCentreY && urlCentreZ) {
		const x = Number(urlCentreX) > MAX_X ? MAX_X : Number(urlCentreX) < MIN_X ? MIN_X : Number(urlCentreX);
        const y = Number(urlCentreY) > MAX_Y ? MAX_Y : Number(urlCentreY) < MIN_Y ? MIN_Y : Number(urlCentreY);
        const centrePos = new Position(x, y, Number(urlCentreZ));
        centreLatLng = centrePos.toLatLng(map);
    } else if (urlRegionID) {
        const region = new Region(Number(urlRegionID));
        const centrePos = region.toCentrePosition()
        centreLatLng = centrePos.toLatLng(map);
        zoom = urlZoom || 0;
    }

    map.setView(centreLatLng, zoom)
});
