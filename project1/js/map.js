
//BASE MAP TILES
const defaultMap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors"
    }
);

const lightMap = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap & CARTO",
    }
)

const darkMap = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap & CARTO",
    }
)

var map = L.map("map", {
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 1.0,
    zoomSnap: 0.1, //zooms out and in 0.1 at a time
    minZoom: 2,
    maxZoom: 15,
    layers: [lightMap]
}).setView([51.505, -0.09], 4);

const baseMaps = {
    "Light": lightMap,
    "Dark": darkMap,
    "Default": defaultMap
}

const overlays = {}; //maybe add some overlays later

L.control.layers(baseMaps, overlays, { position: "bottomright", collapsed: true }).addTo(map);
map.removeControl(map.zoomControl); // I removed the map zoom in and out as adding the buttons kept the original one too
L.control.zoom({ position: "topright" }).addTo(map); //add zoom in and out on right so not in way of the overlay

var countryLayer;
let highlightedLayer;
let highlightedUserLocationLayer;
let poiLayer = L.layerGroup().addTo(map);
let userInitiated = false;
let currentExchangeRate = null;
let currentCurrencyCode = null;

//BUTTONS ON CLICK OPEN MODALS
$(document).ready(function () {
    //fixing aria-hidden warning when closing modals
    document.querySelectorAll(".modal").forEach((modalSelected) => {
        modalSelected.addEventListener("hide.bs.modal", () => {
            if (document.activeElement) document.activeElement.blur();
        })
    })

    $("#amountInput").on("input", convertCurrency);

    function closeAllModals() {
        $(".modal.show").each(function () {
            const modal = bootstrap.Modal.getInstance(this);
            if (modal) modal.hide();
        });
    }

    function openModal(modalId) {
        if (document.activeElement) {
            document.activeElement.blur();
        }

        closeAllModals();

        const modalSelected = document.querySelector(modalId);
        const modal = bootstrap.Modal.getOrCreateInstance(modalSelected);
        modal.show();
    }

    $("#weatherButton").on("click", function () {
        openModal("#weatherModal");
    });

    $("#countryInfoButton").on("click", function () {
        openModal("#countryInfoModal");
    });

    $("#wikiButton").on("click", function () {
        openModal("#wikiModal");
    });

    $("#imageButton").on("click", function () {
        openModal("#countryImageModal");
    });

    $("#currencyButton").on("click", function () {
        openModal("#currencyModal");
        $("#currency-modalLoader").hide();
    });

});

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
        let iso2 = $(this).val();
        if (!iso2) {
            return;
        }
        if (triggeredByUser === true) {
            userInitiated = true;
        }

        countryLayer.eachLayer(function (layer) {
            if (layer.feature.properties.iso_a2 === iso2) {
                highlightCountry(layer);

                //zoom to country border
                map.fitBounds(layer.getBounds(), {
                    padding: [180, 180],
                    maxZoom: 6
                })
                //pushes to url so that the url includes the iso2 code makes it restful
                history.pushState(null, null, `/project1/api/countries/${iso2}`);
                updateCountryInfo(iso2, layer);
            }
        });

    });

});

//Get GeoJSON data and add to map, on click the dropdown changes to country name
$.getJSON("./php/getCountryBorders.php", function (data) {
    countryLayer = L.geoJSON(data, {
        style: function (feature) {
            return {
                //colour of country borders and countries when mapped out
                className: "country-borders",
                stroke: false,
                fillColor: "transparent",
                interactive: true,
                color: "transparent"
            };
        },
        onEachFeature: function (feature, layer) {
            layer.on("click", function () {
                var name = feature.properties.name;
                var iso2 = feature.properties.iso_a2;
                userInitiated = true;
                //on country click we trigger the event change to change the country
                $("#countrySelect").val(iso2).trigger("change", true);
                history.pushState(null, null, `/project1/api/countries/${iso2}`);
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

                                $("#countrySelect")
                                    .val(detectedIso2)
                                    .trigger("change", true);

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
                })
                .fail(() => {
                    console.log("Failed to retrieve location data");
                });
        }, error => {
            console.log("Geolocation error:", error.message);
        });
    }
});

