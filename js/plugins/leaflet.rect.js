import "../leaflet.js";
import "./leaflet.displays.js";

export default void function (factory) {
    var L;
    if (typeof define === "function" && define.amd) {
        define(["leaflet"], factory);
    } else if (typeof module !== "undefined") {
        L = require("leaflet");
        module.exports = factory(L);
    } else {
        if (typeof window.L === "undefined") {
            throw new Error("Leaflet must be loaded first");
        }
        factory(window.L);
    }
}(function (L) {

    let VertexIcon = L.DivIcon.extend({
        options: {
            iconSize: new L.Point(8, 8)
        }
    });

    let Vertex = L.Marker.extend({
        initialize: function (latlng, owner) {
            L.Util.setOptions(this, {
                icon: new VertexIcon,
                owner: owner
            });
            this._latlng = L.latLng(latlng);
            this.on("mousedown", this.onMouseDown, this);
        },

        onMouseDown: function (e) {
            if (!this.creatingRectangle) {
                this.startRectangleCreation(this._latlng);
                this.creatingRectangle = true;
            } else {
                this.creatingRectangle = false;
                this.options.owner.update(this.getBounds());
                console.log('onMouseUp: ', this.getBounds().toBBoxString());
            }
            e.originalEvent.preventDefault();
            },
    });

    L.DraggableSquare = L.Rectangle.extend({
        creatingRectangle: false,

        initialize: function (latLngBounds, options) {
            let bounds = L.latLngBounds(latLngBounds);
            this.vertices = [bounds.getSouthWest(), bounds.getNorthWest(), bounds.getNorthEast(), bounds.getSouthEast()].map(this.createVertex.bind(this));
            return L.Rectangle.prototype.initialize.call(this, bounds, options);
        },

        onAdd: function (map) {
            // Commented out the following line to prevent creating the initial rectangle.
            // this.vertices.forEach(v => v.addTo(map));

            L.Rectangle.prototype.onAdd.call(this, map);
            this.options.owner.update(this.getBounds());
            this.on('mousedown', this.onMouseDown, this);
            map.on('mousemove', this.onMouseMove, this);
            map.on('mouseup', this.onMouseUp, this);
        },

        createVertex: function (latlng) {
            return new Vertex(latlng, this);
        },

        startRectangleCreation: function (initialLatLng) {
            if (this.rect) {
                this.rect.remove();
            }
            this.rect = L.draggableSquare([[initialLatLng.lat, initialLatLng.lng], [initialLatLng.lat, initialLatLng.lng]], { owner: this });
            this.rect.startRectangleCreation(initialLatLng);
            this.rect.addTo(this._map);
        },

        onMouseMove: function (e) {
            if (this.creatingRectangle) {
                let newBounds = L.latLngBounds([this._initialLatLng, e.latlng]);
                this.setBounds(newBounds);
                console.log('onMouseMove: ', newBounds.toBBoxString());
            }
        },

        onMouseUp: function () {
            if (this.creatingRectangle) {
                this.creatingRectangle = false;
                this.options.owner.update(this.getBounds());
                console.log('onMouseUp: ', this.getBounds().toBBoxString());
            }
        },

        setBounds: function (bounds) {
            let positions = [bounds.getSouthWest(), bounds.getNorthWest(), bounds.getNorthEast(), bounds.getSouthEast()]
            this.vertices.forEach((v, i) => v.setLatLng(positions[i]));
            bounds = L.latLngBounds(this.vertices.map(v => v.getLatLng()));
            L.Rectangle.prototype.setBounds.call(this, bounds);
        },

        remove: function () {
            this.vertices.forEach(v => v.remove());
            return L.Rectangle.prototype.remove.call(this);
        }
    });

    L.draggableSquare = function (bounds, options) {
        return new L.DraggableSquare(bounds, options);
    };

    L.Control.Display.Rect = L.Control.Display.extend({
        onAdd: function (map) {
            // Commented out the following line to prevent creating the initial rectangle.
            // this.rect = L.draggableSquare([[3232, 3200], [3200, 3232]], { owner: this });
            return L.Control.Display.prototype.onAdd.call(this, map);
        },

        options: {
            position: 'bottomleft',
            title: 'Dimensions:',
            icon: 'images/Blue_square_(Prisoner_of_Glouphrie).png'
        },

        startRectangleCreation: function (initialLatLng) {
            if (this.rect) {
                this.rect.remove();
            }
            this.rect = L.draggableSquare([[initialLatLng.lat, initialLatLng.lng], [initialLatLng.lat, initialLatLng.lng]], { owner: this });
            this.rect.startRectangleCreation(initialLatLng);
            this.rect.addTo(this._map);
        },

        createInterface: function () {
            let container = L.DomUtil.create('div', 'leaflet-control-display-expanded');
            let rectForm = L.DomUtil.create('form', 'leaflet-control-display-form', container);

            let widthLabel = L.DomUtil.create('label', 'leaflet-control-display-label', rectForm);
            widthLabel.innerHTML = "Width";
            this.width = L.DomUtil.create('input', 'leaflet-control-display-input-number', rectForm);
            this.width.setAttribute('type', 'number');
            this.width.setAttribute('name', 'width');

            let heightLabel = L.DomUtil.create('label', 'leaflet-control-display-label', rectForm);
            heightLabel.innerHTML = "Height";
            this.height = L.DomUtil.create('input', 'leaflet-control-display-input-number', rectForm);
            this.height.setAttribute('type', 'number');
            this.height.setAttribute('name', 'height');

            let areaLabel = L.DomUtil.create('label', 'leaflet-control-display-label', rectForm);
            areaLabel.innerHTML = "Area";
            this.area = L.DomUtil.create('input', 'leaflet-control-display-input-number', rectForm);
            this.area.setAttribute('type', 'number');
            this.area.setAttribute('name', 'area');
            this.area.setAttribute('readonly', true);

            let westLabel = L.DomUtil.create('label', 'leaflet-control-display-label', rectForm);
            westLabel.innerHTML = "West";
            this.west = L.DomUtil.create('input', 'leaflet-control-display-input-number', rectForm);
            this.west.setAttribute('type', 'number');
            this.west.setAttribute('name', 'west');

            let eastLabel = L.DomUtil.create('label', 'leaflet-control-display-label', rectForm);
            eastLabel.innerHTML = "East";
            this.east = L.DomUtil.create('input', 'leaflet-control-display-input-number', rectForm);
            this.east.setAttribute('type', 'number');
            this.east.setAttribute('name', 'east');

            let northLabel = L.DomUtil.create('label', 'leaflet-control-display-label', rectForm);
            northLabel.innerHTML = "North";
            this.north = L.DomUtil.create('input', 'leaflet-control-display-input-number', rectForm);
            this.north.setAttribute('type', 'number');
            this.north.setAttribute('name', 'north');

            let southLabel = L.DomUtil.create('label', 'leaflet-control-display-label', rectForm);
            southLabel.innerHTML = "South";
            this.south = L.DomUtil.create('input', 'leaflet-control-display-input-number', rectForm);
            this.south.setAttribute('type', 'number');
            this.south.setAttribute('name', 'south');

            let centerLabel = L.DomUtil.create('label', 'leaflet-control-display-label', rectForm);
            centerLabel.innerHTML = "Center";
            this.center = L.DomUtil.create('input', 'leaflet-control-display-input-number', rectForm);
            this.center.setAttribute('type', 'text');
            this.center.setAttribute('name', 'center');
            this.center.setAttribute('readOnly', true);

            rectForm.addEventListener("change", this.changeRect.bind(this));

            return container;
        },

        changeRect: function (e) {
            let [width, height, _, west, east, north, south] = Array.from(e.srcElement.parentElement.children).filter(elem => elem.nodeName == "INPUT").map(elem => elem.value);
            if (["width", "height"].includes(e.srcElement.name)) {
                east = Number(west) + Number(width);
                north = Number(south) + Number(height);
            }
            let bounds = L.latLngBounds([[south, west], [north, east]]);
            this.rect.setBounds(bounds);
            this.update(bounds);
        },

        update: function (bounds) {
            // update control content
            let west = bounds.getWest();
            let east = bounds.getEast();
            let north = bounds.getNorth();
            let south = bounds.getSouth();
            let width = east - west;
            let height = north - south;
            let center_width = (west + east) / 2;
            let center_height = (north + south) / 2;

            this.width.value = width;
            this.height.value = height;
            this.area.value = height * width;
            this.west.value = west;
            this.east.value = east;
            this.north.value = north;
            this.south.value = south;
            this.center.value = `${center_width}, ${center_height}`;
        },

        expand: function () {
            // Commented out the following lines to prevent creating the initial rectangle.
            // let bounds = this._map.getBounds().pad(-0.3);
            // this.rect.setBounds(bounds);
            // this.rect.addTo(this._map);
            return L.Control.Display.prototype.expand.call(this);
        },

        collapse: function () {
            this.rect.remove();
            return L.Control.Display.prototype.collapse.call(this);
        },
    });

    L.control.display.rect = function (options) {
        return new L.Control.Display.Rect(options);
    }

    L.Map.addInitHook(function () {
        if (this.options.rect) {
            this.rect = L.control.display.rect();
            this.addControl(this.rect);
        }
    });
});
