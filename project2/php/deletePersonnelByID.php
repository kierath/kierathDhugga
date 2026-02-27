<?php
	//http://localhost/project2/php/deletePersonnelByID.php?id=<id>
	//remove next two lines for production
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

	//GET USER FOR CONFIRMATION
	if ($_SERVER['REQUEST_METHOD'] === 'GET') {

		$id = trim($_GET['id']);

		$userQuery = $conn["conn"]->prepare('SELECT firstName, lastName FROM personnel WHERE id = ?');
		$userQuery->bind_param("i", $id);
		$userQuery->execute();
		$row = $userQuery->get_result()->fetch_assoc();
		$userQuery->close();

		sendJSONResponse(200, "ok", "Personnel user retrieved", $executionTime, [
			"fullName" => $row["firstName"] . " " . $row["lastName"]
		], $conn["conn"]);
		exit;
	}

	//missing required parameters ERROR 400
	if(empty($_POST['id']) || !is_numeric($_POST['id'])) {
		sendJSONResponse(400, "failure", "Delete personnel missing required parameters", $executionTime, [], $conn["conn"]);
		exit;
	}

	$id = intval($_POST['id']);

	//check if personnel exists ERROR 400
	$check = $conn["conn"]->prepare('SELECT id FROM personnel WHERE id = ?');

	if(!$check) {
		sendJSONResponse(400, "failure", "Find personnel query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}

	$check->bind_param("i", $id);
	$check->execute();
	$result = $check->get_result();

	if ($result->num_rows == 0) {
		sendJSONResponse(400, "failure", "personnel does not exist", $executionTime, [
			"error" => "personnel does not exist"
		], $conn["conn"]);
		exit;
	}

	$check->close();

	$query = $conn["conn"]->prepare('DELETE FROM personnel WHERE id = ?');

	//query fail ERROR 400
	if(!$query) {
		sendJSONResponse(400, "failure", "Delete personnelquery preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}
	
	$query->bind_param("i", $id);

	//query execution fail ERROR 400
  	if(!$query->execute()) {
		sendJSONResponse(400, "failure", "Delete personnel query execution failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}

	$query->close();

	//success 200!
	sendJSONResponse(200, "success", "personnel deleted successfully", $executionTime, [
		"id" => $id,
		"message" => "personnel with id $id deleted successfully"
	], $conn["conn"]);

?>