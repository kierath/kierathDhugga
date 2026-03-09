<?php
	//http://localhost/project2/php/getPersonnelByID.php?id=<id>
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

	//validate id parameter
	if(empty($_GET['id'])) {
		sendJSONResponse(400, "failure", "get personnel by ID, id cannot be empty", $executionTime, [], $conn["conn"]);
		exit;
	}

	//get personnel by ID query
	$query = $conn["conn"]->prepare('SELECT `id`, `firstName`, `lastName`, `email`, `jobTitle`, `departmentID` FROM `personnel` WHERE `id` = ?');

	$query->bind_param("i", $_GET['id']);

	$success = $query->execute();
	
	if (!$success) {
		sendJSONResponse(400, "failure", "Get personnel by ID query execution failed", $executionTime, [
			"error" => $query->error
		], $conn["conn"]);
		exit;
	}
    
	$result = $query->get_result();

   	$personnel = [];

	while ($row = mysqli_fetch_assoc($result)) {
		array_push($personnel, $row);
	}

	$deptQuery = 'SELECT id, name from department ORDER BY name';

	$deptResult = $conn["conn"]->query($deptQuery);
	
	if (!$deptResult) {
		sendJSONResponse(400, "failure", "Get department query execution failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}
   
   	$department = [];

	while ($row = mysqli_fetch_assoc($deptResult)) {
		array_push($department, $row);
	}

	//success 200!
	sendJSONResponse(200, "success", "Personnel retrieved successfully", $executionTime, [
		"personnel" => $personnel, 
		"department" => $department
		], $conn["conn"]);

?>