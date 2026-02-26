<?php
	//http://localhost/project2/php/searchLocations.php?txt=<txt>
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

	if(empty($_GET['txt'])) {
		sendJSONResponse(400, "failure", "search locations, txt cannot be empty", $executionTime, [], $conn["conn"]);
		exit;
	}

	$query = $conn["conn"]->prepare('
		SELECT id, name AS locationName
        FROM location
        WHERE name LIKE ?
		ORDER BY name
    ');

	//error 400 bad request, query preparation failed
	if(!$query) {
		sendJSONResponse(400, "failure", "search locations query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error,
		], $conn["conn"]);
		exit;
	}
                            
  	$likeText = "%" . $_GET['txt'] . "%";

  	$query->bind_param("s", $likeText);

	$success = $query->execute();
	
	//error 400 bad request, query execution failed
	if (!$success) {
		sendJSONResponse(400, "failure", "search locations query execution failed", $executionTime, [
			"error" => $query->error
		], $conn["conn"]);
		exit;
	}

	$result = $query->get_result();

  	$found = [];

	while ($row = mysqli_fetch_assoc($result)) {
		array_push($found, $row);
	}

	$query->close();
	
	//success 200!
	sendJSONResponse(200, "success", "search locations query executed successfully", $executionTime, [
		"found" => $found
	], $conn["conn"]);

?>