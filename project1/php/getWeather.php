<?php
header("Content-Type: application/json");

$config = require_once __DIR__ . "/../config.php";
$apiKey = $config["weather_API_KEY"];

$capital = $_GET["capital"] ?? '';

$getCoordUrl = "https://api.openweathermap.org/geo/1.0/direct?q=" . urlencode($capital) . "&limit=1&appid=" . $apiKey;
$getCoordResponse = file_get_contents($getCoordUrl);
$getCoordData = json_decode($getCoordResponse, true);

if (empty($getCoordData)) {
    echo json_encode(["error" => "Weather data not found"]);
    exit;
}

$lat = $getCoordData[0]["lat"];
$lng = $getCoordData[0]["lon"];

// Current weather
$weatherUrl = "https://api.openweathermap.org/data/2.5/weather?lat=$lat&lon=$lng&units=metric&appid=$apiKey";
$weatherData = json_decode(file_get_contents($weatherUrl), true);

$icon = $weatherData["weather"][0]["icon"] ?? null;
$iconUrl = $icon ? "http://openweathermap.org/img/wn/$icon@2x.png" : null;

// 5-day forecast
$forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?lat=$lat&lon=$lng&units=metric&appid=$apiKey";
$forecastData = json_decode(file_get_contents($forecastUrl), true);

$dailyForecast = [];
$tempByDay = [];

// Process forecast data to get daily min/max and description along with icon
if (!empty($forecastData["list"])) {
    foreach ($forecastData["list"] as $entry) {
        $date = date("d/m", $entry["dt"]);
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

echo json_encode([
    "temperature" => $weatherData["main"]["temp"] ?? "N/A",
    "feels_like" => $weatherData["main"]["feels_like"] ?? "N/A",
    "description" => ucfirst($weatherData["weather"][0]["description"]) ?? "N/A",
    "humidity" => $weatherData["main"]["humidity"] ?? "N/A",
    "wind_speed" => $weatherData["wind"]["speed"] ?? "N/A",
    "icon_url" => $iconUrl,
    "capital" => $capital,
    "forecast" => $dailyForecast
]);
?>
