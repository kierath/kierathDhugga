//BASE MAP TILES
const defaultMap = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
});

const lightMap = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
    maxZoom: 16
});

const darkMap = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
    maxZoom: 16
});


//clustergroups
const poiCluster = L.markerClusterGroup({
    maxClusterRadius: 50,
    showCoverageOnHover: false,
});


let tourismLayer = L.featureGroup.subGroup(poiCluster);
let religionLayer = L.featureGroup.subGroup(poiCluster);
let airportLayer = L.featureGroup.subGroup(poiCluster);

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

const overlays = {
    "Tourism": tourismLayer,
    "Religion": religionLayer,
    "Airports": airportLayer
};

map.addLayer(poiCluster);
map.addLayer(tourismLayer);
map.addLayer(religionLayer);
map.addLayer(airportLayer);

L.control.layers(baseMaps, overlays, { position: "bottomright", collapsed: true }).addTo(map);

var countryLayer;
let highlightedLayer;
let highlightedUserLocationLayer;
let userInitiated = false;
let currentExchangeRate = null;
let currentCurrencyCode = null;


//BUTTONS ON CLICK OPEN MODALS
$(document).ready(function () {
    showMapLoader();
    //fixing aria-hidden warning when closing modals
    document.querySelectorAll(".modal").forEach((modalSelected) => {
        modalSelected.addEventListener("hide.bs.modal", () => {
            if (document.activeElement) document.activeElement.blur();
        })
    })

    selectUserCountry();
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

    L.easyButton("<img src='./icons/weather.svg' alt='Show Weather Info'/>", function (btn, map) {
        openModal("#weatherModal");
    }, "Show Weather Info").addTo(map);

    L.easyButton("<img src='./icons/worldinfo.svg' alt='Show Country Info'/>", function (btn, map) {
        openModal("#countryInfoModal");
    }, "Show Country Info").addTo(map);

    L.easyButton("<img src='./icons/wiki.svg' alt='Show Wiki Info'/>", function (btn, map) {
        openModal("#wikiModal");
    }, "Show Wiki Info").addTo(map);

    L.easyButton("<img src='./icons/news.svg' alt='Show Country News'/>", function (btn, map) {
        openModal("#countryNewsModal");
    }, "Show Country News").addTo(map);

    L.easyButton("<img src='./icons/currency.svg' alt='Show Currency Info'/>", function (btn, map) {
        openModal("#currencyModal");
        $("#currency-modalLoader").hide();
    }, "Show Currency Info").addTo(map);

});

//load all countries on map
$.getJSON("./php/getCountryFeature.php").done(data => {
    if (!data.data || data.data.length === 0) {
        //console.log("Country GeoJSON not found");
        return;
    }
    countryLayer = L.geoJSON(data.data, {
        style: {
            stroke: false,
            fill: true,
            fillOpacity: 0.01
        },
        onEachFeature: function (feature, layer) {
            layer.on("click", function () {
                //console.log("Country clicked:", feature.properties.iso_a2);
                highlightCountry(layer);
                $("#countrySelect").val(feature.properties.iso_a2).trigger("change", true);
            });
        }
    }).addTo(map);

});

//Lists countries in dropdown
$.getJSON("./php/getCountryList.php").done(function (response) {
    
    if(!response.status || response.status.code !== 200){
        console.error("failed to load countries");
    }

    if (!Array.isArray(response.data) || response.data.length === 0) {
        console.error("Invalid country list response");
        return;
    }

    response.data.forEach(c => {
        $("#countrySelect").append(`<option value="${c.iso2}">${c.name}</option>`);
    });

    $("#countrySelect").on("change", function (event, triggeredByUser) {
        let iso2 = $(this).val();
        if (!iso2) return;

        if (triggeredByUser === true) userInitiated = true;

        let selectedLayer = null;
        countryLayer.eachLayer(function (layer) {
            if (layer.feature.properties.iso_a2 === iso2) {
                selectedLayer = layer;
            }
        });

        if (selectedLayer) {
            updateCountryInfo(iso2, selectedLayer);
            highlightCountry(selectedLayer);
        } else {
            //console.log("Selected country layer not found for ISO2:", iso2);
        }
    });
});

