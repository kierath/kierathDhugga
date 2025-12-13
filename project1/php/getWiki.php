<?php
header("Content-Type: application/json");
//THIS FILE USES WIKI API TO GET WIKI INFO ASED ON THE CAPITAL https://en.wikipedia.org/api/rest_v1/

if(!isset($_GET["capital"]) || empty($_GET["capital"])){
    echo json_encode(["error" => "No capital found"]);
    exit;
}

$capital = $_GET["capital"];
$limit = 3; //top 3 results

$url = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=" . urlencode($capital) . "&utf8=&format=json&srlimit={$limit}";

$response = callApi($url);
$data = json_decode($response, true);

$results = [];

//if search results then loop, get title, creates an url and store in results array
if(!empty($data["query"]["search"])){
    foreach($data["query"]["search"] as $item){
        $results[] = [
            "title" => $item["title"],
            "link" => "https://en.wikipedia.org/wiki/" . str_replace(" ", "_", $item["title"])
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