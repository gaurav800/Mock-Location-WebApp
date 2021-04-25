
function myMap() {

//Hiding the journey completed element
  $(".journeyCompleted").hide();

  //INSERT API KEY AS A STRING
  var apiKey = "API_KEY";
;

//Initialising all the variables and objects
  var directionsService = new google.maps.DirectionsService();
  var lineSymbol = {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 5,
    strokeColor: '#0d6efd',
    strokeWidth: '#0d6efd'
  };

  var speed = 40;
  var distance = 0;
  var duration = 0;
  var map;
  var pushed = 0;
  var startValue = 0;
  var destinationValue = 0;
  var start = "";
  var destination = "";
  var legCoordinates = [];
  var polylines = [];
  var snappedCoordinates = [];

  alert("Click on the map to initilize Start and End points");


  //Map Options and Initialisingthe map
  var options = {
    center: new google.maps.LatLng(38.9096, -77.0136),
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

//Setting up the Map
  var map = new google.maps.Map(document.getElementById("googleMap"), options);


//Waiting for user input to add 2 markers
  google.maps.event.addListener(map, 'click', function(event) {
    placeMarker(event.latLng);
  });


//Event Listener on the Start Route button
  $("button").on("click", function(event) {
    if (start === "" || destination === "") {
      alert("Enter 2 points");
    } else {
      if($("#speed").val()){
        speed = $("#speed").val();
    }
    $(".speedDisplay span").text(speed + "km/hr");
    $(".speedInputs").hide();
      getPoints();
    }
  });


//Placing start and end points on the map
  function placeMarker(location) {
    if (startValue === 0) {
      start = location.toJSON();
      $("#startCoordinates").text("Latitude: " + start.lat.toFixed(4) + "  Longitude: " + start.lng.toFixed(4));
      var marker = new google.maps.Marker({
        position: location,
        map: map,
      });
      map.panTo(location)
      startValue = 1;

    } else {
      if (destinationValue === 0) {
        destination = location.toJSON();
        $("#endCordinates").text("Latitude: " + destination.lat.toFixed(4) + "  Longitude: " + destination.lng.toFixed(4))
        var marker = new google.maps.Marker({
          position: location,
          map: map,
        });
        map.panTo(location)
        destinationValue = 1;
        makeRoute(start, destination);
      }
    }
  }


//Getting the coordinates of the route
  function makeRoute(originAddress, destinationAddress) {
    request = {
      origin: originAddress,
      destination: destinationAddress,
      travelMode: google.maps.TravelMode.DRIVING,
    }
    directionsService.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        response.routes.forEach(route => {
          route.legs.forEach(leg => {
            leg.steps.forEach(step => {
              if (pushed === 0) {
                legCoordinates.push(step.start_location);
                pushed = 1;
              }
              legCoordinates.push(step.end_location);
            });
          });
        });
      };
    });
    getDistance();
  }

//Function to get the real time distance and duration to cover the distance
  function getDistance() {
    var distanceService = new google.maps.DistanceMatrixService();
    distanceService.getDistanceMatrix({
        origins: [start],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      function(response, status) {
        if (status !== google.maps.DistanceMatrixStatus.OK) {
          console.log('Error:', status);
        } else {
          distance = response.rows[0].elements[0].distance.text;
          $(".totalDistance span").text(distance);
          duration = response.rows[0].elements[0].duration.text;
          $(".totalTime span").text(duration);
        }
      });
  }


//Function to get snapped points
  function getPoints() {
    legCoordinates = legCoordinates.join('|');
    legCoordinates = legCoordinates.replace(/[()]/g, '');
    $.get('https://roads.googleapis.com/v1/snapToRoads', {
      interpolate: true,
      key: apiKey,
      path: legCoordinates
    }, function(data) {
      processSnapToRoadResponse(data);
      drawSnappedPolyline(snappedCoordinates);
    });
  }


//Function to process the snapped Points
  function processSnapToRoadResponse(data) {
    snappedCoordinates = [];
    for (var i = 0; i < data.snappedPoints.length; i++) {
      var latlng = new google.maps.LatLng(
        data.snappedPoints[i].location.latitude,
        data.snappedPoints[i].location.longitude);
      snappedCoordinates.push(latlng);
    }
  }


  // Draws the snapped polyline on the map
  function drawSnappedPolyline(snappedCoordinates) {
    var snappedPolyline = new google.maps.Polyline({
      path: snappedCoordinates,
      strokeColor: '#687980',
      strokeWeight: 4,
      strokeOpacity: 0.9,
    });
    snappedPolyline.setMap(map);
    animateCircle(snappedPolyline);
    polylines.push(snappedPolyline);
  }


//Function to animate the marker across the line
  function animateCircle(polyline) {
    $(".journeyCompleted").show()
    var count = 0;
    var distanceInMetres = (distance.split(" ")[0]) * 1000;
    var metricSpeed = speed * 5 / 18;
    var time = distanceInMetres / metricSpeed;
    var factor = (100 / time) / 10;
    var defaultIcon = [{
      icon: lineSymbol,
      offset: '0%'
    }];
    var icons = defaultIcon;
    polyline.set('icons', icons);
    var animation = setInterval(function() {
      if (count <= 100) {
        $(".journeyCompleted span").text(Math.round(count)+"%");
        count = count + factor;
        icons[0].offset = count + '%';
        polyline.set('icons', icons);
      }
      else {
        $(".journeyCompleted span").text("100%")
        icons[0].offset = 100 + '%';
        polyline.set('icons', icons);
        alert("Destination Arrived");
        clearInterval(animation);
      }
    }, 100);
  }












}
