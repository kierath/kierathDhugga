<?php
header("Content-Type: application/json");
//THIS FILE USES OPEN WEATHER GEOCODING API TO GET COUNTRY WEATHER https://openweathermap.org/api/geocoding-api

//gets api key from config.php
$config = require_once __DIR__ . "/../config.php";
$apiKey = $config["weather_API_KEY"];

$capital = $_GET["capital"];
$iso2 = $_GET["iso2"];

$getCoordUrl = "https://api.openweathermap.org/geo/1.0/direct?q=" . urlencode($capital) . "&limit=1&appid=" . $apiKey;

$getCoordResponse = callApi($getCoordUrl);
$getCoordData = json_decode($getCoordResponse, true);

if(empty($getCoordData)){
    echo json_encode(["error" => "Weather data not found"]);
    exit;
}

$lat = $getCoordData[0]["lat"];
$lng = $getCoordData[0]["lon"];

$weatherUrl = "https://api.openweathermap.org/data/2.5/weather?lat=" . urlencode($lat) . "&lon=" . urlencode($lng) . "&appid=" . $apiKey . "&units=metric";
$weatherResponse = callApi($weatherUrl);
$weatherData = json_decode($weatherResponse, true);

echo json_encode([
    "temperature" => $weatherData["main"]["temp"] ?? "N/A",
    "description" => ucfirst($weatherData["weather"][0]["description"]) ?? "N/A",
    "humidity" => $weatherData["main"]["humidity"] ?? "N/A",
    "wind_speed" => $weatherData["wind"]["speed"] ?? "N/A"
]);

// --------------- cURL -------------------
function callApi($url){
    // Initialize new cURL session with given URL
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //return response as string
    curl_setopt($ch, CURLOPT_TIMEOUT, 10); //set timeout 10 seconds

    $response = curl_exec($ch); 
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE); //HTTP response
    curl_close($ch);

    //successful HTTP 200
    if ($httpCode === 200) {
        return $response; //sends JSON response
    } else //error
    {
        return json_encode(["error" => "Failed to fetch data"]);
    }
}
?>