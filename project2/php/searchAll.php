<?php
    //http://localhost/project2/php/searchAll.php?txt=<txt>&departmentID=<departmentID>&locationID=<locationID>
    ini_set('display_errors', 'On');
    error_reporting(E_ALL);

    include("libs.php");

    $executionTime = microtime(true);
    $conn = dbConnect();

    if ($conn["error"]) {
        sendJSONResponse(300, "failure", "database unavailable", $executionTime, [], null);
        exit;
    }

    $txt = empty($_GET['txt']) ? "%" : "%" . $_GET['txt'] . "%";
    $departmentID = empty($_GET['departmentID']) ? null : $_GET['departmentID'];
    $locationID = empty($_GET['locationID']) ? null : $_GET['locationID'];

    $query = $conn["conn"]->prepare('SELECT 
        p.id, p.firstName, p.lastName, p.email, p.jobTitle,
        d.id AS departmentID, d.name AS departmentName,
        l.id AS locationID, l.name AS locationName
        FROM personnel p
        LEFT JOIN department d ON d.id = p.departmentID
        LEFT JOIN location l ON l.id = d.locationID
        WHERE (p.firstName LIKE ? 
           OR p.lastName LIKE ? 
           OR p.email LIKE ? 
           OR p.jobTitle LIKE ? 
           OR d.name LIKE ? 
           OR l.name LIKE ?)
        AND (p.departmentID = ? OR ? IS NULL)
        AND (d.locationID = ? OR ? IS NULL)
        ORDER BY p.lastName, p.firstName, d.name, l.name');

    if (!$query) {
        sendJSONResponse(400, "failure", "Search all query preparation failed", $executionTime, [], $conn["conn"]);
        exit;
    }

    $query->bind_param("ssssssiiii", $txt, $txt, $txt, $txt, $txt, $txt, $departmentID, $departmentID, $locationID, $locationID);

    $success = $query->execute();

    if (!$success) {
        sendJSONResponse(400, "failure", "Search all query execution failed", $executionTime, [
            "error" => $query->error
        ], $conn["conn"]);
        exit;
    }

    $result = $query->get_result();

    $found = [];

    while ($row = mysqli_fetch_assoc($result)) {
        array_push($found, $row);
    }

    $query->close();

    sendJSONResponse(200, "success", "search all query executed successfully", $executionTime, [
        "found" => $found
    ], $conn["conn"]);
?>