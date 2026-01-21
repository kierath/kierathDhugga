<?php
header("Content-Type: application/json");
//THIS FILE USES REST COUNTRIES API TO GET COUNTRY INFO BASED ON ISO2 CODE https://restcountries.com/#endpoints-all & https://openexchangerates.org/

if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || 
    strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest') {

    //if not ajax request back to home page
    $iso2 = $_GET['iso2'] ?? '';
    header("Location: /project1/");
    exit;
}

if(!isset($_GET["iso2"])){
    echo json_encode(["error" => "No ISO2 code provided"]);
    exit;
}


//gets ISO2 code from query parameter
$iso2 = $_GET["iso2"];

$url = "https://restcountries.com/v3.1/alpha/" . urlencode($iso2);
$response = callApi($url);
$data = json_decode($response, true);

//checks country data, if no country then returns the error
$country = $data[0] ?? null;
if(!$country){
    echo json_encode(["error" => "Country not found"]);
    exit;
}

//currency array, if the arry is empty set to N/A else get currency names
$currencies = [];
if(!empty($country["currencies"])){
    foreach($country["currencies"] as $currency){
        $name  = $currency["name"] ?? "N/A";
        $symbol = $currency["symbol"] ?? "";
        $currencies[]= $name . ", " . $symbol;
    }
} else {
    $currencies[] = "N/A";
}

$currencyCode = key($country["currencies"] ?? []);
$rates = getExchangeRates();
if(!$currencyCode || !isset($rates["GBP"]) || !isset($rates[$currencyCode])){
    $exchangeRate = "N/A";
} else {
    $exchangeRate = $rates[$currencyCode] / $rates["GBP"];
}

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

echo json_encode($result);

//function to get exchange rate from Open Exchange Rates API
function getExchangeRates(){
    $config = include __DIR__ . "/../config.php";
    $apiKey = $config["exchangeRate_API_KEY"] ?? null;

    if (!$apiKey) {
        return [];
    }

    $url = "https://openexchangerates.org/api/latest.json?app_id=" . urlencode($apiKey);
    $response = callApi($url);
    $data = json_decode($response, true);

    return $data["rates"] ?? [];
}


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