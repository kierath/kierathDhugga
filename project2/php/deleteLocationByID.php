<?php
	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	include("libs.php");

	$executionTime = microtime(true);
	$conn = dbConnect();

	if ($conn["error"]) {
		sendJSONResponse(300, "failure", "database unavailable", $executionTime, [], null);
		exit;
	}

	//GET COUNT for deletion confirmation
	if ($_SERVER['REQUEST_METHOD'] === 'GET') {

		$id = trim($_GET['id']);

		$checkQuery = $conn["conn"]->prepare('SELECT COUNT(*) as total FROM department WHERE locationID = ?');
		$checkQuery->bind_param("i", $id);
		$checkQuery->execute();
		$row = $checkQuery->get_result()->fetch_assoc();
		$checkQuery->close();

		//get location name
		$nameQuery = $conn["conn"]->prepare('SELECT name FROM location WHERE id = ?');
		$nameQuery->bind_param("i", $id);
		$nameQuery->execute();
		$nameRow = $nameQuery->get_result()->fetch_assoc();
		$nameQuery->close();

		sendJSONResponse(200, "ok", "Departments assigned to this location retrieved", $executionTime, [
			"departmentCount" => (int)$row["total"],
			"locationName" => $nameRow["name"]
		], $conn["conn"]);
		exit;
	}
	
	//POST
	if(empty($_POST['id'])) {
		sendJSONResponse(400, "failure", "Location deletion missing required parameters", $executionTime, [
			"required" => "id"
		], $conn["conn"]);
		exit;
	}

	$id = trim($_POST['id']);

	$checkQuery = $conn["conn"]->prepare('SELECT COUNT(*) as total FROM department WHERE locationID = ?');

	if(!$checkQuery) {
		sendJSONResponse(400, "failure", "Delete location check query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}

	$checkQuery->bind_param("i", $id);
	$checkQuery->execute();
	$result = $checkQuery->get_result();
	$row = $result->fetch_assoc();
	$checkQuery->close();

	if($row['total'] > 0) {
		sendJSONResponse(400, "failure", "Cannot delete location. Departments are assigned to this location", $executionTime, [
			"departmentCount" => (int)$row["total"]
		], $conn["conn"]);
		exit;
	}

	$query = $conn["conn"]->prepare('DELETE FROM location WHERE id = ?');

	if(!$query) {
		sendJSONResponse(400, "failure", "Delete location query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}

	$query->bind_param("i", $id);
	$success = $query->execute();

	if (!$success) {
		sendJSONResponse(400, "failure", "Delete location query execution failed", $executionTime, [
			"error" => $query->error
		], $conn["conn"]);
		exit;
	}

	$query->close();

	sendJSONResponse(200, "ok", "Location deleted successfully", $executionTime, [
		"id" => $id,
		"message" => "Location with id $id deleted successfully",
	], $conn["conn"]);
?>