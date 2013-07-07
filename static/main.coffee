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

placeMarkers = (userPositions) ->
  haveNewMarkers = false
  for currentUserId of userPositions
    latitude = userPositions[currentUserId].latitude
    longitude = userPositions[currentUserId].longitude
    latlng = new google.maps.LatLng(latitude, longitude)
    if not userToMarker[currentUserId]?
      haveNewMarkers = true
      markerParams = { 'position': latlng }
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
  if haveNewMarkers
    fitMapToPositions(userPositions)

updateCurrentPositions = (position) ->
  initializeMap()
  latitude = position.coords.latitude
  longitude = position.coords.longitude
  $.get('/sendInfo?' + $.param(
      'pageid': pageid,
      'userid': userid,
      'latitude': latitude,
      'longitude': longitude
    ), (data) ->
      allUsers = JSON.parse(data)
      updatedPositions(allUsers)
      #fitMapToPositions(allUsers)
      placeMarkers(allUsers)
  )

mapInitialized = false
googleMap = null

initializeMap = () ->
  if mapInitialized
    return
  mapInitialized = true
  mapOptions = {
    center: new google.maps.LatLng(42.3590995, -71.0934608),
    #zoom: 16,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  googleMap = new google.maps.Map(document.getElementById("map_canvas"), mapOptions)


$(document).ready(() ->
  userid = $.cookie('userid')
  if not userid?
    userid = generateUserId()
    $.cookie('userid', userid)
  if not navigator.geolocation?
    $('#errors').text('You must have Geolocation (ie, GPS on your phone) to use this service.')
  else
    setInterval(() ->
      navigator.geolocation.getCurrentPosition(updateCurrentPositions)
    , 5000)
    navigator.geolocation.getCurrentPosition(updateCurrentPositions)
)

