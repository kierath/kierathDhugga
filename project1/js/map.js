var map = L.map("map", {
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 1.0,
    zoomSnap: 0.1, //zooms out and in 0.1 at a time
    minZoom: 2,
    maxZoom: 15,
    layers: []
}).setView([51.505, -0.09], 4);

map.removeControl(map.zoomControl); // I removed the map zoom in and out as adding the buttons kept the original one too
L.control.zoom({ position: "topright" }).addTo(map); //add zoom in and out on right so not in way of the overlay

var countryLayer;
let highlightedLayer;
let userLocationLayer;
let poiLayer = L.layerGroup().addTo(map);
let userInitiated = false;

//highlights user's country
function highlightUserCountry(layer) {
    if (!layer) {
        return;
    }

    if (userLocationLayer) {
        countryLayer.resetStyle(userLocationLayer);
        userLocationLayer = null;
    }
    //user's location outlines the country in red
    layer.setStyle({
        color: "red",
        weight: 1,
        fillOpacity: 0.9
    });
    userLocationLayer = layer;
}

//Highlight country on click function
function highlightCountry(layer) {
    if (highlightedLayer) {
        countryLayer.resetStyle(highlightedLayer);
        highlightedLayer = null;
    }
    if (layer) {
        //highlighted country has a thicker white border
        layer.setStyle({
            color: "white",
            weight: 1,
        });
        highlightedLayer = layer;
        //adding class open so we can change the css of the panel when it is opened
        $("#overlayMapPanel").addClass("open");
    } else {
        //remove class and country selected is empty
        $("#overlayMapPanel").removeClass("open");
        $("#countrySelect").val("");
    }
}

//Lists countries in dropdown
$.getJSON("./php/getCountry.php", function (response) {
    //testing if theres no data
    if (!response.data || !Array.isArray(response.data)) {
        console.log("Invalid country data:", response);
        return;
    }
    let data = response.data;

    //sorts countries in alphabetical order
    data.sort((a, b) => a.name.localeCompare(b.name));
    data.forEach(c => {
        //lists countries in dropdown
        $("#countrySelect").append(`<option value="${c.iso2}">${c.name}</option>`);
    });
    //if country is selected from dropdown, it also highlights on map
    $("#countrySelect").on("change", function (event, triggeredByUser) {
        if (triggeredByUser === true) {
            userInitiated = true;
        }

        let iso2 = $(this).val();
        if (!iso2) {
            return;
        }
        countryLayer.eachLayer(function (layer) {
            if (layer.feature.properties.iso_a2 === iso2) {
                highlightCountry(layer);
                //pushes to url so that the url includes the iso2 code makes it restful
                history.pushState(null, null, `/project1/api/countries/${iso2}`); 
                fetchCountryInfo(iso2, layer);
            }
        });
    });
});

//Fetches country and runs all the functions
function fetchCountryInfo(iso2, layer) {
    highlightCountry(layer);
    showLoader();
    poiLayer.clearLayers();
    //uses push state
    $.getJSON(`/project1/api/countries/${iso2}`).done(data => {
        if (!data.error) {
            let capitalName = data.capital;
            $("#capitalTitle").text(capitalName);

            //get latitude and longitude
            let capitalLat = data.lat ?? data.latitude;
            let capitalLng = data.lng ?? data.longitude;
            console.log(capitalLat, capitalLng);

            //GETS POIS OF CAPITAL
            getPOIs(capitalLat, capitalLng);

            //COUNTRY NAME
            console.log(`Country: ${data.name}`);
            $("#countryName").text(data.name);

            //CAPITAL NAME
            console.log(`Capital: ${data.capital}`);
            $("#capital").text(data.capital);

            //POPULATION AMOUNT
            console.log(`Population: ${data.population}`);
            let population = Number(data.population)
            $("#population").text(population.toLocaleString());

            //REGION
            //console.log(`Region: ${data.region}`);
            $("#region").text(data.region);

            //CURRENCIES, NAME OF CURRENCY AND SYMBOL
            //console.log(`Currencies: ${data.currencies.join(" , ")}`);
            $("#currencies").text(data.currencies.join(" , "));

            //functions below that use different apis
            getWeather(data.capital);
            getCountryFlag(iso2);
            getTimezone(iso2, data.name);
            getCountryImage(data.name);
            getWikiInfo(data.capital).done(() => {
                hideLoader(); //hides loader once lasy function wiki is done
            });
        }
        else {
            console.log("Country data not found.");
        }
    })

}

