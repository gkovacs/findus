root = modules ? this

userid = ''

generateUserId = () ->
  output = []
  hexletters = '0123456789abcdef'
  for i in [0..5]
    curLetter = hexletters[Math.floor(Math.random() * hexletters.length)]
    output.push curLetter
  return output.join('')

positionToLink = (latitude, longitude) ->
  nlink = $('<a>')
  nlink.text('(' + latitude + ',' + longitude + ')')
  nlink.attr('href', 'http://maps.google.com/maps?q=' + latitude + ',' + longitude)
  return nlink

updatedPositions = (userPositions) ->
  $('#friendGPSCoordinates').text('')
  numOtherUsers = 0
  for currentUserId of userPositions
    latitude = userPositions[currentUserId].latitude
    longitude = userPositions[currentUserId].longitude
    if currentUserId == userid
      $('#myGPSCoordinates').text('')
      $('#myGPSCoordinates').html(positionToLink(latitude, longitude))
    else
      $('#friendGPSCoordinates').append(positionToLink(latitude, longitude))
      $('#friendGPSCoordinates').append(' ')
      numOtherUsers += 1
  $('#numOtherUsers').text(numOtherUsers)

fitMapToPositions = (userPositions) ->
  bounds = new google.maps.LatLngBounds()
  for currentUserId of userPositions
    latitude = userPositions[currentUserId].latitude
    longitude = userPositions[currentUserId].longitude
    latlng = new google.maps.LatLng(latitude, longitude)
    bounds.extend(latlng)
  if googleMap?
    googleMap.fitBounds(bounds)

getMarkerIconForUser = (currentUserId) ->
  return 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + currentUserId.toUpperCase()

userToMarker = {}
userToLine = {}

placeMarkers = (userPositions) ->
  haveNewMarkers = false
  for currentUserId of userPositions
    latitude = userPositions[currentUserId].latitude
    longitude = userPositions[currentUserId].longitude
    latlng = new google.maps.LatLng(latitude, longitude)
    if not userToMarker[currentUserId]?
      haveNewMarkers = true
      markerParams = { 'position': latlng, 'optimized': false }
      if currentUserId == userid
        markerParams.title = 'This is your position'
        markerParams.icon = 'youarehere.png'
      else
        markerParams.title = "This is your friend's position"
        markerParams.icon = getMarkerIconForUser(currentUserId)
      marker = new google.maps.Marker(markerParams)
      marker.setMap(googleMap)
      userToMarker[currentUserId] = marker
    else
      userToMarker[currentUserId].setPosition(latlng)
      #userToMarker[currentUserId].setMap(googleMap)
  #if haveNewMarkers
  #  fitMapToPositions(userPositions)

placeLines = (userPositions) ->
  for currentUserId of userPositions
    if userid == currentUserId
      continue
    latitude = userPositions[currentUserId].latitude
    longitude = userPositions[currentUserId].longitude
    latlng = new google.maps.LatLng(latitude, longitude)
    lineCoordinates = [root.myLocation, latlng]
    if not userToLine[currentUserId]?
      lineSymbol = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: 4
      }
      nline = new google.maps.Polyline({
        path: lineCoordinates,
        strokeOpacity: 0,
        icons: [{
          icon: lineSymbol,
          offset: '0',
          repeat: '20px'
        }]
      })
      nline.setMap(googleMap)
      userToLine[currentUserId] = nline
    else
      userToLine[currentUserId].setPath(lineCoordinates)
      #userToLine[currentUserId].setMap(googleMap)

setMapFullscreen = () ->
  width = if window.innerWidth then window.innerWidth + 'px' else '100%'
  height = if window.innerHeight then window.innerHeight + 'px' else '100%'
  map_div = document.getElementById('map_canvas')
  map_div.style.width = width
  map_div.style.height = height

window.onresize = setMapFullscreen
root.usingHighAccuracy = true
root.currentTimeout = 20000

setPositionCookies = () ->
  geo_position_js.getCurrentPosition((position) ->
    latitude = position.coords.latitude
    longitude = position.coords.longitude
    $.cookie('latitude', latitude)
    $.cookie('longitude', longitude)
    setTimeout(setPositionCookies, 5000)
    setTimeout(updateCurrentPositions, 1000)
  , (error) ->
    if error.code == 3 and root.usingHighAccuracy
      root.usingHighAccuracy = false
    else if error.code == 3 and root.currentTimeout < 120000
      root.currentTimeout += 10000
    else
      $('#errors').append('error while getting location: ' + JSON.stringify(error))
    setTimeout(setPositionCookies, 5000)
    setTimeout(updateCurrentPositions, 1000)
  , {enableHighAccuracy: root.usingHighAccuracy, timeout: root.currentTimeout, maximumAge: 0})

root.myLocation = new google.maps.LatLng(42.3590995, -71.0934608)

initializeMapAroundOtherUser = (userPositions) ->
  for currentUserId of userPositions
    latitude = userPositions[currentUserId].latitude
    longitude = userPositions[currentUserId].longitude
    root.myLocation = new google.maps.LatLng(latitude, longitude)
    initializeMap()
    setMapFullScreen()
    return

updateCurrentPositionsNoGPS = () ->
  $.get('/getInfo?' + $.param({
    'pageid', pageid
  }), (data) ->
    allUsers = JSON.parse(data)
    initializeMapAroundOtherUser(allUsers)
    updatedPositions(allUsers)
    placeMarkers(allUsers)
  )

updateCurrentPositions = () ->
  root.latitude = latitude = $.cookie('latitude')
  root.longitude = longitude = $.cookie('longitude')
  if latitude? and longitude?
    root.myLocation = new google.maps.LatLng(latitude, longitude)
    initializeMap()
    setMapFullscreen()
  else
    updateCurrentPositionsNoGPS()
    return
  $.get('/sendInfo?' + $.param({
      'pageid': pageid,
      'userid': userid,
      'latitude': latitude,
      'longitude': longitude
    }), (data) ->
      allUsers = JSON.parse(data)
      updatedPositions(allUsers)
      #fitMapToPositions(allUsers)
      placeMarkers(allUsers)
      placeLines(allUsers)
  )

mapInitialized = false
googleMap = null

initializeMap = () ->
  if mapInitialized
    return
  mapInitialized = true
  mapOptions = {
    center: root.myLocation,
    zoom: 16,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  googleMap = new google.maps.Map(document.getElementById("map_canvas"), mapOptions)


$(document).ready(() ->
  document.body.addEventListener('touchstart', (e) -> e.preventDefault())
  userid = $.cookie('userid')
  if not userid?
    userid = generateUserId()
    $.cookie('userid', userid)
  if not geo_position_js.init()
    $('#errors').append('You must have Geolocation (ie, GPS on your phone) to use this service.')
  else
    #setInterval(setPositionCookies, 15000)
    updateCurrentPositions()
    setInterval(updateCurrentPositions, 10000)
    setPositionCookies()
)


