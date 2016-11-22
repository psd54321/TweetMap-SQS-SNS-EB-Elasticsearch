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
    }, 300000);
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

socket.on('tweet', function (data) {
    console.log(data);
    var combo = document.getElementById('style-selector');

    if (combo.value == data.topic) {
        console.log('inside');
        var location = data['location'];
        console.log(location);
        console.log(location['coordinates']);
        marker = new google.maps.Marker({
            map: map,
            draggable: true,
            animation: google.maps.Animation.DROP,
            position: new google.maps.LatLng(location['coordinates'][0], location['coordinates'][1])
        });

        switch (data.sentiment) {
            case "neutral":
                marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png')
                break;
            case "positive":
                marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png')
                break;
            case "negative":
                marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')
                break;
            default:
                marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png')
        }
        marker.info = new google.maps.InfoWindow({
            content: "<div><h3>@" + data.username + "</h3></div><p>" + data.text + "</p><p> Sentiment Score : " + data.sentiscore + "</p>"
        });

        google.maps.event.addListener(marker, 'click', function () {
            var marker_map = this.getMap();
            this.info.open(marker_map, this);
        });
        markers.push(marker);
    }
});

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
                        position: new google.maps.LatLng(tweets[i]._source.location.coordinates[0], tweets[i]._source.location.coordinates[1])
                    });

                    switch (tweets[i]._source.sentiment) {
                        case "neutral":
                            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png')
                            break;
                        case "positive":
                            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png')
                            break;
                        case "negative":
                            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')
                            break;
                        default:
                            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png')
                    }
                    marker.info = new google.maps.InfoWindow({
                        content: "<div><h3>@" + tweets[i]._source.username + "</h3></div><p>" + tweets[i]._source.text + "</p><p> Sentiment Score : " + tweets[i]._source.sentiscore + "</p>"
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
    ]

};
