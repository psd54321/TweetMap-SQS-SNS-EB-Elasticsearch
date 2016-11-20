var map;
var markers = [];
var socket = io.connect();

function initMap() {

    //Initialize Map
    map = new google.maps.Map(document.getElementById('map'), {
        center: new google.maps.LatLng(0, 0),
        zoom: 2,
        mapTypeControl: false,
        zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_BOTTOM
        }
    });

    var styleControl = document.getElementById('style-selector-control');
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(styleControl);

    map.setOptions({
        styles: styles['silver']
    });

    var styleSelector = document.getElementById('style-selector');
    putMarkers(styleSelector.value, map);

    styleSelector.addEventListener('change', function () {
        putMarkers(styleSelector.value, map);
    });

    google.maps.event.addDomListener(window, "resize", function () {
        var center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
    });

    setInterval(function () {
        var combo = document.getElementById('style-selector');
        putMarkers(combo.value, map);
    }, 30000);
}

//To Do later
$(".widget-pane").focusout(function () {
    if ($(".widget-pane").hasClass("widget-pane-visible")) {
        $(".widget-pane").removeClass("widget-pane-visible");
        $(".widget-pane").addClass("widget-hide");
    }
});

//To do Later
function closeWidget() {
    $(".widget-pane").removeClass("widget-pane-visible");
    $(".widget-pane").addClass("widget-hide");
}



function putMarkers(searchterm, map) {
    clearOverlays();
    $.ajax({
        url: "/search/" + escape(searchterm),
        method: "GET",
        success: function (data) {
            var tweets = data.hits.hits;
            if (tweets.length > 0) {
                for (var i = 0; i < tweets.length; i++) {
                    marker = new google.maps.Marker({
                        map: map,
                        draggable: true,
                        animation: google.maps.Animation.DROP,
                        position: new google.maps.LatLng(tweets[i]._source.location.coordinates[0], tweets[i]._source.location.coordinates[1]),
                        icon: 'icons/location_icon.svg'
                    });

                    marker.info = new google.maps.InfoWindow({
                        content: "<div><h3>@" + tweets[i]._source.username + "</h3></div><p>" + tweets[i]._source.text + "</p>"
                    });

                    google.maps.event.addListener(marker, 'click', function () {
                        var marker_map = this.getMap();
                        this.info.open(marker_map, this);
                    });
                    markers.push(marker);
                }
            } else {
                alert('No results matched your search!!')
            }
        }
    });
}

function clearOverlays() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers.length = 0;
}