//Highlight country on click function
function highlightCountry(layer) {
    if (highlightedLayer) {
        countryLayer.resetStyle(highlightedLayer);
        highlightedLayer = null;
    }
    if (layer) {
        //highlighted country has a thicker white border
        layer.setStyle({
            stroke: true,
            color: "red",
            weight: 2.0,
            opacity: 0.8,
            fill: false
        });
        highlightedLayer = layer;
    } else {
        //remove class and country selected is empty
        $("#countrySelect").val("");
    }
}

//Fetches country and runs all the functions
function updateCountryInfo(iso2, layer) {
    showPoiLoader();
    $("#amountInput").val("");
    $("#convertedAmount").val("");
    highlightCountry(layer);
    poiLayer.clearLayers();
    //if no country selected show messages to select a country
    if ($("#countrySelect").val() === "") {
        toggleModalContent("#countryInfoMessage", "#countryInfo");
        toggleModalContent("#currencyMessage", "#currencyInfo");
        return;
    } else {
        toggleModalContent("#countryInfo", "#countryInfoMessage");
        toggleModalContent("#currencyInfo", "#currencyMessage");
    }
    //uses push state
    $.getJSON(`/project1/api/countries/${iso2}`).done(data => {
        if (!data.error) {
            //get latitude and longitude
            let capitalLat = data.lat ?? data.latitude;
            let capitalLng = data.lng ?? data.longitude;
            console.log(capitalLat, capitalLng);
            $("#country-modalLoader").hide();
            //GETS POIS OF CAPITAL
            getPOIs(capitalLat, capitalLng);
            //COUNTRY NAME
            console.log(`Country: ${data.name}`);
            $("#countryName").text(data.name);
            getCountryImage(data.name); //get country images from country name
            getWikiInfo(data.name); //get wiki info from country name
            getCountryFlag(iso2); //get country flag from iso2 code
            getTimezone(iso2, data.name); //get timezone from iso2 code and country name
            //CAPITAL NAME
            console.log(`Capital: ${data.capital}`);
            $("#capital").text(data.capital);
            getWeather(data.capital); //get weather from capital name
            $("#countryName").text(data.name);
            $("#currencyCountryName").text(data.name);
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
            $("#exchangeRate").text(`1 GBP = ${data.exchangeRate} ${data.currencyCode}`);
            currentExchangeRate = data.exchangeRate;
            currentCurrencyCode = data.currencyCode;
            //AREA AND LANGUAGES

            $("#area").text(
                data.area ? `${Number(data.area).toLocaleString()} km²` : "N/A"
            );
            $("#languages").text(
                data.languages.length > 0 ? data.languages.join(", ") : "N/A"
            );
        }
        else {
            console.log("Country data not found.");
        }
    })
        .fail(() => {
            console.log("Failed to retrieve country data.");
        });
}

//get weather using capitl name
async function getWeather(capital) {
    if ($("#countrySelect").val() === "") {
        toggleModalContent("#weatherInfoMessage", null);
        $("#weather-modalLoader").hide();
        return;
    } else {
        toggleModalContent("#weatherInfo", "#weatherInfoMessage");
        $("#weather-modalLoader").show();
    }
    try {
        const weather = await $.getJSON(`/project1/php/getWeather.php?capital=${capital}`);
        //if no errors then list the properties
        if (weather && !weather.error) {
            $("#weather-modalLoader").hide();
            console.log(`Temperature: ${weather.temperature}°C`);
            console.log(`Weather description: ${weather.description}`);
            console.log(`Humidity: ${weather.humidity}`);
            console.log(`Wind speed: ${weather.wind_speed}`);
            console.log(weather);
            //sends to weather to designated classes to show in html
            $("#weatherDescription").text(weather.description || "No description");
            $("#weatherTemperature").text(weather.temperature != null ? `${Math.round(weather.temperature)}°C` : "N/A");
            $("#weatherFeelsLike").text(weather.feels_like != null ? `${Math.round(weather.feels_like)}°C` : "N/A");
            $("#weatherHumidity").text(weather.humidity != null ? `${weather.humidity}%` : "N/A");
            $("#weatherWindSpeed").text(weather.wind_speed != null ? `${weather.wind_speed}m/s` : "N/A");
            $("#weatherIcon").attr("src", weather.icon_url).show();
            $("#weatherCapital").text(weather.capital);

            $("#weatherForecast").empty(); // clear previous forecast
            //display 7 day forecastå
            if (weather.forecast && weather.forecast.length > 0) {
                const forecastRow = $('<div class="d-flex justify-content-between flex-row overflow-auto"></div>');

                weather.forecast.forEach(day => {
                    const forecastItem = $(`
            <div class="forecast-day card text-center m-1 shadow-sm p-2 flex-shrink-0" style="width: 147px;">
                <div><small>${day.date}</small></div>
                <div class="d-flex justify-content-center align-items-center my-1" style="width: 100%; height: 50px;">
                    <img src="${day.icon_url}" alt="${day.description}" class="w-70 h-100 object-fit-cover" />
                </div>
                <div class="text-muted mb-1"><small>${day.description}</small></div>
                <div><small>Min: ${Math.round(day.temp_min)}°C</small></div>
                <div><small>Max: ${Math.round(day.temp_max)}°C</small></div>
            </div>
        `);
                    forecastRow.append(forecastItem);
                });

                $("#weatherForecast").append(forecastRow);
            }

        }
        else {
            console.log(weather.error);
            $("#weatherDescription").text("Weather data not available");
            $("#weatherTemperature").text("-");
            $("#weatherHumidity").text("-");
            $("#weatherWindSpeed").text("-");
        }
    } catch (error) {
        console.log("Failed to retrieve weather data");
        $("#weatherDescription").text("Failed to retrieve weather data");
        $("#weatherTemperature").text("-");
        $("#weatherHumidity").text("-");
        $("#weatherWindSpeed").text("-");
    }
}

