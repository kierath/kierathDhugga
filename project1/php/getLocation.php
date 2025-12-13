<?php
header("Content-Type: application/json");
//THIS FILE USES OPEN CAGE API TO GET THE USERS LOCATION;

//gets API key from config.php
$config = require_once __DIR__ . "/../config.php";
$apiKey = $config["location_API_KEY"];

if(!isset($_GET["lat"]) || !isset($_GET['lng'])){
    echo json_encode([
        "error" => "Missing coordiantes"
    ]);
    exit;
}

//get latitude and longitude
$lat = $_GET["lat"];
$lng = $_GET["lng"];


$url = "https://api.opencagedata.com/geocode/v1/json?q=$lat+$lng&key=$apiKey";

$response = callApi($url);
$data = json_decode($response, true);

$country = $data["results"][0]["components"];
$countryCode = strtoupper($data["results"][0]["components"]["country_code"]); //strtoupper so all characters uppercase

echo json_encode([
    "country" => $country,
    "iso2" => $countryCode
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
