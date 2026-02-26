<?php
	//http://localhost/project2/php/searchAll.php?txt=<txt>
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

	//if no search text provided, error 400
	if (empty($_GET['txt'])) {
		sendJSONResponse(400, "failure", "search all, txt cannot be empty", $executionTime, [], $conn["conn"]);
		exit;
	}

	$query = $conn["conn"]->prepare('SELECT 
        p.id, p.firstName, p.lastName, p.email, p.jobTitle,
        d.id AS departmentID, d.name AS departmentName,
        l.id AS locationID, l.name AS locationName
    	FROM personnel p
    	LEFT JOIN department d ON d.id = p.departmentID
    	LEFT JOIN location l ON l.id = d.locationID
    	WHERE p.firstName LIKE ? 
       	OR p.lastName LIKE ? 
       	OR p.email LIKE ? 
       	OR p.jobTitle LIKE ? 
       	OR d.name LIKE ? 
       	OR l.name LIKE ?
    	ORDER BY p.lastName, p.firstName, d.name, l.name');

  	$likeText = "%" . $_GET['txt'] . "%";

  	$query->bind_param("ssssss", $likeText, $likeText, $likeText, $likeText, $likeText, $likeText);

	$success = $query->execute();
	
	//query execution ERROR 400
	if (!$success) {
		sendJSONResponse(400, "failure", "Search all query execution failed", $executionTime, [
			"error" => $query->error
		], $conn["conn"]);
		exit;
	}
    
	$result = $query->get_result();

  	$found = [];

	//fetches all results and push to found array
	while ($row = mysqli_fetch_assoc($result)) {
		array_push($found, $row);
	}

	$query -> close();

	//success 200
	sendJSONResponse(200, "success", "search all query executed successfully", $executionTime, [
		"found" => $found
	], $conn["conn"]);

?>