//fetch flag using country code
async function getCountryFlag(iso2) {
    try {
        const flagData = await $.getJSON(`/project1/php/getFlag.php?iso2=${iso2}`);
        //if no flag errors
        if (!flagData.error) {
            //console.log("Flag URL:", flagData);
            //sends to country flag div to give src value to show the flag image
            $("#countryFlag").attr("src", flagData.flag);
        } else {
            console.log(flagData.error);
        }
    } catch (error) {
        console.log("Failed to retrieve flag data");
    }
}

//fetch country imag using country name
async function getCountryImage(country) {
    //if no country selected show message to select a country
    $("#countryImageName").text(country);
    if ($("#countrySelect").val() === "") {
        toggleModalContent("#countryImgMessage", null);
        $("#img-modalLoader").hide();
        return;
    } else {
        toggleModalContent("#countryImageInfo", "#countryImgMessage");
        $("#img-modalLoader").show();
    }
    try {
        const imgData = await $.getJSON(`/project1/php/getCountryImage.php?country=${country}`);
        const container = $("#countryImageInfo");
        container.empty(); // Clear previous images
        $("#img-modalLoader").hide();
        // Loop through images and create elements
        imgData.images.forEach(img => {
            container.append(`
                    <div class="image-item border-bottom pb-1 mb-2 mt-2">
                        <img src="${img.image}" alt="${img.caption}" class="img-fluid mx-auto w-75 d-block"/>
                        <span class="caption mb-1 font-italic small text-dark">${img.caption}</span>
                        <span class="photographer mb-0 text-muted small"> - ${img.photographer}</span>
                    </div>
                `);
        });

    } catch (error) {
        console.log("Failed to retrieve country image data");
    }
}

//fetch wiki info using country name
async function getWikiInfo(country) {
    const container = $("#wikiLinks");
    try {
        const wikiData = await $.getJSON(`/project1/php/getWiki.php?country=${encodeURIComponent(country)}`);
        if (!wikiData.results || wikiData.results.length === 0) {
            container.text("Please select a country first to see related wikipedia articles.");
            $("#wiki-modalLoader").hide();
            return;
        }
        $("#wiki-modalLoader").show();
        container.empty(); // Clear previous links
        const template = document.getElementById("wikiTemplate");
        $("#wikiCountryName").text(country);

        wikiData.results.forEach(result => {
            const clone = template.content.cloneNode(true);

            const img = clone.querySelector(".wikiImg");
            const title = clone.querySelector(".wikiTitle");
            const summary = clone.querySelector(".wikiSummary");


            if (result.image) {
                img.src = result.image;
                img.alt = result.title;
            } else {
                img.style.display = "none"; //hide image if none
            }
            $("#wiki-modalLoader").hide();
            title.textContent = result.title;
            summary.textContent = result.summary;

            container.append(clone);
        });
    } catch (error) {
        console.log("Failed to retrieve Wikipedia data");
        container.text("Error loading Wikipedia links.");
    };
}

