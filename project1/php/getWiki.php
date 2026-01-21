<?php
header("Content-Type: application/json");
//THIS FILE USES WIKI API TO GET WIKI INFO ASED ON THE CAPITAL https://en.wikipedia.org/api/rest_v1/

if(!isset($_GET["country"]) || empty($_GET["country"])){
    echo json_encode(["error" => "No country found"]);
    exit;
}

$country = $_GET["country"];

$url = "https://en.wikipedia.org/api/rest_v1/page/summary/" . rawurlencode($country);

$response = callApi($url);
$data = json_decode($response, true);

$results = [];

if(isset($data["type"]) && $data["type"] === "disambiguation"){
    echo json_encode(["error" => "Disambiguation page"]);
    exit;
}
if(!isset($data["extract"])){
    echo json_encode(["error" => "No summary found"]);
    exit;
}

echo json_encode([
    "results" => [
        [
            "title" => $data["title"],
            "summary" => $data["extract"],
            "image" => $data["thumbnail"]["source"] ?? null,
            "link" => $data["content_urls"]["desktop"]["page"] ?? null
        ]
    ]
]);

// --------------- cURL -------------------
function callApi($url){
    // Initialize new cURL session with given URL
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //return response as string
    curl_setopt($ch, CURLOPT_TIMEOUT, 10); //set timeout 10 seconds
    curl_setopt($ch, CURLOPT_USERAGENT, "Gazetteer/1.0 (kierath_dhugga@hotmail.co.uk)");

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