function selectUserCountry() {
    if (!navigator.geolocation) {
        return; // geolocation not supported
    }

    navigator.geolocation.getCurrentPosition(
        async function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            try {
                //get ISO2
                const response = await $.getJSON(`/project1/php/getLocation.php?lat=${lat}&lng=${lng}`);

                if (response && response.data.iso2) {
                    const iso2 = response.data.iso2.toUpperCase();
                    //console.log("User country ISO2:", iso2);

                    // Select in dropdown and trigger change
                    $("#countrySelect").val(iso2).trigger("change", true);
                } else {
                    //console.log("Could not get user country from coordinates");
                }
            } catch (err) {
                console.error("Failed to get user country:", err);
            }
        },
    );
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
            stroke: true,
            color: "red",
            weight: 2.0,
            opacity: 0.8,
            fill: false
        });
        highlightedLayer = layer;

        map.fitBounds(layer.getBounds(), {
            padding: [180, 180],
            maxZoom: 6
        });
    } else {
        //remove class and country selected is empty
        $("#countrySelect").val("");
    }
}

//Fetches country and runs all the functions
function updateCountryInfo(iso2, layer) {
    $("#amountInput").val("1.0");
    highlightCountry(layer);
    tourismLayer.clearLayers();
    religionLayer.clearLayers();
    airportLayer.clearLayers();
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
    $.getJSON(`./php/getCountryInfo.php?iso2=${iso2}`).done(response => {
        $("#country-modalLoader").hide();

        if (response.status.code !== 200) {
            //console.log(response.status.message);
            return;
        }

        const data = response.data;

        //GETS POIS OF CAPITAL
        getPOIs(iso2);

        let capitalLat = data.lat;
        let capitalLng = data.lng;
        //console.log(capitalLat, capitalLng);

        //COUNTRY NAME
        //console.log(`Country: ${data.name}`);
        $("#countryName").text(data.name);
        getCountryNews(iso2, data.name); //get country images from country name
        getWikiInfo(data.name); //get wiki info from country name
        getCountryFlag(iso2); //get country flag from iso2 code
        getTimezone(iso2, data.name); //get timezone from iso2 code and country name
        //CAPITAL NAME
        //console.log(`Capital: ${data.capital}`);
        $("#capital").text(data.capital);
        getWeather(data.capital); //get weather from capital name
        $("#countryName").text(data.name);
        $("#currencyCountryName").text(data.name);
        //POPULATION AMOUNT
        //console.log(`Population: ${data.population}`);
        let population = Number(data.population)
        $("#population").text(population.toLocaleString());
        //REGION
        //console.log(`Region: ${data.region}`);
        $("#region").text(data.region);
        //CURRENCIES, NAME OF CURRENCY AND SYMBOL
        //console.log(`Currencies: ${data.currencies.join(" , ")}`);
        $("#currencies").text(data.currencies.join(" , "));
        $("#exchangeRate").val(`1 USD = ${data.exchangeRate} ${data.currencyCode}`);
        $("#currencyName").val(data.currencies);
        currentExchangeRate = data.exchangeRate;
        currentCurrencyCode = data.currencyCode;
        $("#convertedAmount").val((1 * currentExchangeRate).toFixed(2));
        //AREA AND LANGUAGES

        $("#area").text(
            data.area ? `${Number(data.area).toLocaleString()} km²` : "N/A"
        );
        $("#languages").text(
            data.languages.length > 0 ? data.languages.join(", ") : "N/A"
        );
        hideMapLoader();

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
        const response = await $.getJSON(`/project1/php/getWeather.php?capital=${capital}`);
        //if no errors then list the properties
        if (response.status.code !== 200) {
            //sends to weather to designated classes to show in html
            $("#weatherDescription").text("Weather data not available");
            $("#weatherTemperature").text("N/A");
            $("#weatherIcon").hide();
            $("#weatherCapital").text("");
            $("#weatherForecast").empty();
            return;
        }

        const weather = response.data;

        $("#weather-modalLoader").hide();
        //sends to weather to designated classes to show in html
        $("#weatherDescription").text(weather.description || "No description");
        $("#weatherTemperature").text(weather.temperature != null ? `${Math.round(weather.temperature)}°C` : "N/A");
        $("#weatherIcon").attr("src", weather.icon_url).show();
        $("#weatherCapital").text(weather.capital);
        $("#weatherForecast").empty(); // clear previous forecast
        //console.log(`Temperature: ${weather.temperature}°C`);
        //console.log(`Weather description: ${weather.description}`);
        //console.log(weather);
        //display 7 day forecastå

        if (weather.forecast && weather.forecast.length > 0) {
            const forecastRow = $('<div class="d-flex justify-content-between flex-row overflow-auto"></div>');
            function getDayWithSuffix(day) {
                if (day >= 11 && day <= 13) {
                    return day + "th";
                }
                switch (day % 10) {
                    case 1:
                        return day + "st"; //1,21, 31
                    case 2:
                        return day + "nd"; //2, 22
                    case 3:
                        return day + "rd"; //3, 23
                    default:
                        return day + "th";
                }
            }
            weather.forecast.forEach(day => {
                const dateObj = new Date(day.date + "T00:00:00");
                const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + getDayWithSuffix(dateObj.getDate());
                const forecastItem = $(`
            <div class="forecast-day card text-center m-1 shadow-sm p-2 flex-shrink-0" style="width: 147px;">
                <div><small>${formattedDate}</small></div> 
                <div class="d-flex justify-content-center align-items-center my-1" style="width: 100%; height: 50px;">
                    <img src="${day.icon_url}" alt="${day.description}" class="w-70 h-100 object-fit-cover" />
                </div>
                <div class="text-muted mb-1"><small>${day.description}</small></div>
                <div><small>${Math.round(day.temp_min)}°C</small></div>
                <div><small>${Math.round(day.temp_max)}°C</small></div>
            </div>
        `);
                forecastRow.append(forecastItem);
            });

            $("#weatherForecast").append(forecastRow);
        }

    } catch (error) {
        console.log("Failed to retrieve weather data");
        $("#weatherDescription").text("Failed to retrieve weather data");
        $("#weatherTemperature").text("-");
        $("#weatherIcon").hide();
        $("#weatherForecast").empty();
    }
}

//fetch flag using country code
async function getCountryFlag(iso2) {
    try {
        const flagData = await $.getJSON(`/project1/php/getFlag.php?iso2=${iso2}`);
        //if no flag errors
        if (flagData.status && flagData.status.code === 200) {
            //console.log("Flag URL:", flagData);
            //sends to country flag div to give src value to show the flag image
            $("#countryFlag").attr("src", flagData.data.flag);
        }
    } catch (error) {
        console.log("Failed to retrieve flag data");
        $("#countryFlag").attr("src", ""); //clears flag
    }
}

//fetch country news using country name
async function getCountryNews(iso2, countryName) {
    const container = $("#countryNewsContainer");
    container.empty(); // Clear previous news
    $("#newsLoader").show();
    try {
        const newsData = await $.getJSON(`/project1/php/getCountryNews.php?iso2=${iso2}&country=${encodeURIComponent(countryName)}`);

        $("#newsLoader").hide();
        //console.log("News data:", newsData);

        if (!newsData || newsData.status.code !== 200) {
            container.append(`<div class="text-muted">No news found for this country.</div>`);
            return;
        }
        const articles = newsData.data.articles;
        if(!articles) {
            container.append(`<div class="text-muted">No news found for this country.</div>`);
            return;
        }

        const duplicate = new Set();
        articles.forEach(article => {

            if (duplicate.has(article.title)) {
                return;
            }
            duplicate.add(article.title);
            container.append(`
                <table class = "table table-borderless news-row">
                    <tr>
                        <td width = "45%">
                        ${article.image ? `<img src="${article.image}" alt="${article.title}" class="img-fluid w-100 mb-2 rounded shadow-sm"/>` : ""}
                        </td>

                        <td>
                        <a href = "${article.link}" class="fw-bold fs-6 text-black" target="_blank">${article.title}</a>
                        <p class="mb-0 text-muted">${truncateText(article.description || '', 150)}</p>
                        </td>
                    </tr>
                </table>
                <hr>
            `);
        });
    } catch (error) {
        console.log("Failed to retrieve country news data", error);
        container.append(`<div class="text-danger">Failed to load news. Please try again later.</div>`);
    }

}

//fetch wiki info using country name
async function getWikiInfo(country) {
    const container = $("#wikiLinks");
    try {
        const wikiData = await $.getJSON(`/project1/php/getWiki.php?country=${encodeURIComponent(country)}`);
        if (wikiData.status.code !== 200 || !wikiData.data) {
            container.text("Please select a country first to see related wikipedia articles.");
            $("#wiki-modalLoader").hide();
            return;
        }
        $("#wiki-modalLoader").show();
        container.empty(); // Clear previous links
        const template = document.getElementById("wikiTemplate");
        $("#wikiCountryName").text(country);

        const result = wikiData.data;
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
        if (timezoneData.status.code === 200 && timezoneData.data) {
            const tz = timezoneData.data.timezone;
            const countryName = timezoneData.data.name;
            const now = new Date();
            const localTime = now.toLocaleTimeString("en-GB", { //get GB time
                timeZone: tz,
                hour12: false
            })
            //console.log(`Local time in ${countryName}:`, localTime);
            //sends time to countryTime div
            $("#countryTime").text(localTime);
        } else {
            console.log(timezoneData.status.message);
            $("#countryTime").text("Failed to retrieve local time");
        }
    } catch (error) {
        console.log("Failed to retrieve timezone data", error);
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

//POI ICONS FROM ICONS FOLDER
const poiIcons = {
    //TOURISM ICON
    tourism: L.icon({
        iconUrl: './icons/tourism.png',
        iconSize: [25, 25],
    }),
    //RELIGION ICON
    religion: L.icon({
        iconUrl: './icons/religion.png',
        iconSize: [25, 25],
    }),
    airport: L.icon({
        iconUrl: './icons/airplane.png',
        iconSize: [25, 25],
    }),
    //DEFAULT ICON
    default: L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [20, 20],
    })
};

//Gets pois from capitals latitude and longitude with a radius of 5000m using geoapify api - geonames didn't work as it only let me use a radius of 1
async function getPOIs(iso2) {

    $.getJSON(`/project1/php/getPOIs.php?iso2=${iso2}`).done(response => {

        if (!response.data || !response.data.pois) {
            console.log("No POIs found for country: ", iso2);
            return;
        }

        //clear POIs with country change
        tourismLayer.clearLayers();
        religionLayer.clearLayers();
        airportLayer.clearLayers();

        response.data.pois.forEach(poi => {
            const { lat, lng, name, type = "tourism" } = poi;
            // Default icon
            let icon = poiIcons.default;
            let targetLayer = null;

            // specific categories = category icon
            if (type === "tourism") {
                icon = poiIcons.tourism;
                targetLayer = tourismLayer;
            } else if (type === "religion") {
                icon = poiIcons.religion;
                targetLayer = religionLayer;
            }
            else if (type === "airport") {
                icon = poiIcons.airport; // Use default icon for airports
                targetLayer = airportLayer;
            }
            if (targetLayer) {
                L.marker([lat, lng], { icon: icon })
                    .bindPopup(`<strong>${name}</strong>`)
                    .addTo(targetLayer);
            }
        });
    }).fail(err => {
        console.error("Error fetching POIs:", error);
    })
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
    const usd = parseFloat($("#amountInput").val());
    if (isNaN(usd) || currentExchangeRate === null) {
        $("#convertedAmount").val("");
        return;
    }

    const converted = usd * currentExchangeRate;
    $("#convertedAmount").val(converted.toFixed(2));
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + "...";
}

function showMapLoader() {
    $("#mapLoader").show();
}

function hideMapLoader(){
    $("#mapLoader").hide();
}