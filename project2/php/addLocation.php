<?php
	//http://localhost/project2/php/addLocation.php?locationName=<locationName>
	// remove next two lines for production
	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	include("libs.php");

	//start timer to calculate execution time of script
	$executionTime = microtime(true);
	$conn = dbConnect();

	//database connection ERROR 300
	if ($conn["error"]) {
		sendJSONResponse(300, "failure", "database unavailable", $executionTime);
		exit;
	}
	
	//missing required parameters ERROR 400
	if(empty($_POST['locationName'])) {
		sendJSONResponse(400, "failure", "Add location missing required parameters", $executionTime, [], $conn["conn"]);
		exit;
	}

	$locationName = trim($_POST['locationName']);

	//check if location already exists ERROR 400
	$checkQuery = $conn["conn"]->prepare('SELECT id FROM location WHERE name = ?');
	if(!$checkQuery) {
		sendJSONResponse(400, "failure", "Add location query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}

	$checkQuery->bind_param("s", $_POST['locationName']);
	$checkQuery->execute();
	$result = $checkQuery->get_result();

	$checkQuery->close();

	if ($result->num_rows > 0) {
		sendJSONResponse(400, "failure", "Location already exists", $executionTime, [
			"error" => "Location already exists"
		], $conn["conn"]);
		exit;
	}

	$query = $conn["conn"]->prepare('INSERT into location (name) VALUES (?)');

    //query preparation ERROR 400
	if(!$query) {
		sendJSONResponse(400, "failure", "Add location query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error], $conn["conn"]);
		exit;
	}

                        //string s = s, integers = i
	$query->bind_param("s", $_POST['locationName']);

	$success = $query->execute();
	
	//failed ERROR 400
	if (!$success) {
	sendJSONResponse(400, "failure", "Add location query execution failed", $executionTime, [
		"error" => $query->error], $conn["conn"]);
	exit;
	}

	$query->close();

	//success 200!
	sendJSONResponse(200, "ok", "Location added successfully", $executionTime, [
		"newLocationName"=> $locationName,
	], $conn["conn"]);


?>