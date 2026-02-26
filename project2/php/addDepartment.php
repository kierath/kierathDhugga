<?php
	// e.g. http://localhost/project2/php/addDepartment.php?departmentName=Accounting&locationID=1
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
	if(empty($_POST['departmentName']) || empty($_POST['locationID'])) {
		sendJSONResponse(400, "failure", "Add department missing required parameters", $executionTime, [], $conn["conn"]);
		exit;
	}

	$departmentName = trim($_POST['departmentName']);
	$locationID = $_POST['locationID'];

	//check if department already exists in same location ERROR 400
	$checkQuery = $conn["conn"]->prepare('SELECT id FROM department WHERE name = ? AND locationID = ?');
	if(!$checkQuery) {
		sendJSONResponse(400, "failure", "Add department query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}

	$checkQuery->bind_param("si", $departmentName, $locationID);
	$checkQuery->execute();
	$result = $checkQuery->get_result();

	if ($result->num_rows > 0) {
		sendJSONResponse(400, "failure", "Department already exists in this location", $executionTime, [
			"error" => "Department already exists in this location"
		], $conn["conn"]);
		exit;
	}

	$checkQuery->close();

	$query = $conn["conn"]->prepare('INSERT into department (name, locationID) VALUES (?, ?)');

	//query preparation ERROR 400
	if(!$query) {
		sendJSONResponse(400, "failure", "Add department query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}
                        //string s = s, integers = i
	$query->bind_param("si", $departmentName, $locationID);

	$success = $query->execute();
	
	//failed ERROR 400
	if (!$success) {
		sendJSONResponse(400, "failure", "Add department query execution failed", $executionTime, [
			"error" => $query->error
		], $conn["conn"]);
		exit;
	}

	$departmentID = $conn["conn"]->insert_id;

	$query->close();

	//success 200!
	sendJSONResponse(200, "ok", "Department added successfully", $executionTime, 
	[
		"id" => $departmentID,
		"name" => $departmentName,
		"locationID" => $locationID
	], $conn["conn"]);

?>