<?php
header("Content-Type: application/json");
//THIS FILE USES GEO.JSON DATA

//gets data from geo.json file that was provided in portfolioSpecification-Gazetteer.pdf
$data = file_get_contents("../data/countryBorders.geo.json");
$json = json_decode($data, true);

//countries array
$countries = [];
$features = $json["features"]; //get the features first


foreach ($features as $feature) {
    //grabs country name and ISO2 code
    $name = $feature["properties"]["name"];
    $iso2 = $feature["properties"]["iso_a2"];
    $countries[] = [
        "name" => $name,
        "iso2" => $iso2
    ];
}
echo json_encode([
    "data" => $countries
]);
?>