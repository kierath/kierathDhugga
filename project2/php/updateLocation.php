<?php
	// http://localhost/project2/php/updateLocation.php?id=<id>
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
    
	if(empty($_POST['locationName']) || empty($_POST['id'])) {
		sendJSONResponse(400, "failure", "update location, locationName and id cannot be empty", $executionTime, [], $conn["conn"]);
		exit;
	}

    $locationID = $_POST['id'];
    $locationName = $_POST['locationName'];

	$query = $conn["conn"]->prepare('
                        UPDATE location 
                        SET name = ? 
                        WHERE id = ?');

	if (!$query) {
		sendJSONResponse(400, "failure", "Update location query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error,
		], $conn["conn"]);
		exit;
	}

                        //string s = s, integers = i
	$query->bind_param("si", $locationName, $locationID);

	$success = $query->execute();
	
	if (!$success) {
		sendJSONResponse(400, "failure", "Update location query execution failed", $executionTime, [
			"error" => $query->error,
		], $conn["conn"]);
		exit;
	}

	$query->close();

	//success 200!
	sendJSONResponse(200, "success", "Location updated successfully", $executionTime, [
		"updatedLocationName"=> $locationName,
		"updatedLocationID"=> $locationID,
	], $conn["conn"]);

?>