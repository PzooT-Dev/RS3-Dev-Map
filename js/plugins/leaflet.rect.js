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
            this.options.owner.startRectangleCreation(this._latlng);
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
            this.vertices.forEach(v => v.addTo(map));

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
            this.creatingRectangle = true;
            this._initialLatLng = initialLatLng;
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
            this.rect = L.draggableSquare([[3232, 3200], [3200, 3232]], {
                owner: this
            });
            return L.Control.Display.prototype.onAdd.call(this, map);
        },

        startRectangleCreation: function (initialLatLng) {
            this.rect.startRectangleCreation(initialLatLng);
        },

        // ... other methods remain unchanged
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
