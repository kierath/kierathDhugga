<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
//THIS FILE USES GEONAMES API TO GET POIS

require_once __DIR__ . "/libs.php";

//gets username from config.php
$config = require_once __DIR__ . "/../config.php";
$username = $config["GEONAMES_USERNAME"];
//get country
$country = strtoupper($_GET["iso2"] ?? '');

if(!$username){
    respond(500, "error", "Geonames API not available invalid username");
}

if(!$country) {
    respond(404, "error", "Country not found");
}

$queries = [
    "tourism" => ["MUS", "MNMT"], 
    "religion" => ["RLG" ],
    "airport" => ["AIRP"]
];
$pois = [];

foreach ($queries as $q => $fcodes) { 
    foreach ($fcodes as $fcode) {
        $url = "http://api.geonames.org/searchJSON?fcode={$fcode}&country={$country}&maxRows=50&username={$username}";
        $response = callApi($url);

        if ($response === false) {
            respond(500, "error", "Failed to fetch POIs from Geonames API");
        }

        $data = json_decode($response, true);

        // Loop through results
        foreach ($data['geonames'] as $poi) {
            if (!isset($poi['name'], $poi['lat'], $poi['lng'])) {
                continue; 
            }

            $pois[] = [
                "name" => $poi["name"],
                "lat" => floatval($poi["lat"]),
                "lng" => floatval($poi["lng"]),
                "type" => $q
            ];
        }
    }
}

if(empty($pois)){
    respond(404, "error", "No POIs found for this country");
} else {
    $result = [
    'pois' => $pois
];
respond(200, "success", "Country information loaded successfully", $result);

}


?>