<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

//THIS FILE USES NEWSDATA API TO GET COUNTRY NEWS BASED ON COUNTRY https://newsdata.io/
require_once __DIR__ . "/libs.php";

//gets API key from config.php
$config = require_once __DIR__ . "/../config.php";
$apiKey = $config["countryNews_API_KEY"];

if(!$apiKey){
    respond(500, "error", "NewsData API key not available");
}

$iso2 = $_GET["iso2"] ?? '';
$countryName = $_GET["country"] ?? '';

if(!$iso2 || !$countryName){
   respond(400, "error", "No country provided");
}

$url = "https://newsdata.io/api/1/latest" . "?apikey=$apiKey" . "&country=" . urlencode($iso2) . "&q=" . urlencode($countryName) . "&language=en";

$response = callApi($url);

if($response === false){
    respond(500, "error", "Failed to reach TimezoneDB API");
}

$data = json_decode($response, true);

if(!isset($data["results"]) || empty ($data["results"])){
    respond(404, "error", "No news found for this country");
}

$newsArticles = [];
$maxDescriptionLength = 300; // Limit description to 300 characters

foreach($data["results"] as $article){

    $title = $article["title"] ?? "No title";
    $description = $article["description"] ?? "No description";

    if(strlen($description) > $maxDescriptionLength){
        $description = substr($description, 0, $maxDescriptionLength) ."...";
    }
    
    $newsArticles[] = [
        "title" => $title,
        "description" => $article["description"] ?? "No description",
        "link" => $article["link"] ?? "#",
        "pubDate" => $article["pubDate"] ?? "No date",
        "image" => $article["image_url"] ?? null
    ];

    if(count($newsArticles) >= 5){
        break; // Limit to 5 articles CHANGE AFTER
    }
}

$result = [
    "country" => $iso2,
    "articles" => $newsArticles,
    "image" => $data["results"][0]["image_url"] ?? null,
];

respond(200, "success", "Timezone loaded successfully", $result);
?>