<?php
	// http://localhost/project2/php/getLocationByID.php?id=<id>
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
		sendJSONResponse(400, "failure", "get location, id cannot be empty", $executionTime, [], $conn["conn"]);
		exit;
	}

	$query = $conn["conn"]->prepare('SELECT l.id, l.name AS locationName FROM location l WHERE l.id =  ?');

	if (!$query) {
		sendJSONResponse(400, "failure", "Get location query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}

	$query->bind_param("i", $_GET['id']);

	$success = $query->execute();
	
	if (!$success) {
		sendJSONResponse(400, "failure", "Get location query execution failed", $executionTime, [
			"error" => $query->error
		], $conn["conn"]);
		exit;
	}

	$result = $query->get_result();
    
    $location = [];

	while ($row = mysqli_fetch_assoc($result)) {
		array_push($location, $row);
	}

	//success 200!
	sendJSONResponse(200, "success", "Location retrieved successfully", $executionTime, [
		"location" => $location
	], $conn["conn"]);

?>