//Get GeoJSON data and add to map, on click the dropdown changes to country name
$.getJSON("data/countryBorders.geo.json", function (data) {
    countryLayer = L.geoJSON(data, {
        style: function (feature) {
            return {
                //colour of country borders and countries when mapped out
                className: "country-borders",
                color: "white",
                weight: 0.1,
                fillColor: "#07132eff",
                fillOpacity: 0.8,
            };
        },
        onEachFeature: function (feature, layer) {
            layer.on("click", function () {
                var name = feature.properties.name;
                var iso2 = feature.properties.iso_a2;
                userInitiated = true;
                //on country click we trigger the event change to change the country
                $("#countrySelect").val(iso2).trigger("change", true);
                //runs most the functions
                fetchCountryInfo(iso2, layer);
                console.log(name);
            });
        }
    }).addTo(map);

    //hide the loading circle for searching for poi 
    hidePoiLoader();

    //checks user location based on if user allows location to be shared
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            let lat = position.coords.latitude;
            let lng = position.coords.longitude;

            console.log("User coordinates:", lat, lng);

            $.getJSON(`./php/getLocation.php?lat=${lat}&lng=${lng}`)
                .done(locationData => {
                    console.log("Location data returned:", locationData);
                    //if theres no errors and iso2 property exists e.g. US
                    if (!locationData.error && locationData.iso2) {
                        let detectedIso2 = locationData.iso2.toUpperCase();
                        console.log("ISO2:", detectedIso2);

                        //goes through each country layer and compares users detected country to country codes in map
                        countryLayer.eachLayer(function (layer) {
                            let layerIso = layer.feature.properties.iso_a2.toUpperCase();
                            if (layerIso === detectedIso2) {
                                console.log("User is in", layer.feature.properties.name, layer.feature.properties.layerIso);
                                highlightUserCountry(layer); //if found highlight!

                                //center map for start where user is
                                map.fitBounds(layer.getBounds(), {
                                    padding: [50, 50],
                                    maxZoom: 4
                                });
                                //add popup where user coords are to show user where they are, is closeable
                                L.popup({
                                    closeButton: true,
                                    autoClose: false,
                                    className: "locationPopup",
                                })
                                    .setLatLng([lat, lng])
                                    .setContent("<b>You are here!</b>")
                                    .openOn(map);
                            }
                        });
                    } else {
                        console.log("Error returned: ", locationData.error);
                    }
                });
        });
    }
});


//get weather using capitl name
function getWeather(capital) {
    return $.getJSON(`/project1/php/getWeather.php?capital=${capital}`).done(weather => {
        //if no errors then list the properties
        if (!weather.error) {
            console.log(`Temperature: ${weather.temperature}°C`);
            console.log(`Weather description: ${weather.description}`)
            console.log(`Humidity: ${weather.humidity}`);
            console.log(`Wind speed: ${weather.wind_speed}`);
            //sends to weather div to show in html
            $("#weather").html(
                `${weather.description}, <br> Temperature: ${weather.temperature}°C, <br> Humidity: ${weather.humidity}%, <br> Wind speed: ${weather.wind_speed}m/s`
            );
        }
        else {
            console.log(weather.error);
            $("#weather").text("Weather data not available");
        }
    });
}

//fetch flag using country code
function getCountryFlag(iso2) {
    return $.getJSON(`/project1/php/getFlag.php?iso2=${iso2}`)
        .done(flagData => {
            //if no flag errors
            if (!flagData.error) {
                //console.log("Flag URL:", flagData);
                //sends to country flag div to give src value to show the flag image
                $("#countryFlag").attr("src", flagData.flag);
            } else {
                console.log(flagData.error);
            }
        });
}

//fetch country imag using country name
function getCountryImage(country) {
    return $.getJSON(`/project1/php/getCountryImage.php?country=${country}`)
        .done(imgData => {
            //if no country image errors
            if (!imgData.error) {
                $("#countryImage").attr("src", imgData.image); //country image source
                $("#countryImage").attr("alt", imgData.caption); //country image alt caption
                $("#countryImageCaption").text(`${imgData.caption}`); //adds caption also to screen
                $("#countryImagePhotographer").text(`captured by ${imgData.photographer}`); //add photographer name
                console.log("IMAGE URL:", imgData);
            } else {
                console.log("IMAGE ERROR:", imgData.error)
            }
        })
}

//fetch wiki info using capital name
function getWikiInfo(capital) {
    return $.getJSON(`/project1/php/getWiki.php?capital=${capital}`).done(wikiData => {
        //if no wiki data errors, theres results and theres more than 0
        if (!wikiData.error && wikiData.results && wikiData.results.length > 0) {
            //maps results into a list
            let linksWiki = wikiData.results.map(result =>
                `<a href="${result.link}" target="_blank">${result.title}</a>` //can click on the titles and takes you to the link
            ).join("<br>");
            $("#wikiLinks").html(`<br>${linksWiki}`);
            //console.log(linksWiki)
        } else {
            console.log(wikiData.error);
            $("#wikiLinks").text("No Wikipedia info available");
        }
    });
}

