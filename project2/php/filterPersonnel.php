<?php
	//http://localhost/project2/php/filterPersonnel.php?departmentID=<departmentID>&locationID=<locationID>
	//remove next two lines for production
	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	include("libs.php");

	$executionTime = microtime(true);
	$conn = dbConnect();

	//database connection ERROR 300
	if ($conn["error"]) {
		sendJSONResponse(300, "failure", "database unavailable", $executionTime, [], null);
		exit;
	}

	// null makes the query ignore the filter, so if departmentID or locationID is not provided, it will return all personnel for that filter
    $departmentID = empty($_GET['departmentID']) ? null : $_GET['departmentID'];
    $locationID = empty($_GET['locationID']) ? null : $_GET['locationID'];

	$query = $conn["conn"]->prepare('SELECT
                p.id, p.firstName, p.lastName, p.jobTitle, p.email, 
                d.name AS department, 
                l.name AS location 
                FROM personnel p
                LEFT JOIN department d ON d.id = p.departmentID
                LEFT JOIN location l ON l.id = d.locationID
                WHERE (p.departmentID = ? OR ? IS NULL) AND (d.locationID = ? OR ? IS NULL)
                ORDER BY p.lastName, p.firstName');

    //query prep failed error 400
	if(!$query) {
		sendJSONResponse(400, "failure", "Filter personnel query preparation failed", $executionTime, [], $conn["conn"]);
		exit;
	}

	$query->bind_param("iiii", $departmentID, $departmentID, $locationID, $locationID);

	$success = $query->execute();
	
	//query execution failed error 400
	if (!$success) {
		sendJSONResponse(400, "failure", "Filter personnel query execution failed", $executionTime, [], $conn["conn"]);
		exit;
	}
    
	$result = $query->get_result();

   	$personnel = [];

	//fetch data and push to personnel array
	while ($row = mysqli_fetch_assoc($result)) {
		array_push($personnel, $row);
	}

	$query -> close();

	//success 200
	sendJSONResponse(200, "success", "personnel filtered", $executionTime, ["personnel" => $personnel], $conn["conn"]);

?>