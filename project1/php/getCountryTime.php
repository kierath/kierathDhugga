<?php
header("Content-Type: application/json");
//THIS FILE USES TIMEZONEDB API TO GET COUNTRY TIME BASED ON ISO2 CODE https://timezonedb.com/api
//gets ISO2 code from query parameter

//gets API key from config.php
$config = require_once __DIR__ . "/../config.php";
$apiKey = $config["timeZone_API_KEY"];

if(!isset($_GET["iso2"]) || (!isset($_GET["name"]))){
    echo json_encode(["error" => "No ISO2 code or country name provided"]);
    exit;
}

$iso2 = $_GET["iso2"];
$name = $_GET["name"];
$url = "https://api.timezonedb.com/v2.1/list-time-zone?key={$apiKey}&format=json&country=" . urlencode($iso2);
$response = callApi($url);
$data = json_decode($response, true);

//if data zones not empty else no time zone found
if(!empty($data["zones"])) {
    $timezone = $data["zones"][0]["zoneName"];
    echo json_encode([
        "timezone" => $timezone,
        "name" => $name
    ]);
} else {
    echo json_encode([
        "error" => "No timezone found",
        "name" => $name
    ]);
}

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