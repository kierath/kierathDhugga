<?php
header("Content-Type: application/json");

//need to figure how to add to .env
$username = "kierathkd";
//figure action based on swith case
$action = $_POST["action"] ?? "";

switch($action){
    case "nearby":
        getNearbyPlace();
        exit;
    
    case "ocean":
        getOceanSea();
        exit;
    
    case "weather":
        getWeather();
        exit;

    default:
        echo json_encode([
            "status" => [
                "name" => "error",
                "description" => "Invalid action"
            ]
            ]);
            exit;
}

function getNearbyPlace(){
    global $username;
    //gets coords
    $lat = isset($_POST["lat"]) ? floatval($_POST["lat"]) : null;
    $lng = isset($_POST["lng"]) ? floatval($_POST["lng"]) : null;

    //Error if null
    if($lat === null || $lng === null) {
        echo json_encode([
            "status"=> [
                "name" => "error",
                "description" => "Missing coordinates" 
                ]
            ]);
            exit;
    }

    //otherwise builds the API call
    $url = "http://api.geonames.org/findNearbyPlaceNameJSON?" 
    . "lat=" . urlencode($lat) 
    . "&lng=" . urlencode($lng) 
    . "&username=" . urlencode($username)
    . "&style=full";
    
    //calls API
    callApi($url);
}

function getOceanSea(){
    global $username;

    $lat = isset($_POST["lat"]) ? floatval($_POST["lat"]) : null;
    $lng = isset($_POST["lng"]) ? floatval($_POST["lng"]) : null;

    //Error if null
    if($lat === null || $lng === null) {
        echo json_encode([
            "status"=> [
                "name" => "error",
                "description" => "Missing coordinates" 
                ]
            ]);
            exit;
    }

    //otherwise builds the API call
    $url = "http://api.geonames.org/oceanJSON?" 
    . "lat=" . urlencode($lat) 
    . "&lng=" . urlencode($lng) 
    . "&username=" . urlencode($username)
    . "&style=full";
    
    //calls API
    callApi($url);
}

function getWeather(){
    global $username;

    $north = isset($_POST["north"]) ? floatval($_POST["north"]) : null;
    $south = isset($_POST["south"]) ? floatval($_POST["south"]) : null;
    $east = isset($_POST["east"]) ? floatval($_POST["east"]) : null;
    $west  = isset($_POST["west"]) ? floatval($_POST["west"]) : null;

    //Error if null
    if($north === null || $south === null || $east === null || $west === null) {
        echo json_encode([
            "status"=> [
                "name" => "error",
                "description" => "Missing information" 
                ]
            ]);
            exit;
    }

    //otherwise builds the API call
    $url = "http://api.geonames.org/weatherJSON?" 
    . "north=" . urlencode($north) 
    . "&south=" . urlencode($south) 
    . "&east=" . urlencode($east) 
    . "&west=" . urlencode($west) 
    . "&username=" . urlencode($username)
    . "&style=full";
    
    //call API
    callApi($url);
}
    
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
        echo $response; //sends JSON response
    } else //error
    {
        echo json_encode(["error" => "Failed to fetch data from Geonames API"]);
    }
}

?>