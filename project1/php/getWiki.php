<?php
header("Content-Type: application/json");
//THIS FILE USES WIKI API TO GET WIKI INFO ASED ON THE CAPITAL https://en.wikipedia.org/api/rest_v1/

if(!isset($_GET["country"]) || empty($_GET["country"])){
    echo json_encode(["error" => "No country found"]);
    exit;
}

$country = $_GET["country"];

$searchlimit = 10; //5 results

$url = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=" . urlencode($country) . "&utf8=&format=json&srlimit={$searchlimit}";

$response = callApi($url);
$data = json_decode($response, true);

$results = [];

//if search results then loop, get title, creates an url and store in results array
if(!empty($data["query"]["search"])){
    foreach($data["query"]["search"] as $item){

        $title = $item["title"];
        if(stripos($title, "disambiguation") !== false) {
            continue;
        }

        $summaryUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/" . rawurlencode($title);
        $summaryResult = callApi($summaryUrl);
        $summaryData = json_decode($summaryResult, true);

    $results[] = [
        "title" => $title,
        "link" => "https://en.wikipedia.org/wiki/" . str_replace(" ", "_", $item["title"]),
        "summary" => $summaryData["extract"] ?? "No summary available",
        "image" => $summaryData["thumbnail"]["source"] ?? null
        ];

    }
}

echo !empty($results) ? json_encode(["results" => $results]) : json_encode(["error" => "No results found"]);

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