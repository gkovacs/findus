// Generated by IcedCoffeeScript 1.3.3f
(function() {
  var fitMapToPositions, generateUserId, getMarkerIconForUser, googleMap, initializeMap, mapInitialized, placeLines, placeMarkers, positionToLink, root, setPositionCookies, updateCurrentPositions, updatedPositions, userToLine, userToMarker, userid;

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

  userToLine = {};

  placeMarkers = function(userPositions) {
    var currentUserId, haveNewMarkers, latitude, latlng, longitude, marker, markerParams, _results;
    haveNewMarkers = false;
    _results = [];
    for (currentUserId in userPositions) {
      latitude = userPositions[currentUserId].latitude;
      longitude = userPositions[currentUserId].longitude;
      latlng = new google.maps.LatLng(latitude, longitude);
      if (!(userToMarker[currentUserId] != null)) {
        haveNewMarkers = true;
        markerParams = {
          'position': latlng,
          'optimized': false
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
        _results.push(userToMarker[currentUserId] = marker);
      } else {
        _results.push(userToMarker[currentUserId].setPosition(latlng));
      }
    }
    return _results;
  };

  placeLines = function(userPositions) {
    var currentUserId, latitude, latlng, lineCoordinates, lineSymbol, longitude, nline, _results;
    _results = [];
    for (currentUserId in userPositions) {
      if (userid === currentUserId) continue;
      latitude = userPositions[currentUserId].latitude;
      longitude = userPositions[currentUserId].longitude;
      latlng = new google.maps.LatLng(latitude, longitude);
      lineCoordinates = [root.myLocation, latlng];
      if (!(userToLine[currentUserId] != null)) {
        lineSymbol = {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          scale: 4
        };
        nline = new google.maps.Polyline({
          path: lineCoordinates,
          strokeOpacity: 0,
          icons: [
            {
              icon: lineSymbol,
              offset: '0',
              repeat: '20px'
            }
          ]
        });
        nline.setMap(googleMap);
        _results.push(userToLine[currentUserId] = nline);
      } else {
        _results.push(userToLine[currentUserId].setPath(lineCoordinates));
      }
    }
    return _results;
  };

  setPositionCookies = function() {
    return navigator.geolocation.getCurrentPosition(function(position) {
      var latitude, longitude;
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
      $.cookie('latitude', latitude);
      return $.cookie('longitude', longitude);
    }, function(error) {
      return $('#errors').text('error while getting location: ' + error);
    });
  };

  root.myLocation = new google.maps.LatLng(42.3590995, -71.0934608);

  updateCurrentPositions = function() {
    var latitude, longitude;
    root.latitude = latitude = $.cookie('latitude');
    root.longitude = longitude = $.cookie('longitude');
    if ((latitude != null) && (longitude != null)) {
      root.myLocation = new google.maps.LatLng(latitude, longitude);
      initializeMap();
    } else {
      return;
    }
    return $.get('/sendInfo?' + $.param({
      'pageid': pageid,
      'userid': userid,
      'latitude': latitude,
      'longitude': longitude
    }), function(data) {
      var allUsers;
      allUsers = JSON.parse(data);
      updatedPositions(allUsers);
      placeMarkers(allUsers);
      return placeLines(allUsers);
    });
  };

  mapInitialized = false;

  googleMap = null;

  initializeMap = function() {
    var mapOptions;
    if (mapInitialized) return;
    mapInitialized = true;
    mapOptions = {
      center: root.myLocation,
      zoom: 16,
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
      setInterval(setPositionCookies, 20000);
      setInterval(updateCurrentPositions, 5000);
      setPositionCookies();
      return updateCurrentPositions();
    }
  });

}).call(this);
