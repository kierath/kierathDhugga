<?php
header("Content-Type: application/json");
//THIS FILE USES GEOAPIFY API using lat, longitude, radius and categories to get top pois by top popularity and importance

//gets API key from config.php
$config = require_once __DIR__ . "/../config.php";
$apiKey = $config["poi_API_KEY"]; 

//get lat, lng, radius
$lat = $_GET['lat'];
$lng = $_GET['lng'];
$radius = $_GET['radius'] ?? 5000; //default is 5000m

if (!$lat || !$lng) {
    echo json_encode(["error" => "Latitude and Longitude are required."]);
    exit;
}

//geoapify category tourism
$categories = "tourism";

$url = "https://api.geoapify.com/v2/places?categories={$categories}&filter=circle:{$lng},{$lat},{$radius}&limit=20&lang=en&apiKey={$apiKey}";


$response = callApi($url);
if ($response === false) {
    echo json_encode(["error" => "Failed to fetch POIs."]);
    exit;
}

$data = json_decode($response, true);

//famous poi array
$famousPOIs = [];

foreach ($data['features'] as $poi) {
    $properties = $poi['properties'];
    
    // assigns first available value English name, default name, address line or description
    $poiName = $properties['name_international']['en'] ?? $properties['name'] ?? $properties['address_line1'] ?? $properties['description'];
    //if no name go to the next one
    if (!$poiName) continue;

    // Check the importance and popularity rank
    $importance = $properties['rank']['importance'] ?? 0;
    $popularity = $properties['rank']['popularity'] ?? 0;
    $isFamousByRank = $importance > 0.70 || $popularity > 85;

    // Check if the POI fits into relevant categories
    $categories = $properties['categories'] ?? [];
    $isFamousByCategory = false;
    foreach ($categories as $category) {
        //if category contains certain categories if so $isfamousByCategory is true
        if (strpos($category, "tourism.sights") !== false ||
            strpos($category, "tourism.attraction") !== false ||
            strpos($category, "historic") !== false ||
            strpos($category, "memorial") !== false ||
            strpos($category, "tower") !== false) {
            $isFamousByCategory = true;
            break;
        }
    }

    // POI if famous by rank or category
    if ($isFamousByRank || $isFamousByCategory) {
        $famousPOIs[] = [
            "name" => $poiName,
            "lat" => $poi['geometry']['coordinates'][1],
            "lng" => $poi['geometry']['coordinates'][0],
            "categories" => $categories
        ];
    }
}

echo json_encode(['pois' => $famousPOIs]);
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