<?php
header("Content-Type: application/json");
//THIS FILE USES REST COUNTRIES API TO GET COUNTRY FLAG BASED ON ISO2 CODE https://restcountries.com/

if(!isset($_GET["iso2"])){
    echo json_encode(["error" => "No ISO2 code provided"]);
    exit;
}

$iso2 = $_GET["iso2"];

$url = "https://restcountries.com/v3.1/alpha/" . urlencode($iso2);

$response = callApi($url);
$data = json_decode($response, true);

//if data empty then no flag found
if(empty($data[0]["flags"]["png"])){
    echo json_encode(["error" => "Flag not found"]);
    exit;
}

//first flag png
$flag = $data[0]["flags"]["png"];

echo json_encode([
    "flag" => $flag
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