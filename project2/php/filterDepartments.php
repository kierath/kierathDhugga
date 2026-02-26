<?php
	//http://localhost/project2/php/filterDepartments.php?locationID=<locationID>
	// remove next two lines for production
	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	include("libs.php");

	$executionTime = microtime(true);
	$conn = dbConnect();

	//database connection ERROR 300
	if ($conn["error"]) {
		sendJSONResponse(300, "failure", "database unavailable", $executionTime);
		exit;
	}

    $locationID = empty($_GET['locationID']) ? null : $_GET['locationID'];

	$query = $conn["conn"]->prepare('SELECT
                d.id, d.name, l.name AS location
                FROM department d
                LEFT JOIN location l ON l.id = d.locationID
                WHERE (d.locationID = ? OR ? IS NULL)
                ORDER BY d.name');

	//database query preparation ERROR 400
	if(!$query) {
		sendJSONResponse(400, "failure", "Filter departments query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}

	$query->bind_param("ii", $locationID, $locationID);

	$success = $query->execute();
	
	//database execution query ERROR 400
	if (!$success) {
		sendJSONResponse(400, "failure", "Filter departments query execution failed", $executionTime, [
			"error" => $query->error
		], $conn["conn"]);
		exit;
	}
    
	$result = $query->get_result();

   	$departments = [];

	//department array population
	while ($row = mysqli_fetch_assoc($result)) {
		array_push($departments, $row);
	}

	$query->close();

	//success 200
	sendJSONResponse(200, "success", "departments retrieved and filtered successfully", $executionTime, [
		"departments" => $departments
		], $conn["conn"]);

?>