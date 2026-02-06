<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
//THIS FILE USES REST COUNTRIES API TO GET COUNTRY INFO BASED ON ISO2 CODE https://restcountries.com/#endpoints-all & https://openexchangerates.org/
require_once __DIR__ . "/libs.php";

//gets ISO2 code from query parameter
$iso2 = $_GET["iso2"];

//if there is not iso2 
if(!isset($_GET["iso2"]) || trim($_GET["iso2"]) === ""){
    respond(400, "error", "No ISO2 code provided");
}

$url = "https://restcountries.com/v3.1/alpha/" . urlencode($iso2);
$response = callApi($url);

if($response === false){
    respond(500, "error", "Failed to reach Rest Countries API");
}

$data = json_decode($response, true);

if(!$data || isset($data["status"])){
    respond(404, "error", "Country not found");
}

//checks country data, if no country then returns the error
$country = $data[0] ?? null;
if(!$country){
    respond(404, "error", "Country not found");
}

//currency array, if the arry is empty set to N/A else get currency names
$currencies = [];
if(!empty($country["currencies"])){
    foreach($country["currencies"] as $currency){
        $name  = $currency["name"] ?? "N/A";
        //$symbol = $currency["symbol"] ?? "";
        $currencies[]= $name;
    }
} else {
    $currencies[] = "N/A";
}

$currencyCode = key($country["currencies"] ?? []);

if(!$currencyCode || trim($currencyCode) === ""){
    respond(400, "error", "No currency code provided");
    exit;
}

$rates = getExchangeRates();

if(!$currencyCode || !isset($rates["USD"]) || !isset($rates[$currencyCode])){
    $exchangeRate = "N/A";
    respond(404, "error", "Currency or USD rate not found");
} 

$exchangeRate = $rates[$currencyCode] / $rates["USD"];

$languages = !empty($country["languages"])
    ? array_values($country["languages"])
    : ["N/A"];


$area = $country["area"] ?? "N/A";

//result array with country info
$result = [
    "name" => $country["name"]["common"] ?? "N/A",
    "capital" => $country["capital"][0] ?? "N/A",
    "region" => $country["region"] ?? "N/A",
    "population" => $country["population"] ?? 0,
    "area" => $area,
    "languages" => $languages,
    "currencies" => $currencies,
    "lat" => $country["capitalInfo"]["latlng"][0] ?? null,
    "lng" => $country["capitalInfo"]["latlng"][1] ?? null,
    "currencyCode" => $currencyCode,
    "exchangeRate" => $exchangeRate,
];

respond(200, "success", "Country information loaded successfully", $result);

?>