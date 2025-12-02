console.log("scripts.js loaded!");

//GET NEARBY PLACE
$("#nearby-btn").on("click", function(){

    let lat = $("#nearby-lat").val().trim();
    let lng = $("#nearby-lng").val().trim();

    //convert to float
    lat = parseFloat(lat);
    lng = parseFloat(lng);
    
    //Checks if it's a valid number and within range, latitude is between -90 & 90, longitude is between -180 & 180
    if (isNaN(lat) || lat < -90 || lat > 90) {
        alert("Latitude must be a number between -90 and +90");
        return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
        alert("Longitude must be a number between -180 and +180");
        return;
    }

    //ACTION IS NEARBY
    $.ajax({
        url: 'libs/php/api.php',
        type: 'POST',
        dataType: 'json',
        data: {
            action: 'nearby',
            lat: lat,
            lng: lng,
        },
        success: function (response) {
            console.log(response);
            //if there is a nearby place, show the first one with name and country
            if (response.geonames && response.geonames.length > 0) {
                const place = response.geonames[0];
                $("#nearby-result").html(
                    `Nearby Place: ${place.name}, ${place.countryName}`
                );
            }
            //if there's a error, show the error message
            else if (response.error) {
                $("#nearby-result").text("Error: " + response.error);
            }
            //else show there's no nearby places
            else {
                $("#nearby-result").text("No nearby places found.");
            }
        },
        //if ajax fails and there's an error, alert that it failed
        error: function () {
            alert("Failed to fetch nearby places.");
        }
    });
});

//GET OCEAN
$("#ocean-btn").on("click", function () {
    
    //clean user input
    let lat = $("#ocean-lat").val().trim();
    let lng = $("#ocean-lng").val().trim();

    //check input
    if (!lat || !lng) {
        alert("Both latitude & longitude are required, please enter both");
        return;
    }

    //Convert to float
    lat = parseFloat(lat);
    lng = parseFloat(lng);
    
    //Checks if it's a valid number and within range, latitude is between -90 & 90, longitude is between -180 & 180
    if (isNaN(lat) || lat < -90 || lat > 90) {
        alert("Latitude must be a number between -90 and +90");
        return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
        alert("Longitude must be a number between -180 and +180");
        return;
    }
    //ACTION IS OCEAN
    $.ajax({
        url: 'libs/php/api.php',
        type: 'POST',
        dataType: 'json',
        data: {
            action: 'ocean',
            lat: lat,
            lng: lng,
        },
        success: function (response) {
            console.log(response);
            //if there is an ocean, show the ocean name
            if (response.ocean) {
                $("#ocean-result").html(
                    `Ocean/Sea: ${response.ocean.name}`
                );
            }
            //if there's a error, show the error message
            else if (response.error) {
                $("#ocean-result").text("Error: " + response.error);
            }
            //else show there's no ocean found
            else {
                $("#ocean-result").text("No ocean found at this location.");
            }
        },
        //if ajax fails and there's an error, alert that it failed
        error: function () {
            alert("Failed to fetch ocean data.");
        }
    });
});


//GET WEATHER
$("#weather-btn").on("click", function () {
    //clean user input
    let north = $("#weather-north").val().trim();
    let south = $("#weather-south").val().trim();
    let east = $("#weather-east").val().trim();
    let west = $("#weather-west").val().trim();

    //Checks input
    if (!(north && south && east && west)) {
        alert("Please fill all fields!");
        return;
    }

    //convert to floats
    north = parseFloat(north);
    south = parseFloat(south);
    east = parseFloat(east);
    west = parseFloat(west);


    //ACTION IS WEATHER
    $.ajax({
        url: "libs/php/api.php",
        type: "POST",
        dataType: "json",
        data: {
            action: "weather",
            north: north,
            south: south,
            east: east,
            west: west,
        },
        success: function (response) {
            console.log(response);
            //if there are weather observations from station, map and list them with station name, temperature, humidity, clouds
            if (response.weatherObservations && response.weatherObservations.length > 0) {
                let html = "<ul>";
                response.weatherObservations.forEach(station => {
                    html += `<li>
                        Station: ${station.stationName},<br>
                        Temperature: ${station.temperature}°C,<br>
                        Humidity: ${station.humidity}%,<br>
                        Clouds: ${station.clouds} <br>
                    </li>`;
                });
                html += "</ul>";
                $("#weather-result").html(html);
            }
            //if there's a error, show the error message
            else if (response.error) {
                $("#weather-result").text("Error: " + response.error);
            }
            //else show there's no weather data found
            else {
                $("#weather-result").text("No weather data found at this location.");
            }
        },
        //if ajax fails and there's an error, alert that it failed
        error: function () {
            alert("Failed to fetch weather.");
        }
    });
});
