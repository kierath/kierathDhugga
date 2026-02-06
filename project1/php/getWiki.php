<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
//THIS FILE USES WIKI API TO GET WIKI INFO ASED ON THE CAPITAL https://en.wikipedia.org/api/rest_v1/

require_once __DIR__ . "/libs.php";

if(!isset($_GET["country"]) || empty($_GET["country"])){
    respond(400, "error", "No country provided");
}

$country = $_GET["country"];

$url = "https://en.wikipedia.org/api/rest_v1/page/summary/" . rawurlencode($country);

$response = callApi($url);

if($response === false){
    respond(500, "error", "Failed to reach Wikipedia API");
}

$data = json_decode($response, true);

if(!$data || isset($data["status"])){
    respond(404, "error", "Country not found");
}

if(isset($data["type"]) && $data["type"] === "disambiguation"){
    respond(404, "error", "Disambiguation page found");
}
if(!isset($data["extract"])){
    respond(404, "error", "No summary found");
}

$result = [
            "title" => $data["title"],
            "summary" => $data["extract"],
            "image" => $data["thumbnail"]["source"] ?? null,
            "link" => $data["content_urls"]["desktop"]["page"] ?? null
];

respond(200, "success", "Wiki information loaded successfully", $result);

?>