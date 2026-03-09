<?php
	//http://localhost/project2/php/addPersonnel.php?firstName=<firstName>&lastName=<lastName>&email=<email>&jobTitle=<jobTitle>&departmentID=<departmentID>
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

	//missing required parameters ERROR 400
	if(empty($_POST['firstName']) || empty($_POST['lastName']) || empty($_POST['email']) || empty($_POST['jobTitle']) || empty($_POST['departmentID'])) {
		sendJSONResponse(400, "failure", "Add personnel missing required parameters", $executionTime, [], $conn["conn"]);
		exit;
	}

	$firstName = trim($_POST['firstName']);
	$lastName = trim($_POST['lastName']);
	$email = trim($_POST['email']);
	$jobTitle = trim($_POST['jobTitle']);
	$departmentID = $_POST['departmentID'];

	//invalid email format ERROR 400
	if(!filter_var($email, FILTER_VALIDATE_EMAIL)) {
		sendJSONResponse(400, "failure", "Invalid email format", $executionTime, [
			"error" => "Invalid email format"
		], $conn["conn"]);
		exit;
	}

	//check if email already exists ERROR 400
	$checkQuery = $conn["conn"]->prepare('SELECT id FROM personnel WHERE email = ?');

	if(!$checkQuery) {
		sendJSONResponse(400, "failure", "Add personnel query preparation failed", $executionTime, [
		"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}

	$checkQuery->bind_param("s", $email);
	$checkQuery->execute();
	$result = $checkQuery->get_result();

	if ($result->num_rows > 0) {
		sendJSONResponse(400, "failure", "Email already exists in database", $executionTime, [
			"error" => "Email already exists in database"
		], $conn["conn"]);
		exit;
	}

	//insert personnel into database
	$query = $conn["conn"]->prepare('INSERT into personnel (firstName, lastName, email, jobTitle, departmentID) 
									 VALUES (?, ?, ?, ?, ?)');

    //query preparation ERROR 400
	if(!$query) {
		sendJSONResponse(400, "failure", "Add personnel query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}

	                   //string s = s, integers = i
	$query->bind_param("ssssi", $firstName, $lastName, $email, $jobTitle, $departmentID);

	$success = $query->execute();
	
	
	//failed ERROR 400
	if (!$success) {
		sendJSONResponse(400, "failure", "Add personnel query execution failed", $executionTime, [
			"error" => $query->error
		], $conn["conn"]);
		exit;
	}

	$query->close();
	
	//success 200!
	sendJSONResponse(200, "ok", "Employee added successfully", $executionTime, [
		"firstName" => $firstName,
		"lastName" => $lastName,
		"email" => $email,
		"jobTitle" => $jobTitle,
		"departmentID" => $departmentID,
	], $conn["conn"]);

?>