<?php
	// http://localhost/project2/php/searchDepartments.php?txt=<txt>
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

	if(empty($_GET['txt'])) {
		sendJSONResponse(400, "failure", "search departments, txt cannot be empty", $executionTime, [], $conn["conn"]);
		exit;
	}

	$query = $conn["conn"]->prepare('
		SELECT 
		d.id AS departmentID, 
		d.name AS departmentName, 
		l.name AS locationName
        FROM department d 
		LEFT JOIN location l ON l.id = d.locationID
        WHERE (d.name LIKE ? OR l.name LIKE ?)
		ORDER BY d.name
    ');
                            
  	$likeText = "%" . $_GET['txt'] . "%";

  	$query->bind_param("ss", $likeText, $likeText);

	$result = $query->execute();
	
	//database execution query ERROR 400
	if (!$result) {
		sendJSONResponse(400, "failure", "Search departments query execution failed", $executionTime, [
			"error" => $query->error
		], $conn["conn"]);
		exit;
	}
    
	$result = $query->get_result();

  	$found = [];

	//pushed array to found
	while ($row = mysqli_fetch_assoc($result)) {
		array_push($found, $row);
	}

	$query->close();

	//success 200
	sendJSONResponse(200, "success", "search departments query executed successfully", $executionTime, 
	["found" => $found], $conn["conn"]);

?>