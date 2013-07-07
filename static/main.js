// Generated by IcedCoffeeScript 1.3.3f
(function() {
  var fitMapToPositions, generateUserId, getMarkerIconForUser, googleMap, initializeMap, mapInitialized, placeMarkers, positionToLink, root, updateCurrentPositions, updatedPositions, userToMarker, userid;

  root = typeof modules !== "undefined" && modules !== null ? modules : this;

  userid = '';

  generateUserId = function() {
    var curLetter, hexletters, i, output, _i;
    output = [];
    hexletters = '0123456789abcdef';
    for (i = _i = 0; _i <= 5; i = ++_i) {
      curLetter = hexletters[Math.floor(Math.random() * hexletters.length)];
      output.push(curLetter);
    }
    return output.join('');
  };

  positionToLink = function(latitude, longitude) {
    var nlink;
    nlink = $('<a>');
    nlink.text('(' + latitude + ',' + longitude + ')');
    nlink.attr('href', 'http://maps.google.com/maps?q=' + latitude + ',' + longitude);
    return nlink;
  };

  updatedPositions = function(userPositions) {
    var currentUserId, latitude, longitude, numOtherUsers;
    $('#friendGPSCoordinates').text('');
    numOtherUsers = 0;
    for (currentUserId in userPositions) {
      latitude = userPositions[currentUserId].latitude;
      longitude = userPositions[currentUserId].longitude;
      if (currentUserId === userid) {
        $('#myGPSCoordinates').text('');
        $('#myGPSCoordinates').html(positionToLink(latitude, longitude));
      } else {
        $('#friendGPSCoordinates').append(positionToLink(latitude, longitude));
        $('#friendGPSCoordinates').append(' ');
        numOtherUsers += 1;
      }
    }
    return $('#numOtherUsers').text(numOtherUsers);
  };

  fitMapToPositions = function(userPositions) {
    var bounds, currentUserId, latitude, latlng, longitude;
    bounds = new google.maps.LatLngBounds();
    for (currentUserId in userPositions) {
      latitude = userPositions[currentUserId].latitude;
      longitude = userPositions[currentUserId].longitude;
      latlng = new google.maps.LatLng(latitude, longitude);
      bounds.extend(latlng);
    }
    if (typeof googleMap !== "undefined" && googleMap !== null) {
      return googleMap.fitBounds(bounds);
    }
  };

  getMarkerIconForUser = function(currentUserId) {
    return 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + currentUserId.toUpperCase();
  };

  userToMarker = {};

  placeMarkers = function(userPositions) {
    var currentUserId, haveNewMarkers, latitude, latlng, longitude, marker, markerParams;
    haveNewMarkers = false;
    for (currentUserId in userPositions) {
      latitude = userPositions[currentUserId].latitude;
      longitude = userPositions[currentUserId].longitude;
      latlng = new google.maps.LatLng(latitude, longitude);
      if (!(userToMarker[currentUserId] != null)) {
        haveNewMarkers = true;
        markerParams = {
          'position': latlng
        };
        if (currentUserId === userid) {
          markerParams.title = 'This is your position';
          markerParams.icon = 'youarehere.png';
        } else {
          markerParams.title = "This is your friend's position";
          markerParams.icon = getMarkerIconForUser(currentUserId);
        }
        marker = new google.maps.Marker(markerParams);
        marker.setMap(googleMap);
        userToMarker[currentUserId] = marker;
      } else {
        userToMarker[currentUserId].setPosition(latlng);
      }
    }
    if (haveNewMarkers) return fitMapToPositions(userPositions);
  };

  updateCurrentPositions = function(position) {
    var latitude, longitude;
    initializeMap();
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    return $.get('/sendInfo?' + $.param({
      'pageid': pageid,
      'userid': userid,
      'latitude': latitude,
      'longitude': longitude
    }), function(data) {
      var allUsers;
      allUsers = JSON.parse(data);
      updatedPositions(allUsers);
      return placeMarkers(allUsers);
    });
  };

  mapInitialized = false;

  googleMap = null;

  initializeMap = function() {
    var mapOptions;
    if (mapInitialized) return;
    mapInitialized = true;
    mapOptions = {
      center: new google.maps.LatLng(42.3590995, -71.0934608),
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    return googleMap = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
  };

  $(document).ready(function() {
    userid = $.cookie('userid');
    if (!(userid != null)) {
      userid = generateUserId();
      $.cookie('userid', userid);
    }
    if (!(navigator.geolocation != null)) {
      return $('#errors').text('You must have Geolocation (ie, GPS on your phone) to use this service.');
    } else {
      setInterval(function() {
        return navigator.geolocation.getCurrentPosition(updateCurrentPositions);
      }, 5000);
      return navigator.geolocation.getCurrentPosition(updateCurrentPositions);
    }
  });

}).call(this);
