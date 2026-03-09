<?php

	// example use from browser
	// http://localhost/project2/php/getDepartmentByID.php?id=<id>

	// remove next two lines for production	

	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	include("libs.php");

	//start timer to calculate execution time of script
	$executionTime = microtime(true);
	$conn = dbConnect();

	//database connection ERROR 300
	if ($conn["error"]) {
		sendJSONResponse(300, "failure", "database unavailable", $executionTime, [], null);
		exit;
	}

	if(empty($_GET['id'])) {
		sendJSONResponse(400, "failure", "get department, id cannot be empty", $executionTime, [], $conn["conn"]);
		exit;
	}

	$query = $conn["conn"]->prepare('
				SELECT d.id, d.name AS departmentName, d.locationID, l.name AS locationName
				FROM department d 
				LEFT JOIN location l ON d.locationID = l.id
				WHERE d.id =  ?');

	//query preparation ERROR 400
	if (!$query) {
		sendJSONResponse(400, "failure", "Get department query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}

	$query->bind_param("i", $_GET['id']);

	$success = $query->execute();
	
	//database execution query ERROR 400
	if (!$success) {
		sendJSONResponse(400, "failure", "Get department query execution failed", $executionTime, [
			"error" => $query->error
		], $conn["conn"]);
		exit;
	}
   
  	$result = $query->get_result();

   	$data = [];

	//data array population
	while ($row = mysqli_fetch_assoc($result)) {
		array_push($data, $row);
	}

	//get all locations for dropdown population in edit form
	$allLocations = $conn["conn"]->prepare('SELECT id AS locationID, name from location ORDER BY name');

	//all locations query preparation ERROR 400
	if(!$allLocations) {
		sendJSONResponse(400, "failure", "Get all locations query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}

	$locSuccess = $allLocations->execute();

	//locations query execution ERROR 400
	if (!$locSuccess) {
		sendJSONResponse(400, "failure", "Get all locations query execution failed", $executionTime, [
			"error" => $allLocations->error
		], $conn["conn"]);
		exit;
	}

	$locations = [];

	$locResult = $allLocations->get_result();

	//data array population for locations
	while ($row = mysqli_fetch_assoc($locResult)) {
		array_push($locations, $row);
	}

	$query->close();
	$allLocations->close();

	//success 200!
	sendJSONResponse(200, "success", "Department retrieved successfully", $executionTime, ['department' => $data[0], 'locations' => $locations], $conn["conn"]);

?>