//fetch time from timezone using country code and name
function getTimezone(iso2, name) {
    return $.getJSON(`/project1/php/getCountryTime.php?iso2=${iso2}&name=${encodeURIComponent(name)}`)
        .done(timezoneData => {
            //show overlay panel once timezone is received
            $("#overlayMapPanel").show();
            //if no timezone data errors
            if (!timezoneData.error) {
                const now = new Date();
                const localTime = now.toLocaleTimeString("en-GB", { //get GB time
                    timeZone: timezoneData.timezone,
                    hour12: false
                })
                console.log(`Local time in ${timezoneData.name}:`, localTime);
                //sends time to countryTime div
                $("#countryTime").text(localTime);
            } else {
                console.log(timezoneData.error);
                $("#countryTime").text("Failed to retrieve local time");
            }
        });
}

//get local time and put it into clock format 00:00:00
function getLocalTime() {
    const today = new Date();
    let h = today.getHours();
    let m = today.getMinutes();
    let s = today.getSeconds();
    h = checkTime(h);
    m = checkTime(m);
    s = checkTime(s);
    document.getElementById("currentTime").innerHTML = h + ":" + m + ":" + s;
    setTimeout(getLocalTime, 1000);
}

//if i is less than 10 put a 0 infront 0i:0i:0i
function checkTime(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

//get local time for nav bar
getLocalTime();

//closes overlay using button on click, removes highlight and removes open class from panel 
$("#closeOverlayButton").on("click", function () {
    highlightCountry(null);
    $("#overlayMapPanel").removeClass('open');
})

//show circular loader
function showLoader() {
    $("#loader").show();
}

//hide circular loader
function hideLoader() {
    $("#loader").hide();
}

//shows poi loader and hides title container that shows the capital
function showPoiLoader() {
    $("#poiLoader").show();
    $("#capitalTitleContainer").hide();
}

//hides poi loader and shows title container that shows the capital
function hidePoiLoader() {
    $("#poiLoader").hide();
    $("#capitalTitleContainer").show();
}

//POI ICONS FROM ICONS FOLDER
const poiIcons = {
    tourism: L.icon({
        iconUrl: 'icons/tourism.png',
        iconSize: [60, 60],
    }),
    historic: L.icon({
        iconUrl: 'icons/historic.png',
        iconSize: [60, 60],
    }),
    religion: L.icon({
        iconUrl: 'icons/religion.png',
        iconSize: [60, 60],

    }),
    default: L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [20, 20],
    })
};

//Gets pois from capitals latitude and longitude with a radius of 5000m using geoapify api - geonames didn't work as it only let me use a radius of 1
function getPOIs(lat, lng, radius = 5000) {
    if (userInitiated) {
        showPoiLoader();
    }
    poiLayer.clearLayers(); // Remove old markers

    $.getJSON(`/project1/php/getPOIs.php?lat=${lat}&lng=${lng}&radius=${radius}`)
        .done(POIdata => {
            if (!POIdata || !POIdata.pois || POIdata.pois.length === 0) {
                console.log("No POIs found");
                return;
            }

            // create new marker cluster group
            let markers = L.markerClusterGroup({
                maxClusterRadius: 50,
                disableClusteringAtZoom: 10,
                spiderfyOnMaxZoom: false,
                spiderfyDistanceMultiplier: 5
            });

            POIdata.pois.forEach(poi => {
                const poiLat = poi.lat;
                const poiLng = poi.lng;
                const name = poi.name;
                const categories = poi.categories || [];

                // Default icon
                let icon = poiIcons.default;

                // specific categories = category icon
                if (categories.some(category => category.startsWith("religion.place_of_worship"))) {
                    icon = poiIcons.religion;
                } else if (categories.some(category => category.startsWith("tourism"))) {
                    icon = poiIcons.tourism;
                } else if (categories.some(category => category.startsWith("historic"))) {
                    icon = poiIcons.historic;
                }

                // Create marker and add it to the cluster group
                let marker = L.marker([poiLat, poiLng], { icon })
                    .bindPopup(`<b>${name}</b>`);

                markers.addLayer(marker);
            });

            // Add markers to map
            poiLayer.addLayer(markers);
            hidePoiLoader();
        })
        .fail(error => {
            console.error("Error fetching POIs:", error);
            hidePoiLoader();
        });
}

//function to hide capital name once zoomed out more than 7 times as i only wanted it on the country to give a bit of context with the poi
map.on("zoomend", function () {
    if (map.getZoom() <= 7) {
        $("#capitalTitleContainer").hide();
    }
    else {
        $("#capitalTitleContainer").show();
    }
})