//fetch time from timezone using country code and name
async function getTimezone(iso2, name) {
    try {
        const timezoneData = await $.getJSON(`/project1/php/getCountryTime.php?iso2=${iso2}&name=${encodeURIComponent(name)}`);
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
    } catch (error) {
        console.log("Failed to retrieve timezone data");
        $("#countryTime").text("Failed to retrieve local time");
    }
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

//get local time for top left of screen
getLocalTime();

//POI ICONS FROM ICONS FOLDER
const poiIcons = {
    //TOURISM ICON
    tourism: L.icon({
        iconUrl: 'https://kierathdhugga.co.uk/project1/icons/tourism.png',
        iconSize: [60, 60],
    }),
    //HISTORIC ICON
    historic: L.icon({
        iconUrl: 'https://kierathdhugga.co.uk/project1/icons/historic.png',
        iconSize: [60, 60],
    }),
    //RELIGION ICON
    religion: L.icon({
        iconUrl: 'https://kierathdhugga.co.uk/project1/icons/religion.png',
        iconSize: [60, 60],

    }),
    //DEFAULT ICON
    default: L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [20, 20],
    })
};

const airportIcon = L.icon({
    iconUrl: 'https://kierathdhugga.co.uk/project1/icons/airplane.png',
    iconSize: [40, 40],
});
//Gets pois from capitals latitude and longitude with a radius of 5000m using geoapify api - geonames didn't work as it only let me use a radius of 1
async function getPOIs(lat, lng, radius = 5000) {
    poiLayer.clearLayers(); //clear previous pois


    try {
        const POIdata = await $.getJSON(`/project1/php/getPOIs.php?lat=${lat}&lng=${lng}&radius=${radius}`);

        if (!POIdata || !POIdata.pois || POIdata.pois.length === 0) {
            console.log("No POIs found");
            return;
        }

        // create new marker cluster group
        let tourismMarkers = L.markerClusterGroup();
        let historicMarkers = L.markerClusterGroup();
        let religionMarkers = L.markerClusterGroup();

        POIdata.pois.forEach(poi => {
            const poiLat = poi.lat;
            const poiLng = poi.lng;
            const name = poi.name;
            const categories = poi.categories || [];

            // Default icon
            let icon = poiIcons.default;
            let marker;

            // specific categories = category icon
            if (categories.some(category => category.startsWith("religion.place_of_worship"))) {
                icon = poiIcons.religion;
                marker = L.marker([poiLat, poiLng], { icon }).bindPopup(`<b>${name}</b>`);
                religionMarkers.addLayer(marker);
            } else if (categories.some(category => category.startsWith("tourism"))) {
                icon = poiIcons.tourism;
                marker = L.marker([poiLat, poiLng], { icon }).bindPopup(`<b>${name}</b>`);
                tourismMarkers.addLayer(marker);
            } else if (categories.some(category => category.startsWith("historic"))) {
                icon = poiIcons.historic;
                marker = L.marker([poiLat, poiLng], { icon }).bindPopup(`<b>${name}</b>`);
                historicMarkers.addLayer(marker);
            }

            // Create marker and add it to the cluster group
            let allMarkers = [tourismMarkers, historicMarkers, religionMarkers];
            let bounds = L.latLngBounds();
            allMarkers.forEach(group => {
                group.getLayers().forEach(marker => {
                    bounds.extend(marker.getLatLng());
                });
            });
        });

        poiLayer.addLayer(tourismMarkers);
        poiLayer.addLayer(historicMarkers);
        poiLayer.addLayer(religionMarkers);


        hidePoiLoader();
    } catch (error) {
        console.error("Error fetching POIs:", error);
        hidePoiLoader();
    }
}

//shows poi loader and hides title container that shows the capital
function showPoiLoader() {
    $("#poiLoader").show();
}

//hides poi loader and shows title container that shows the capital
function hidePoiLoader() {
    $("#poiLoader").hide();
}

function toggleModalContent(showContentId, hideContentId) {
    $(hideContentId).hide();
    $(showContentId).show();
}

function clearUserCountryHighlight() {
    if (highlightedUserLocationLayer) {
        countryLayer.resetStyle(highlightedUserLocationLayer); //reset previous user location style
        highlightedUserLocationLayer = null;
    }
}

function convertCurrency() {
    const gbp = parseFloat($("#amountInput").val());
    if (isNaN(gbp) || currentExchangeRate === null) {
        $("#convertedAmount").val("");
        return;
    }

    const converted = gbp * currentExchangeRate;
    $("#convertedAmount").val(converted.toFixed(2));
}
