<?php
	// http://localhost/project2/php/getAllDepartments.php
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

	$query = $conn["conn"]->prepare('SELECT 
				d.id, 
				d.name, 
				d.locationID, 
				l.name AS location 
			FROM department d 
			LEFT JOIN location l ON l.id = d.locationID 
			ORDER BY d.name, l.name');

	if (!$query) {
		sendJSONResponse(400, "failure", "Get departments query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}

	$success = $query->execute();
	
	//database query ERROR 400
	if (!$success) {
		sendJSONResponse(400, "failure", "Get departments query execution failed", $executionTime, [
			"error" => $query->error
		], $conn["conn"]);
		exit;
	}
   
  	$result = $query->get_result();

  	$data = [];

	while ($row = mysqli_fetch_assoc($result)) {
		array_push($data, $row);
	}

	$query->close();
	
	//success 200
	sendJSONResponse(200, "success", "Department data retrieved successfully", $executionTime, $data, $conn["conn"]);

?>