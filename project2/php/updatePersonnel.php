<?php
	// http://localhost/project2/php/updatePersonnel.php?id=<id>
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
    
    if(empty($_POST['id']) || empty($_POST['firstName']) || empty($_POST['lastName']) || empty($_POST['email']) || empty($_POST['jobTitle']) || empty($_POST['departmentID'])) {
		sendJSONResponse(400, "failure", "update personnel, id, firstName, lastName, email, jobTitle, and departmentID cannot be empty", $executionTime, [], $conn["conn"]);
		exit;
	}

    $id = $_POST['id'];
    $firstName = trim($_POST['firstName']);
    $lastName = trim($_POST['lastName']);
    $email = trim($_POST['email']);
    $jobTitle = trim($_POST['jobTitle']);
    $departmentID = $_POST['departmentID'];

	$query = $conn["conn"]->prepare('
                        UPDATE personnel 
                        SET firstName = ?, lastName = ?, email = ?, jobTitle = ?, departmentID = ? 
                        WHERE id = ?');

	if(!$query) {
		sendJSONResponse(400, "failure", "Update personnel query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}
                        //string s = s, integers = i
	$query->bind_param("ssssii", $firstName, $lastName, $email, $jobTitle, $departmentID, $id);

	$success = $query->execute();
	
	if (!$success) {
		sendJSONResponse(400, "failure", "Update personnel query execution failed", $executionTime, [
			"error" => $query->error
		], $conn["conn"]);
		exit;
	}

	$query->close();
	
	sendJSONResponse(200, "success", "Personnel updated successfully", $executionTime, [
		"id" => $id,
		"firstName" => $firstName,
		"lastName" => $lastName,
		"email" => $email,
		"jobTitle" => $jobTitle,
		"departmentID" => $departmentID
	], $conn["conn"]);

?>