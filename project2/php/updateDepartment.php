<?php
	//http://localhost/project2/php/updateDepartment.php?departmentName=<departmentName>&locationID=<locationID>&id=<id>
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

	if(empty($_POST['departmentName']) || empty($_POST['locationID']) || empty($_POST['id'])) {
		sendJSONResponse(400, "failure", "update department, departmentName, locationID, and id cannot be empty", $executionTime, [], $conn["conn"]);
		exit;
	}
    
    $departmentID = $_POST['id'];
    $departmentName = $_POST['departmentName'];
    $locationID = $_POST['locationID'];

	$query = $conn["conn"]->prepare('
                        UPDATE department 
                        SET name = ?, locationID = ? 
                        WHERE id = ?');

                        //string s = s, integers = i

	if (!$query) {
		sendJSONResponse(400, "failure", "Update department query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}

	$query->bind_param("sii", $departmentName, $locationID, $departmentID);

	$success = $query->execute();
	
	if (!$success) {
		sendJSONResponse(400, "failure", "Update department query execution failed", $executionTime, [
			"error" => $query->error
		], $conn["conn"]);
		exit;
	}

	$query->close();

	//success 200!
	sendJSONResponse(200, "success", "Department updated successfully", $executionTime, [
		"id" => $departmentID,
		"name" => $departmentName,
		"locationID" => $locationID
	], $conn["conn"]);

?>