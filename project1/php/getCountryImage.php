<?php
header("Content-Type: application/json");
//THIS FILE USES UNSPLASH API TO GET COUNTRY FLAG BASED ON COUNTRY https://unsplash.com/developers

//gets API key from config.php
$config = require_once __DIR__ . "/../config.php";
$apiKey = $config["countryImage_API_KEY"];

if(!isset($_GET["country"])){
    echo json_encode(["error" => "No country provided"]);
    exit;
}

$country = $_GET["country"];
$limit = 10; //number of results to fetch
$url = "https://api.unsplash.com/search/photos?query=" . urlencode($country) . "&orientation=landscape&per_page=$limit&client_id=" . $apiKey;

$response = callApi($url);
$data = json_decode($response, true);

//if data results urls is empty return image not found
if(empty($data["results"][0]["urls"]["regular"])){
    echo json_encode(["error" => "Image not found"]);
    exit;
}

$images = [];

foreach ($data["results"] as $photo) {
    $images[] = [
        "image" => $photo["urls"]["regular"],
        "caption" => ucfirst($photo["description"] ?? "Photo of $country"), //capitalises the description as they all seem to have lowercase
        "photographer" => $photo["user"]["name"] ?? "" //if it says photo of country unknwon would look silly
    ];
}

echo json_encode([
    "country" => $country,
    "images" => $images
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