<?php
header('Content-Type: application/json');

$username = "kierathkd";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $action = $_POST["action"] ?? "";

    if($action !== "nearby"){
        echo json_encode([
            "status"=> [
                "name" => "error",
                "description" => "Invalid action"
            ]
        ]);
        exit;
    }

    $lat = $_POST["lat"] ?? "";
    $lng = $_POST["lng"] ?? "";

    if($lat === "" || $lng === "") {
        echo json_encode([
            "status"=> [
                "name" => "error",
                "description" => "Missing coordinates" 
                ]
            ]);
            exit;
    }

    $url = "http://api.geonames.org/findNearbyPlaceNameJSON?" 
    . "lat=" . urlencode($lat) 
    . "&lng=" . urlencode($lng) 
    . "&username=" . urlencode($username)
    . "&style=full";
    
    // Initialize cURL session
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        echo $response;
    } else {
        echo json_encode(["error" => "Failed to fetch data from Geonames API"]);
    }
}
?>