<?php

ini_set('display_errors', 'On');
error_reporting(E_ALL);

function dbConnect() {
    include("config.php");

    $conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port, $cd_socket);

    if ($conn->connect_errno) {
        return [
            "error" => true,
            "conn" => null
        ];
    }

    return [
        "error" => false,
        "conn" => $conn
    ];
}

function sendJSONResponse($code, $name, $description, $executionTime, $data = [], $conn = null) {
    if ($conn) {
        mysqli_close($conn);
    }

    header('Content-Type: application/json; charset=UTF-8');

    $output = [
        "status" => [
            "code" => $code,
            "name" => $name,
            "description" => $description,
            "returnedIn" => (microtime(true) - $executionTime) / 1000 . " ms"
        ],
        "data" => $data
    ];

    echo json_encode($output);
    exit;
}
?>