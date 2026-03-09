<?php
	//http://localhost/project2/php/deleteDepartmentByID.php?id=<id>
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

	//get count for delete
	if($_SERVER['REQUEST_METHOD'] === 'GET') {
		$id = trim($_GET['id']);
		
		//check query to see if employees are assigned
		$checkQuery = $conn["conn"]->prepare('SELECT COUNT(id) as total FROM personnel WHERE departmentID = ?');
		$checkQuery->bind_param("i", $id);
		$checkQuery->execute();
		$row = $checkQuery->get_result()->fetch_assoc();
		$checkQuery->close();

		//get name
		$nameQuery = $conn["conn"]->prepare('SELECT name FROM department WHERE id = ?');
		$nameQuery->bind_param("i", $id);
		$nameQuery->execute();
		$nameRow = $nameQuery->get_result()->fetch_assoc();
		$nameQuery->close();

		sendJSONResponse(200, "ok", "Personnel assigned to this department", $executionTime, [
			"personnelCount" => (int)$row["total"],
			"departmentName" => $nameRow["name"]
		], $conn["conn"]);
		exit;
	}

	//POST
	if(empty($_POST['id'])) {
		sendJSONResponse(400, "failure", "Delete department missing required id parameter", $executionTime, [], $conn["conn"]);
		exit;
	}

	$id = $_POST['id'];

	$checkQuery = $conn["conn"]->prepare('SELECT COUNT(id) as total FROM personnel WHERE departmentID = ?');

	if(!$checkQuery) {
		sendJSONResponse(400, "failure", "Delete department check query preparation failed", $executionTime, [
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
		sendJSONResponse(400, "failure", "Cannot delete department. Employees are assigned to this location", $executionTime, [
			"personnelCount" => (int)$row["total"]
		], $conn["conn"]);
		exit;
	}

	$query = $conn["conn"]->prepare('DELETE FROM department WHERE id = ?');

	//query preparation ERROR 400
	if(!$query) {
		sendJSONResponse(400, "failure", "Delete department query preparation failed", $executionTime, [
			"error" => $conn["conn"]->error
		], $conn["conn"]);
		exit;
	}
	
	$query->bind_param("i", $id);

	//failed ERROR 400
	if (!$query->execute()) {
	sendJSONResponse(400, "failure", "Delete department query execution failed", $executionTime, [
		"error" => $query->error], $conn["conn"]);
	exit;
	}

	$query->close();

	//success 200!
	sendJSONResponse(200, "ok", "Department deleted successfully", $executionTime, [
		"deletedDepartmentID" => $id,
	], $conn["conn"]);

?>