console.log("scripts.js loaded!");

//GET NEARBY PLACE
$('#nearby-btn').click(function () {
    var lat = $('#nearby-lat').val().trim();
    var lng = $('#nearby-lng').val().trim();

    //Checks for empty values
    if (!lat || !lng) {
        alert("Please enter both latitude and longitude.");
        return;
    }
    lat = parseFloat(lat);
    lng = parseFloat(lng);
    
    //Checks if it's a valid number and within range
    if (isNaN(lat) || lat < -90 || lat > 90) {
        alert("Latitude must be a number between -90 and +90.");
        return;
    }
    if (isNaN(lng) || lng < -90 || lng > 90) {
        alert("Longitude must be a number between -180 and +180.");
        return;
    }

    $.ajax({
        url: './php/findNearbyPlaceName.php',
        type: 'POST',
        dataType: 'json',
        data: {
            action: 'nearby',
            lat: $('#nearby-lat').val().trim(),
            lng: $('#nearby-lng').val().trim()
        },
        success: function (response) {
            console.log(response);
            if (response.geonames && response.geonames.length > 0) {
                $('#nearby-result').html(
                    "Nearby Place: " + response.geonames[0].name + ", " + response.geonames[0].countryName
                );
            }
            else if (response.error) {
                $('#nearby-result').html("Error: " + response.error);
            }
            else {
                $('#nearby-result').html("No nearby places found.");
            }
        },
        error: function () {
            alert('Error retrieving nearby places.');
        }
    });
});