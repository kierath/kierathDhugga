<?php
	// http://localhost/project2/php/getAll.php
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

	$query = $conn["conn"]->prepare('SELECT p.id, p.lastName, p.firstName, p.jobTitle, p.email, d.name as department, l.name as location 
									 FROM personnel p LEFT JOIN department d ON (d.id = p.departmentID) 
									 LEFT JOIN location l ON (l.id = d.locationID) 
									 ORDER BY p.lastName, p.firstName, d.name, l.name');

	//query preparation ERROR 400
	if (!$query) {
		sendJSONResponse(400, "failure", "Get all query preparation failed", $executionTime, [], $conn["conn"]);
		exit;
	}

	$success = $query->execute();
	
	//query execution ERROR 400
	if (!$success) {
		sendJSONResponse(400, "failure", "Get allquery execution failed", $executionTime, [], $conn["conn"]);
		exit;
	}
   
	$result = $query->get_result();

   	$data = [];

	//fetch all rows and push to data array
	while ($row = mysqli_fetch_assoc($result)) {
		array_push($data, $row);
	}

	$query -> close();

	//success 200
	sendJSONResponse(200, "success", "All data retrieved successfully", $executionTime, $data, $conn["conn"]);

?>