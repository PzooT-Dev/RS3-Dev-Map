"use strict";

import "../../js/leaflet.js";
import "../../js/layers.js";
import "../../js/plugins/leaflet.fullscreen.js";
import "../../js/plugins/leaflet.mapSelector.js";
import "../../js/plugins/leaflet.zoom.js";
import "../../js/plugins/leaflet.plane.js";
import "../../js/plugins/leaflet.position.js";
import "../../js/plugins/leaflet.displays.js";
import "../../js/plugins/leaflet.urllayers.js";
import "../../js/plugins/leaflet.rect.js";
import "../../js/plugins/leaflet.clickcopy.js";
import "../../js/plugins/leaflet.maplabels.js";

import { Position } from './custom/model/Position.js';

// Import the controllers from the first code snippet
import { CollectionControl } from './custom/controls/collection_control.js';
import { CoordinatesControl } from './custom/controls/coordinates_control.js';
import { LocalCoordinatesControl } from './custom/controls/local_coordinates_control.js';
import { RegionBaseCoordinatesControl } from './custom/controls/region_base_coordinates_control.js';
import { GridControl } from './custom/controls/grid_control.js';
import { LocationLookupControl } from './custom/controls/location_lookup_control.js';
import { MapLabelControl } from './custom/controls/map_label_control.js';
import { PlaneControl } from './custom/controls/plane_control.js';
import { RegionLabelsControl } from './custom/controls/region_labels_control.js';
import { RegionLookupControl } from './custom/controls/region_lookup_control.js';
import { TitleLabel } from './custom/controls/title_label.js';
import { Region } from './custom/model/Region.js';

$(document).ready(function () {
    const currentUrl = new URL(window.location.href);
    const urlCentreX = currentUrl.searchParams.get("centreX");
    const urlCentreY = currentUrl.searchParams.get("centreY");
    const urlCentreZ = currentUrl.searchParams.get("centreZ");
    const urlZoom = currentUrl.searchParams.get("zoom");
    const urlRegionID = currentUrl.searchParams.get("regionID");

    console.log("Debugging Logs:");
    console.log("urlCentreX:", urlCentreX);
    console.log("urlCentreY:", urlCentreY);
    console.log("urlCentreZ:", urlCentreZ);
    console.log("urlZoom:", urlZoom);
    console.log("urlRegionID:", urlRegionID);

    var map = L.map('map', {
        zoomControl: false,
        renderer: L.canvas()
    });

    console.log("Initial map:", map);

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
    };

    console.log("Updating map path...");
    map.updateMapPath();
    map.getContainer().focus();

    // Add the controllers
    console.log("Adding controllers...");

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

    console.log("Controllers added:", map);

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

        console.log("Setting URL params...");
        window.history.replaceState(null, null, `?centreX=${centrePos.x}&centreY=${centrePos.y}&centreZ=${centrePos.z}&zoom=${zoom}`);
    };

    map.on('move', setUrlParams);
    map.on('zoom', setUrlParams);

    let zoom = 0;
    const center = new Position(Number(3200), Number(3200), Number(0));
    let centreLatLng = center.toLatLng(map);

    if (urlZoom) {
        zoom = urlZoom;
    }

    if (urlCentreX && urlCentreY && urlCentreZ) {
        const x = Number(urlCentreX) > Region.MAX_X ? Region.MAX_X : Number(urlCentreX) < Region.MIN_X ? Region.MIN_X : Number(urlCentreX);
        const y = Number(urlCentreY) > Region.MAX_Y ? Region.MAX_Y : Number(urlCentreY) < Region.MIN_Y ? Region.MIN_Y : Number(urlCentreY);
        const centrePos = new Position(x, y, Number(urlCentreZ));
        centreLatLng = centrePos.toLatLng(map);
    } else if (urlRegionID) {
        const region = new Region(Number(urlRegionID));
        const centrePos = region.toCentrePosition()
        centreLatLng = centrePos.toLatLng(map);
        zoom = urlZoom || 0;
    }

    console.log("Setting initial view...");
    map.setView(centreLatLng, zoom);
});
