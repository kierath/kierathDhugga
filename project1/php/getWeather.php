<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . "/libs.php";
$config = require_once __DIR__ . "/../config.php";
$apiKey = $config["weather_API_KEY"];

if(!$apiKey){
    respond(500, "error", "Weather API key not available");
}

$capital = $_GET["capital"] ?? '';

//if there is not capital 
if(!isset($_GET["capital"]) || trim($_GET["capital"]) === ""){
    respond(400, "error", "No capital city provided");
    exit;
}

$getCoordUrl = "https://api.openweathermap.org/geo/1.0/direct?q=" . urlencode($capital) . "&limit=1&appid=" . $apiKey;
$getCoordResponse = callApi($getCoordUrl);
$getCoordData = json_decode($getCoordResponse, true);

if (empty($getCoordData)) {
    respond(404, "error", "Weather data not found");
}

$lat = $getCoordData[0]["lat"];
$lng = $getCoordData[0]["lon"];

// Current weather
$weatherUrl = "https://api.openweathermap.org/data/2.5/weather?lat=$lat&lon=$lng&units=metric&appid=$apiKey";
$weatherResponse = callApi($weatherUrl);
if($weatherResponse === false){
    respond(500, "error", "Failed to fetch current weather");
}

$weatherData = json_decode($weatherResponse, true);

if(!$weatherData) {
    respond(500, "error", "Invalid weather data");
}

$icon = $weatherData["weather"][0]["icon"] ?? null;
$iconUrl = $icon ? "http://openweathermap.org/img/wn/$icon@2x.png" : null;

// 5-day forecast
$forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?lat=$lat&lon=$lng&units=metric&appid=$apiKey";
$forecastResponse = callApi($forecastUrl);
$forecastData = json_decode($forecastResponse, true);

$dailyForecast = [];
$tempByDay = [];

// Process forecast data to get daily min/max and description along with icon
if (!empty($forecastData["list"])) {
    foreach ($forecastData["list"] as $entry) {
        $date = date("Y-m-d", $entry["dt"]);
        $min = $entry["main"]["temp_min"];
        $max = $entry["main"]["temp_max"];
        $desc = $entry["weather"][0]["description"];
        $icon = $entry["weather"][0]["icon"];

        if (!isset($tempByDay[$date])) {
            $tempByDay[$date] = ["temp_min"=>$min, "temp_max"=>$max, "desc"=>$desc, "icon"=>$icon];
        } else {
            $tempByDay[$date]["temp_min"] = min($tempByDay[$date]["temp_min"], $min);
            $tempByDay[$date]["temp_max"] = max($tempByDay[$date]["temp_max"], $max);
        }
    }
    //For 7 days
    $count = 0;
    foreach ($tempByDay as $date => $info) {
        if ($count >= 7) break;
        $dailyForecast[] = [
            "date" => $date,
            "temp_min" => $info["temp_min"],
            "temp_max" => $info["temp_max"],
            "description" => ucfirst($info["desc"]),
            "icon_url" => "http://openweathermap.org/img/wn/".$info["icon"]."@2x.png"
        ];
        $count++;
    }
}

$result = [
    "temperature" => $weatherData["main"]["temp"] ?? "N/A",
    "feels_like" => $weatherData["main"]["feels_like"] ?? "N/A",
    "description" => ucfirst($weatherData["weather"][0]["description"]) ?? "N/A",
    "humidity" => $weatherData["main"]["humidity"] ?? "N/A",
    "wind_speed" => $weatherData["wind"]["speed"] ?? "N/A",
    "icon_url" => $iconUrl,
    "capital" => $capital,
    "forecast" => $dailyForecast,
];

respond(200, "success", "Weather data loaded successfully", $result);
?>
