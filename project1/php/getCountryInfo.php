<?php
header("Content-Type: application/json");
//THIS FILE USES REST COUNTRIES API TO GET COUNTRY INFO BASED ON ISO2 CODE https://restcountries.com/#endpoints-all

//gets ISO2 code from query parameter
$iso2 = $_GET["iso2"];

if(!isset($_GET["iso2"])){
    echo json_encode(["error" => "No ISO2 code provided"]);
    exit;
}

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

//result array with country info
$result = [
    "name" => $country["name"]["common"] ?? "N/A",
    "capital" => $country["capital"][0] ?? "N/A",
    "region" => $country["region"] ?? "N/A",
    "population" => $country["population"] ?? 0,
    "currencies" => $currencies,
    "lat" => $country["capitalInfo"]["latlng"][0] ?? null,
    "lng" => $country["capitalInfo"]["latlng"][1] ?? null,

];

echo json_encode($result);

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