var styles = {
    default: null,
    silver: [
        {
            elementType: 'geometry',
            stylers: [{
                color: '#f5f5f5'
            }]
      },
        {
            elementType: 'labels.icon',
            stylers: [{
                visibility: 'off'
            }]
      },
        {
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#616161'
            }]
      },
        {
            elementType: 'labels.text.stroke',
            stylers: [{
                color: '#f5f5f5'
            }]
      },
        {
            featureType: 'administrative.land_parcel',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#bdbdbd'
            }]
      },
        {
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [{
                color: '#eeeeee'
            }]
      },
        {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#757575'
            }]
      },
        {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{
                color: '#e5e5e5'
            }]
      },
        {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#9e9e9e'
            }]
      },
        {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{
                color: '#ffffff'
            }]
      },
        {
            featureType: 'road.arterial',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#757575'
            }]
      },
        {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{
                color: '#dadada'
            }]
      },
        {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#616161'
            }]
      },
        {
            featureType: 'road.local',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#9e9e9e'
            }]
      },
        {
            featureType: 'transit.line',
            elementType: 'geometry',
            stylers: [{
                color: '#e5e5e5'
            }]
      },
        {
            featureType: 'transit.station',
            elementType: 'geometry',
            stylers: [{
                color: '#eeeeee'
            }]
      },
        {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{
                color: '#c9c9c9'
            }]
      },
        {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#9e9e9e'
            }]
      }
    ],

    night: [
        {
            elementType: 'geometry',
            stylers: [{
                color: '#242f3e'
            }]
        },
        {
            elementType: 'labels.text.stroke',
            stylers: [{
                color: '#242f3e'
            }]
        },
        {
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#746855'
            }]
        },
        {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#d59563'
            }]
      },
        {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#d59563'
            }]
      },
        {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{
                color: '#263c3f'
            }]
      },
        {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#6b9a76'
            }]
      },
        {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{
                color: '#38414e'
            }]
      },
        {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{
                color: '#212a37'
            }]
      },
        {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#9ca5b3'
            }]
      },
        {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{
                color: '#746855'
            }]
      },
        {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{
                color: '#1f2835'
            }]
      },
        {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#f3d19c'
            }]
      },
        {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{
                color: '#2f3948'
            }]
      },
        {
            featureType: 'transit.station',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#d59563'
            }]
      },
        {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{
                color: '#17263c'
            }]
      },
        {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#515c6d'
            }]
      },
        {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [{
                color: '#17263c'
            }]
      }
    ],

    retro: [
        {
            elementType: 'geometry',
            stylers: [{
                color: '#ebe3cd'
            }]
        },
        {
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#523735'
            }]
        },
        {
            elementType: 'labels.text.stroke',
            stylers: [{
                color: '#f5f1e6'
            }]
        },
        {
            featureType: 'administrative',
            elementType: 'geometry.stroke',
            stylers: [{
                color: '#c9b2a6'
            }]
      },
        {
            featureType: 'administrative.land_parcel',
            elementType: 'geometry.stroke',
            stylers: [{
                color: '#dcd2be'
            }]
      },
        {
            featureType: 'administrative.land_parcel',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#ae9e90'
            }]
      },
        {
            featureType: 'landscape.natural',
            elementType: 'geometry',
            stylers: [{
                color: '#dfd2ae'
            }]
      },
        {
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [{
                color: '#dfd2ae'
            }]
      },
        {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#93817c'
            }]
      },
        {
            featureType: 'poi.park',
            elementType: 'geometry.fill',
            stylers: [{
                color: '#a5b076'
            }]
      },
        {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#447530'
            }]
      },
        {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{
                color: '#f5f1e6'
            }]
      },
        {
            featureType: 'road.arterial',
            elementType: 'geometry',
            stylers: [{
                color: '#fdfcf8'
            }]
      },
        {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{
                color: '#f8c967'
            }]
      },
        {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{
                color: '#e9bc62'
            }]
      },
        {
            featureType: 'road.highway.controlled_access',
            elementType: 'geometry',
            stylers: [{
                color: '#e98d58'
            }]
      },
        {
            featureType: 'road.highway.controlled_access',
            elementType: 'geometry.stroke',
            stylers: [{
                color: '#db8555'
            }]
      },
        {
            featureType: 'road.local',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#806b63'
            }]
      },
        {
            featureType: 'transit.line',
            elementType: 'geometry',
            stylers: [{
                color: '#dfd2ae'
            }]
      },
        {
            featureType: 'transit.line',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#8f7d77'
            }]
      },
        {
            featureType: 'transit.line',
            elementType: 'labels.text.stroke',
            stylers: [{
                color: '#ebe3cd'
            }]
      },
        {
            featureType: 'transit.station',
            elementType: 'geometry',
            stylers: [{
                color: '#dfd2ae'
            }]
      },
        {
            featureType: 'water',
            elementType: 'geometry.fill',
            stylers: [{
                color: '#b9d3c2'
            }]
      },
        {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{
                color: '#92998d'
            }]
      }
    ],

    hiding: [
        {
            featureType: 'poi.business',
            stylers: [{
                visibility: 'off'
            }]
      },
        {
            featureType: 'transit',
            elementType: 'labels.icon',
            stylers: [{
                visibility: 'off'
            }]
      }
    ]
};
