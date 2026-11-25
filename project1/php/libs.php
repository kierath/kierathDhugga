<?php 
//file for functions used in php files

// --------------- cURL -------------------
function callApi($url, $headers = []){
    // Initialize new cURL session with given URL
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); //return response as string
    curl_setopt($ch, CURLOPT_TIMEOUT, 10); //set timeout 10 seconds
    curl_setopt($ch, CURLOPT_USERAGENT, "Gazetteer/1.0 (kierath_dhugga@hotmail.co.uk)");

    if(!empty($headers)){
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }

    $response = curl_exec($ch); 
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE); //HTTP response
    $curlError = curl_error($ch);
    curl_close($ch);

    if($response === false){
        error_log("cURL error: " . $curlError);
        return false;
    }
    error_log("API HTTP CODE: $httpCode, Response: $response");
    if ($httpCode !== 200) {
        error_log("API HTTP error: " . $httpCode);
        return false;
    } 
    return $response;
}


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

//eror respond function
//200 = OK success
//400 = Bad Request - missing or invalid input
//404 = Not Found
//500 = API or server error
function respond($code, $name =null , $message = "", $data=null){
    echo json_encode ([
        "status" => [
            "code" => $code,
            "name" => $name,
            "message" => $message
        ],
        "data" => $data
    ]);
    exit;
}